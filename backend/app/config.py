"""
Configuration for AWS provider integrations.

Environment variables are injected by Terraform/docker-compose from
infrastructure outputs.
"""

import os


class SageMakerConfig:
    """SageMaker endpoint configuration loaded from environment."""

    def __init__(self):
        self.llm_endpoint_name = os.getenv("SAGEMAKER_LLM_ENDPOINT", "")
        self.embedding_endpoint_name = os.getenv("SAGEMAKER_EMBEDDING_ENDPOINT", "")
        self.query_lambda_name = os.getenv("QUERY_PROCESSOR_LAMBDA", "")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")

    @property
    def is_configured(self) -> bool:
        """Check if SageMaker endpoints are configured."""
        return bool(self.llm_endpoint_name)

    def __repr__(self) -> str:
        return (
            f"SageMakerConfig("
            f"llm_endpoint={self.llm_endpoint_name!r}, "
            f"query_lambda={self.query_lambda_name!r}, "
            f"region={self.aws_region!r})"
        )


class BedrockConfig:
    """Amazon Bedrock Knowledge Base configuration loaded from environment."""

    def __init__(self):
        self.knowledge_base_id = os.getenv("BEDROCK_KNOWLEDGE_BASE_ID", "")
        self.guardrail_id = os.getenv("BEDROCK_GUARDRAIL_ID", "")
        self.guardrail_version = os.getenv("BEDROCK_GUARDRAIL_VERSION", "DRAFT")
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
        self.aws_region = os.getenv("AWS_REGION", "ca-central-1")

    @property
    def is_configured(self) -> bool:
        """Check if Bedrock Knowledge Base is configured."""
        return bool(self.knowledge_base_id)

    def __repr__(self) -> str:
        return (
            f"BedrockConfig("
            f"kb={self.knowledge_base_id!r}, "
            f"guardrail={self.guardrail_id!r}, "
            f"model={self.model_id!r}, "
            f"region={self.aws_region!r})"
        )


# Singleton instances
sagemaker_config = SageMakerConfig()
bedrock_config = BedrockConfig()
