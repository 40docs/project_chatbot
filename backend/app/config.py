"""
Configuration for SageMaker RAG integration.

Environment variables are injected by Terraform/docker-compose from
the SageMaker infrastructure outputs.
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


# Singleton instance
sagemaker_config = SageMakerConfig()
