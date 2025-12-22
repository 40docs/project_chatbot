import type { Conversation } from '../../types';
import { useChat } from '../../context/ChatContext';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  collapsed?: boolean;
}

export function ConversationItem({ conversation, isActive, collapsed }: ConversationItemProps) {
  const { setActiveConversation, deleteConversation } = useChat();

  const handleClick = () => {
    setActiveConversation(conversation.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(conversation.id);
  };

  if (collapsed) {
    return (
      <button
        onClick={handleClick}
        className={`w-full p-2 rounded-lg transition-colors ${
          isActive ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title={conversation.title}
      >
        <svg
          className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <svg
        className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
        {conversation.title}
      </span>
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity"
        aria-label="Delete conversation"
      >
        <svg
          className="w-4 h-4 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
