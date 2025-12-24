"""
SageMaker RAG Provider

Integrates with self-hosted LLM on AWS SageMaker with optional RAG
(Retrieval-Augmented Generation) via Query Processor Lambda.

This provider:
1. Validates SageMaker endpoint availability
2. Optionally retrieves context via Query Processor Lambda (RAG mode)
3. Streams responses from the LLM endpoint using Mistral prompt format
"""

import json
import logging
from typing import AsyncGenerator, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

from .base import BaseProvider, ProviderError, ModelInfo
from ...config import sagemaker_config

logger = logging.getLogger(__name__)


class SageMakerProvider(BaseProvider):
    """AWS SageMaker LLM provider with optional RAG support."""

    provider_id = "sagemaker"
    provider_name = "SageMaker RAG"
    default_model = "mistral-7b-instruct"

    AVAILABLE_MODELS = [
        ModelInfo(
            id="mistral-7b-instruct",
            name="Mistral 7B Instruct",
            description="Self-hosted Mistral model with optional RAG context"
        ),
    ]

    def __init__(self, api_key: str = "", **kwargs):
        """
        Initialize the SageMaker provider.

        Args:
            api_key: Not used (EC2 IAM role provides credentials)
            **kwargs: Additional configuration
                - rag_enabled: Whether to use RAG context (default: True)
        """
        # Note: api_key is not used - we rely on EC2 instance IAM role
        super().__init__(api_key, **kwargs)

        self.rag_enabled = kwargs.get("rag_enabled", True)
        self.endpoint_name = sagemaker_config.llm_endpoint_name
        self.query_lambda_name = sagemaker_config.query_lambda_name
        self.region = sagemaker_config.aws_region

        # Initialize AWS clients
        self.sagemaker_client = boto3.client(
            "sagemaker",
            region_name=self.region
        )
        self.runtime_client = boto3.client(
            "sagemaker-runtime",
            region_name=self.region
        )
        self.lambda_client = boto3.client(
            "lambda",
            region_name=self.region
        )

        logger.info(
            f"SageMakerProvider initialized: endpoint={self.endpoint_name}, "
            f"rag_enabled={self.rag_enabled}, lambda={self.query_lambda_name}"
        )

    async def validate(self) -> tuple[bool, Optional[ProviderError]]:
        """
        Validate that the SageMaker endpoint is available.

        Returns:
            Tuple of (is_valid, error). Checks endpoint status.
        """
        if not self.endpoint_name:
            return False, ProviderError(
                code="not_configured",
                message="SageMaker endpoint not configured. Set SAGEMAKER_LLM_ENDPOINT environment variable.",
                provider=self.provider_id
            )

        try:
            response = self.sagemaker_client.describe_endpoint(
                EndpointName=self.endpoint_name
            )
            status = response.get("EndpointStatus", "Unknown")

            if status == "InService":
                logger.info(f"Endpoint {self.endpoint_name} is InService")
                return True, None
            elif status in ["Creating", "Updating"]:
                return False, ProviderError(
                    code="endpoint_starting",
                    message=f"Endpoint is starting ({status}). This may take 5-10 minutes.",
                    provider=self.provider_id
                )
            else:
                return False, ProviderError(
                    code="endpoint_unavailable",
                    message=f"Endpoint status: {status}",
                    provider=self.provider_id
                )

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            if error_code == "ValidationException":
                return False, ProviderError(
                    code="endpoint_not_found",
                    message=f"Endpoint '{self.endpoint_name}' not found",
                    provider=self.provider_id,
                    raw_error=str(e)
                )
            return False, ProviderError(
                code="aws_error",
                message=str(e),
                provider=self.provider_id,
                raw_error=str(e)
            )
        except Exception as e:
            return False, self._normalize_error(e)

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response from SageMaker LLM.

        If RAG is enabled, first retrieves context from Query Processor Lambda.
        Then formats prompt and streams response from LLM endpoint.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model override (ignored, uses configured endpoint)
            **kwargs:
                - rag_enabled: Override RAG setting for this request

        Yields:
            Text chunks as they are generated
        """
        rag_enabled = kwargs.get("rag_enabled", self.rag_enabled)

        # Get the user's latest message
        user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break

        if not user_message:
            yield "[Error: No user message found]"
            return

        try:
            # Optionally retrieve RAG context
            context = None
            if rag_enabled and self.query_lambda_name:
                logger.info("Retrieving RAG context...")
                context = await self._get_rag_context(user_message)
                if context:
                    logger.info(
                        f"Retrieved {context.get('chunks_included', 0)} chunks, "
                        f"~{context.get('estimated_tokens', 0)} tokens"
                    )

            # Format prompt with Mistral template
            prompt = self._format_prompt(messages, context)

            # Invoke LLM endpoint with streaming
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": kwargs.get("max_tokens", 1000),
                    "temperature": kwargs.get("temperature", 0.7),
                    "top_p": kwargs.get("top_p", 0.95),
                    "do_sample": True,
                    "return_full_text": False,
                    "stop": ["</s>", "[INST]"]
                }
            }

            logger.info(f"Invoking LLM endpoint: {self.endpoint_name}")

            # Try streaming first, fall back to non-streaming
            try:
                response = self.runtime_client.invoke_endpoint_with_response_stream(
                    EndpointName=self.endpoint_name,
                    ContentType="application/json",
                    Body=json.dumps(payload),
                )

                # Parse streaming response
                async for chunk in self._parse_stream(response):
                    yield chunk

            except Exception as stream_error:
                logger.warning(f"Streaming failed, falling back to non-streaming: {stream_error}")

                # Fallback to non-streaming endpoint
                response = self.runtime_client.invoke_endpoint(
                    EndpointName=self.endpoint_name,
                    ContentType="application/json",
                    Body=json.dumps(payload),
                )

                result = json.loads(response["Body"].read().decode())
                logger.info(f"Non-streaming response: {result}")

                # Parse response - can be list or dict
                if isinstance(result, list) and len(result) > 0:
                    generated = result[0].get("generated_text", "")
                elif isinstance(result, dict):
                    generated = result.get("generated_text", "")
                else:
                    generated = str(result)

                # Yield as a single chunk
                if generated:
                    yield generated

        except ClientError as e:
            error_msg = str(e)
            logger.error(f"SageMaker error: {error_msg}")
            yield f"\n\n[Error: {error_msg}]"
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            yield f"\n\n[Error: {str(e)}]"

    async def _get_rag_context(self, question: str) -> Optional[Dict]:
        """
        Retrieve context from Query Processor Lambda.

        Args:
            question: The user's question

        Returns:
            Context dict with 'formatted_text' and 'chunks', or None on error
        """
        try:
            response = self.lambda_client.invoke(
                FunctionName=self.query_lambda_name,
                InvocationType="RequestResponse",
                Payload=json.dumps({"question": question})
            )

            payload = json.loads(response["Payload"].read().decode())

            # Handle Lambda response format
            if "statusCode" in payload:
                if payload["statusCode"] == 200:
                    body = json.loads(payload.get("body", "{}"))
                    return body.get("context")
                else:
                    logger.warning(f"Query Lambda returned status {payload['statusCode']}")
                    return None
            else:
                # Direct response format
                return payload.get("context")

        except Exception as e:
            logger.error(f"Failed to retrieve RAG context: {e}")
            return None

    def _format_prompt(
        self,
        messages: List[Dict[str, str]],
        context: Optional[Dict] = None
    ) -> str:
        """
        Format prompt using Mistral Instruct template.

        Args:
            messages: Conversation messages
            context: Optional RAG context with 'formatted_text'

        Returns:
            Formatted prompt string
        """
        # Build system message
        if context and context.get("formatted_text"):
            system_content = (
                "You are a helpful assistant. Answer based on the provided context. "
                "If the context doesn't contain relevant information, say so and provide "
                "your best answer based on your knowledge.\n\n"
                f"Context:\n{context['formatted_text']}"
            )
        else:
            system_content = "You are a helpful assistant."

        # Get conversation history (last few messages for context)
        conversation = []
        for msg in messages[-10:]:  # Limit history to avoid token overflow
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ["user", "assistant"]:
                conversation.append({"role": role, "content": content})

        # Format as Mistral Instruct
        # <s>[INST] {system}\n\n{user_message} [/INST] {assistant_response}</s>[INST] {next_user} [/INST]
        prompt_parts = []

        for i, msg in enumerate(conversation):
            if msg["role"] == "user":
                if i == 0:
                    # First user message includes system prompt
                    prompt_parts.append(
                        f"<s>[INST] {system_content}\n\n{msg['content']} [/INST]"
                    )
                else:
                    prompt_parts.append(f"[INST] {msg['content']} [/INST]")
            elif msg["role"] == "assistant":
                prompt_parts.append(f"{msg['content']}</s>")

        return "".join(prompt_parts)

    async def _parse_stream(self, response) -> AsyncGenerator[str, None]:
        """
        Parse streaming response from SageMaker TGI endpoint.

        The TGI container streams JSON objects with token information.

        Args:
            response: SageMaker invoke_endpoint_with_response_stream response

        Yields:
            Text tokens as they arrive
        """
        buffer = ""

        for event in response.get("Body", []):
            if "PayloadPart" in event:
                chunk_bytes = event["PayloadPart"].get("Bytes", b"")
                chunk_str = chunk_bytes.decode("utf-8")
                buffer += chunk_str

                # TGI streams newline-delimited JSON
                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    line = line.strip()

                    if not line:
                        continue

                    try:
                        data = json.loads(line)

                        # TGI streaming format
                        if "token" in data:
                            token_text = data["token"].get("text", "")
                            if token_text:
                                yield token_text
                        elif "generated_text" in data:
                            # Final response (non-streaming fallback)
                            yield data["generated_text"]

                    except json.JSONDecodeError:
                        # Might be partial JSON, continue buffering
                        buffer = line + "\n" + buffer
                        break

        # Process any remaining buffer
        if buffer.strip():
            try:
                data = json.loads(buffer)
                if "generated_text" in data:
                    yield data["generated_text"]
                elif "token" in data:
                    yield data["token"].get("text", "")
            except json.JSONDecodeError:
                pass

    def get_available_models(self) -> List[ModelInfo]:
        """Return available models (just the configured endpoint)."""
        return self.AVAILABLE_MODELS
