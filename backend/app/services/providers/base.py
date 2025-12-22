from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, List, Optional
from dataclasses import dataclass


@dataclass
class ProviderError:
    """Normalized error format for all providers."""
    code: str
    message: str
    provider: str
    raw_error: Optional[str] = None


@dataclass
class ModelInfo:
    """Information about an available model."""
    id: str
    name: str
    description: Optional[str] = None


class BaseProvider(ABC):
    """Abstract base class for LLM providers.

    All provider implementations must inherit from this class
    and implement the abstract methods.
    """

    # Provider identification
    provider_id: str = ""
    provider_name: str = ""

    # Default model for this provider
    default_model: str = ""

    def __init__(self, api_key: str, **kwargs):
        """Initialize the provider with credentials.

        Args:
            api_key: The API key for authentication
            **kwargs: Additional provider-specific configuration
        """
        self.api_key = api_key
        self.config = kwargs

    @abstractmethod
    async def validate(self) -> tuple[bool, Optional[ProviderError]]:
        """Validate the API credentials.

        Returns:
            Tuple of (is_valid, error). If valid, error is None.
        """
        pass

    @abstractmethod
    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Optional model override (uses default if not specified)
            **kwargs: Additional generation parameters

        Yields:
            Text chunks as they are generated
        """
        pass

    @abstractmethod
    def get_available_models(self) -> List[ModelInfo]:
        """Get list of available models for this provider.

        Returns:
            List of ModelInfo objects
        """
        pass

    def _normalize_error(self, error: Exception, code: str = "PROVIDER_ERROR") -> ProviderError:
        """Convert a provider-specific error to normalized format.

        Args:
            error: The original exception
            code: Error code to use

        Returns:
            Normalized ProviderError
        """
        return ProviderError(
            code=code,
            message=str(error),
            provider=self.provider_id,
            raw_error=repr(error)
        )
