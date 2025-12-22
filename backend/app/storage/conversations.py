from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class Message:
    """A chat message."""
    role: str
    content: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Conversation:
    """A conversation with messages."""
    id: str
    title: str
    messages: List[Message] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "timestamp": m.timestamp.isoformat()
                }
                for m in self.messages
            ],
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


class ConversationStore:
    """In-memory conversation storage.

    For production, this would be replaced with a database backend.
    """

    def __init__(self):
        self._conversations: Dict[str, Conversation] = {}

    def get_conversation(self, conversation_id: str) -> Optional[dict]:
        """Get a conversation by ID."""
        conv = self._conversations.get(conversation_id)
        return conv.to_dict() if conv else None

    def get_all_conversations(self) -> List[dict]:
        """Get all conversations."""
        return [
            {
                "id": c.id,
                "title": c.title,
                "createdAt": c.created_at.isoformat(),
                "updatedAt": c.updated_at.isoformat(),
                "messageCount": len(c.messages)
            }
            for c in sorted(
                self._conversations.values(),
                key=lambda x: x.updated_at,
                reverse=True
            )
        ]

    def get_messages(self, conversation_id: str) -> List[Dict[str, str]]:
        """Get messages for a conversation."""
        conv = self._conversations.get(conversation_id)
        if not conv:
            return []
        return [{"role": m.role, "content": m.content} for m in conv.messages]

    def add_message(self, conversation_id: str, message: Dict[str, str]) -> None:
        """Add a message to a conversation.

        Creates the conversation if it doesn't exist.
        """
        if conversation_id not in self._conversations:
            # Create new conversation
            title = message.get("content", "")[:50]
            if len(message.get("content", "")) > 50:
                title += "..."
            self._conversations[conversation_id] = Conversation(
                id=conversation_id,
                title=title
            )

        conv = self._conversations[conversation_id]
        conv.messages.append(Message(
            role=message["role"],
            content=message["content"]
        ))
        conv.updated_at = datetime.now()

        # Update title from first user message if current title is empty
        if conv.title == "New conversation" and message["role"] == "user":
            conv.title = message["content"][:50]
            if len(message["content"]) > 50:
                conv.title += "..."

    def delete_conversation(self, conversation_id: str) -> None:
        """Delete a conversation."""
        self._conversations.pop(conversation_id, None)

    def clear_all(self) -> None:
        """Clear all conversations."""
        self._conversations.clear()


# Global store instance
conversation_store = ConversationStore()
