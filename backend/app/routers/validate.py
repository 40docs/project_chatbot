from fastapi import APIRouter, HTTPException

from ..models import ValidateRequest, ValidationResponse, ErrorDetail
from ..services.providers import get_provider

router = APIRouter(prefix="/api/validate", tags=["validation"])


@router.post("/{provider_id}", response_model=ValidationResponse)
async def validate_credentials(provider_id: str, request: ValidateRequest):
    """Validate API credentials for a provider.

    Args:
        provider_id: The provider to validate against (e.g., 'anthropic', 'openai')
        request: Credentials to validate

    Returns:
        ValidationResponse with success/failure status
    """
    api_key = request.credentials.get("apiKey")

    # SageMaker and Bedrock use IAM authentication, not API keys
    if not api_key and provider_id not in ("sagemaker", "bedrock"):
        return ValidationResponse(
            valid=False,
            provider=provider_id,
            error=ErrorDetail(
                code="MISSING_API_KEY",
                message="API key is required"
            )
        )

    try:
        provider = get_provider(provider_id, api_key=api_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    is_valid, error = await provider.validate()

    if is_valid:
        return ValidationResponse(valid=True, provider=provider_id)

    return ValidationResponse(
        valid=False,
        provider=provider_id,
        error=ErrorDetail(
            code=error.code if error else "VALIDATION_FAILED",
            message=error.message if error else "Validation failed"
        )
    )
