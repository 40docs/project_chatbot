"""
Amazon Bedrock RAG Provider

Integrates with Amazon Bedrock Knowledge Base for Retrieval-Augmented Generation.
Uses the RetrieveAndGenerate API with optional Guardrail filtering.

Authentication: IRSA (IAM Roles for Service Accounts) - no API key required.
The pod's ServiceAccount provides temporary credentials via OIDC token exchange.

Security:
- InvokeModel restricted via aws:CalledVia (only allowed through RAG, not directly)
- Retrieve/RetrieveAndGenerate scoped to specific Knowledge Base ARN
- Guardrails filter PII and harmful content from responses
"""

import json
import logging
from typing import AsyncGenerator, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from .base import BaseProvider, ModelInfo, ProviderError
from ...config import bedrock_config

logger = logging.getLogger(__name__)


class BedrockProvider(BaseProvider):
    """Amazon Bedrock Knowledge Base provider with Guardrail support."""

    provider_id = "bedrock"
    provider_name = "Amazon Bedrock RAG"
    default_model = "anthropic.claude-3-haiku-20240307-v1:0"

    AVAILABLE_MODELS = [
        ModelInfo(
            id="anthropic.claude-3-haiku-20240307-v1:0",
            name="Claude 3 Haiku",
            description="Fast, cost-effective model for RAG queries (ca-central-1)"
        ),
    ]

    def __init__(self, api_key: str = "", **kwargs):
        """Initialize the Bedrock provider.

        Args:
            api_key: Not used (IRSA provides credentials)
            **kwargs: Additional configuration
                - rag_enabled: Whether to use RAG context (default: True)
        """
        super().__init__(api_key, **kwargs)

        self.knowledge_base_id = bedrock_config.knowledge_base_id
        self.guardrail_id = bedrock_config.guardrail_id
        self.guardrail_version = bedrock_config.guardrail_version
        self.region = bedrock_config.aws_region
        self.model_id = bedrock_config.model_id or self.default_model
        self.rag_enabled = kwargs.get("rag_enabled", True)

        self.model_arn = f"arn:aws:bedrock:{self.region}::foundation-model/{self.model_id}"

        # Initialize AWS client (uses IRSA credentials automatically)
        self.agent_runtime = boto3.client(
            "bedrock-agent-runtime",
            region_name=self.region
        )

        logger.info(
            f"BedrockProvider initialized: kb={self.knowledge_base_id}, "
            f"guardrail={self.guardrail_id}, model={self.model_id}, "
            f"region={self.region}"
        )

    async def validate(self) -> tuple[bool, Optional[ProviderError]]:
        """Validate that the Bedrock Knowledge Base is accessible.

        Returns:
            Tuple of (is_valid, error). Checks IRSA credentials and KB access.
        """
        if not self.knowledge_base_id:
            return False, ProviderError(
                code="not_configured",
                message="Knowledge Base ID not configured. Set BEDROCK_KNOWLEDGE_BASE_ID environment variable.",
                provider=self.provider_id
            )

        try:
            # Test credentials and KB access with a minimal retrieve call
            self.agent_runtime.retrieve(
                knowledgeBaseId=self.knowledge_base_id,
                retrievalQuery={"text": "test"},
                retrievalConfiguration={
                    "vectorSearchConfiguration": {"numberOfResults": 1}
                }
            )
            logger.info(f"Knowledge Base {self.knowledge_base_id} is accessible")
            return True, None

        except NoCredentialsError:
            return False, ProviderError(
                code="no_credentials",
                message="No AWS credentials found. Ensure IRSA ServiceAccount is configured.",
                provider=self.provider_id
            )
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            if error_code == "AccessDeniedException":
                return False, ProviderError(
                    code="access_denied",
                    message="Access denied. Check IRSA role permissions for bedrock:Retrieve.",
                    provider=self.provider_id,
                    raw_error=str(e)
                )
            elif error_code == "ResourceNotFoundException":
                return False, ProviderError(
                    code="kb_not_found",
                    message=f"Knowledge Base '{self.knowledge_base_id}' not found.",
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
        """Generate response using Bedrock Knowledge Base RetrieveAndGenerate.

        Retrieves relevant document chunks from OpenSearch and generates
        a grounded response using Claude, with optional Guardrail filtering.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model override (uses configured model if not specified)
            **kwargs:
                - rag_enabled: Override RAG setting for this request

        Yields:
            Text chunks (full response yielded at once from RetrieveAndGenerate)
        """
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
            model_arn = self.model_arn
            if model and model != self.model_id:
                model_arn = f"arn:aws:bedrock:{self.region}::foundation-model/{model}"

            # Build Knowledge Base configuration
            kb_config = {
                "knowledgeBaseId": self.knowledge_base_id,
                "modelArn": model_arn,
            }

            # Add guardrail if configured
            if self.guardrail_id:
                kb_config["generationConfiguration"] = {
                    "guardrailConfiguration": {
                        "guardrailId": self.guardrail_id,
                        "guardrailVersion": self.guardrail_version,
                    }
                }

            logger.info(
                f"Calling RetrieveAndGenerate: kb={self.knowledge_base_id}, "
                f"model={model_arn}, guardrail={self.guardrail_id}"
            )

            response = self.agent_runtime.retrieve_and_generate(
                input={"text": user_message},
                retrieveAndGenerateConfiguration={
                    "type": "KNOWLEDGE_BASE",
                    "knowledgeBaseConfiguration": kb_config,
                }
            )

            # Extract response text
            output_text = response.get("output", {}).get("text", "")

            if output_text:
                yield output_text
            else:
                yield "I couldn't find relevant information to answer that question."

            # Log citations for debugging
            citations = response.get("citations", [])
            if citations:
                sources = []
                for citation in citations:
                    for ref in citation.get("retrievedReferences", []):
                        uri = ref.get("location", {}).get("s3Location", {}).get("uri", "")
                        if uri:
                            sources.append(uri)
                if sources:
                    logger.info(f"Citations: {sources}")

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            error_msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"Bedrock error [{error_code}]: {error_msg}")

            if error_code == "AccessDeniedException":
                yield "\n\n[Error: Access denied. Check IRSA permissions.]"
            elif error_code == "ThrottlingException":
                yield "\n\n[Error: Rate limited. Please try again in a moment.]"
            elif "guardrail" in error_msg.lower() or "blocked" in error_msg.lower():
                yield "I'm sorry, I can't provide that information as it may contain sensitive data."
            else:
                yield f"\n\n[Error: {error_msg}]"
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            yield f"\n\n[Error: {str(e)}]"

    def get_available_models(self) -> List[ModelInfo]:
        """Return available models for Bedrock RAG."""
        return self.AVAILABLE_MODELS
