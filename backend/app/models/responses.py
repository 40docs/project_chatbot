from typing import List, Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Normalized error detail."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")


class ValidationResponse(BaseModel):
    """Response from credential validation."""
    valid: bool = Field(..., description="Whether credentials are valid")
    provider: str = Field(..., description="Provider ID")
    error: Optional[ErrorDetail] = Field(
        None,
        description="Error details if validation failed"
    )


class ModelInfo(BaseModel):
    """Information about an available model."""
    id: str = Field(..., description="Model identifier")
    name: str = Field(..., description="Display name")
    description: Optional[str] = Field(None, description="Model description")


class ProviderInfo(BaseModel):
    """Information about an available provider."""
    id: str = Field(..., description="Provider identifier")
    name: str = Field(..., description="Display name")
    default_model: str = Field(..., description="Default model ID")
    models: List[ModelInfo] = Field(..., description="Available models")
