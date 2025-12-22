from typing import AsyncGenerator, Dict, List, Optional
import anthropic
from anthropic import APIError, AuthenticationError

from .base import BaseProvider, ProviderError, ModelInfo


class AnthropicProvider(BaseProvider):
    """Anthropic Claude API provider."""

    provider_id = "anthropic"
    provider_name = "Anthropic"
    default_model = "claude-sonnet-4-20250514"

    AVAILABLE_MODELS = [
        ModelInfo(
            id="claude-sonnet-4-20250514",
            name="Claude Sonnet 4",
            description="Latest balanced model - smart and fast"
        ),
        ModelInfo(
            id="claude-opus-4-20250514",
            name="Claude Opus 4",
            description="Most capable model for complex tasks"
        ),
        ModelInfo(
            id="claude-3-5-haiku-20241022",
            name="Claude 3.5 Haiku",
            description="Fastest model for simple tasks"
        ),
    ]

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, **kwargs)
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def validate(self) -> tuple[bool, Optional[ProviderError]]:
        """Validate API key by making a minimal API call."""
        try:
            # Make a minimal request to validate the key
            await self.client.messages.create(
                model=self.default_model,
                max_tokens=1,
                messages=[{"role": "user", "content": "hi"}]
            )
            return True, None
        except AuthenticationError as e:
            return False, ProviderError(
                code="INVALID_API_KEY",
                message="Invalid API key",
                provider=self.provider_id,
                raw_error=str(e)
            )
        except APIError as e:
            return False, ProviderError(
                code="API_ERROR",
                message=str(e.message) if hasattr(e, 'message') else str(e),
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
        """Generate streaming response from Claude."""
        model = model or self.default_model

        try:
            async with self.client.messages.stream(
                model=model,
                max_tokens=kwargs.get("max_tokens", 4096),
                messages=messages
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as e:
            # Yield error message as final chunk
            yield f"\n\n[Error: {str(e)}]"

    def get_available_models(self) -> List[ModelInfo]:
        """Return available Anthropic models."""
        return self.AVAILABLE_MODELS
