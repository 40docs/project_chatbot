from typing import Dict, List, Type

from .base import BaseProvider, ModelInfo
from .anthropic import AnthropicProvider
from .openai import OpenAIProvider


# Registry of available providers
PROVIDERS: Dict[str, Type[BaseProvider]] = {
    "anthropic": AnthropicProvider,
    "openai": OpenAIProvider,
}


def get_provider(provider_id: str, api_key: str, **kwargs) -> BaseProvider:
    """Get a provider instance by ID.

    Args:
        provider_id: The provider identifier (e.g., 'anthropic', 'openai')
        api_key: API key for the provider
        **kwargs: Additional provider-specific configuration

    Returns:
        Configured provider instance

    Raises:
        ValueError: If provider_id is not recognized
    """
    provider_class = PROVIDERS.get(provider_id)
    if not provider_class:
        raise ValueError(f"Unknown provider: {provider_id}. Available: {list(PROVIDERS.keys())}")

    return provider_class(api_key=api_key, **kwargs)


def get_available_providers() -> List[Dict]:
    """Get list of available providers with their info.

    Returns:
        List of provider info dicts
    """
    providers = []
    for provider_id, provider_class in PROVIDERS.items():
        providers.append({
            "id": provider_id,
            "name": provider_class.provider_name,
            "default_model": provider_class.default_model,
            "models": [
                {"id": m.id, "name": m.name, "description": m.description}
                for m in provider_class(api_key="").get_available_models()
            ]
        })
    return providers
