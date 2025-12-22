from typing import List
from fastapi import APIRouter

from ..models import ProviderInfo
from ..services.providers import get_available_providers

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("", response_model=List[ProviderInfo])
async def list_providers():
    """Get list of available LLM providers.

    Returns:
        List of providers with their available models
    """
    return get_available_providers()
