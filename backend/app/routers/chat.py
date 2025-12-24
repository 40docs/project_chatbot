import json
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from ..models import ChatRequest
from ..services.providers import get_provider
from ..storage.conversations import conversation_store

router = APIRouter(prefix="/api", tags=["chat"])


async def generate_sse_stream(
    provider_id: str,
    api_key: str,
    messages: list,
    model: str | None,
    conversation_id: str,
    user_message: str,
    rag_enabled: bool = True
) -> AsyncGenerator[dict, None]:
    """Generate SSE events from provider stream.

    Args:
        provider_id: Provider to use
        api_key: API key for provider
        messages: Conversation messages
        model: Optional model override
        conversation_id: ID of the conversation
        user_message: The user's message
        rag_enabled: Whether to enable RAG context (SageMaker only)

    Yields:
        SSE event dicts
    """
    try:
        provider = get_provider(provider_id, api_key=api_key, rag_enabled=rag_enabled)

        # Store user message
        conversation_store.add_message(
            conversation_id,
            {"role": "user", "content": user_message}
        )

        full_response = ""

        async for chunk in provider.generate_stream(messages, model=model, rag_enabled=rag_enabled):
            full_response += chunk
            yield {"data": json.dumps({"content": chunk})}

        # Store assistant response
        conversation_store.add_message(
            conversation_id,
            {"role": "assistant", "content": full_response}
        )

        yield {"data": "[DONE]"}

    except Exception as e:
        yield {"data": json.dumps({"error": str(e)})}
        yield {"data": "[DONE]"}


@router.post("/chat")
async def chat(request: ChatRequest):
    """Send a chat message and receive streaming response.

    Args:
        request: Chat request with message and credentials

    Returns:
        SSE stream of response chunks
    """
    api_key = request.credentials.get("apiKey", "")

    # SageMaker provider doesn't require an API key (uses IAM)
    if not api_key and request.provider != "sagemaker":
        raise HTTPException(status_code=400, detail="API key is required")

    try:
        # Verify provider exists
        get_provider(request.provider, api_key=api_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build messages list
    messages = []

    # Add history from request if provided
    if request.history:
        messages.extend([{"role": m.role, "content": m.content} for m in request.history])

    # Or get from stored conversations
    else:
        stored_messages = conversation_store.get_messages(request.conversation_id)
        messages.extend(stored_messages)

    # Add the new user message
    messages.append({"role": "user", "content": request.message})

    return EventSourceResponse(
        generate_sse_stream(
            provider_id=request.provider,
            api_key=api_key,
            messages=messages,
            model=request.model,
            conversation_id=request.conversation_id,
            user_message=request.message,
            rag_enabled=request.rag_enabled
        )
    )


@router.get("/conversations")
async def list_conversations():
    """Get all stored conversations.

    Returns:
        List of conversation summaries
    """
    return conversation_store.get_all_conversations()


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation.

    Args:
        conversation_id: ID of conversation to retrieve

    Returns:
        Conversation with messages
    """
    conversation = conversation_store.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation.

    Args:
        conversation_id: ID of conversation to delete
    """
    conversation_store.delete_conversation(conversation_id)
    return {"status": "deleted"}
