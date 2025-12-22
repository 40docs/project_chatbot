from typing import AsyncGenerator, Dict, List, Optional
from openai import AsyncOpenAI, APIError, AuthenticationError

from .base import BaseProvider, ProviderError, ModelInfo


class OpenAIProvider(BaseProvider):
    """OpenAI GPT API provider."""

    provider_id = "openai"
    provider_name = "OpenAI"
    default_model = "gpt-4o"

    AVAILABLE_MODELS = [
        ModelInfo(
            id="gpt-4o",
            name="GPT-4o",
            description="Most capable model, multimodal"
        ),
        ModelInfo(
            id="gpt-4o-mini",
            name="GPT-4o Mini",
            description="Fast and affordable"
        ),
        ModelInfo(
            id="gpt-4-turbo",
            name="GPT-4 Turbo",
            description="Previous generation, high capability"
        ),
    ]

    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, **kwargs)
        self.client = AsyncOpenAI(api_key=api_key)

    async def validate(self) -> tuple[bool, Optional[ProviderError]]:
        """Validate API key by making a minimal API call."""
        try:
            # Make a minimal request to validate the key
            await self.client.chat.completions.create(
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
        """Generate streaming response from OpenAI."""
        model = model or self.default_model

        try:
            stream = await self.client.chat.completions.create(
                model=model,
                max_tokens=kwargs.get("max_tokens", 4096),
                messages=messages,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            # Yield error message as final chunk
            yield f"\n\n[Error: {str(e)}]"

    def get_available_models(self) -> List[ModelInfo]:
        """Return available OpenAI models."""
        return self.AVAILABLE_MODELS
