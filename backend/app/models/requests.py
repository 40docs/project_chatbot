from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ValidateRequest(BaseModel):
    """Request to validate provider credentials."""
    credentials: Dict[str, str] = Field(
        ...,
        description="Provider credentials (e.g., {'apiKey': 'sk-...'})"
    )


class Message(BaseModel):
    """A single chat message."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request to send a chat message."""
    conversation_id: str = Field(..., alias="conversationId")
    message: str = Field(..., description="User message content")
    provider: str = Field(..., description="Provider ID (e.g., 'anthropic', 'openai')")
    credentials: Dict[str, str] = Field(
        ...,
        description="Provider credentials"
    )
    model: Optional[str] = Field(
        None,
        description="Optional model override"
    )
    history: Optional[List[Message]] = Field(
        default=None,
        description="Optional conversation history"
    )
    rag_enabled: Optional[bool] = Field(
        default=True,
        alias="ragEnabled",
        description="Enable RAG context retrieval (SageMaker provider only)"
    )

    class Config:
        populate_by_name = True
