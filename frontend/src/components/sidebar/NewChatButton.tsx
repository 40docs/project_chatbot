import { useChat } from '../../context/ChatContext';

interface NewChatButtonProps {
  collapsed?: boolean;
}

export function NewChatButton({ collapsed }: NewChatButtonProps) {
  const { createConversation } = useChat();

  return (
    <button
      onClick={createConversation}
      className={`flex items-center gap-2 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200 ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      {!collapsed && <span className="font-medium">New chat</span>}
    </button>
  );
}
