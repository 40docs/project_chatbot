import { useChat } from '../../context/ChatContext';
import { NewChatButton } from './NewChatButton';
import { ConversationItem } from './ConversationItem';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { state } = useChat();

  return (
    <aside
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3">
        <NewChatButton collapsed={collapsed} />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {state.conversations.map(conversation => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === state.activeConversationId}
              collapsed={collapsed}
            />
          ))}
        </div>

        {state.conversations.length === 0 && !collapsed && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8 px-4">
            No conversations yet. Start a new chat!
          </p>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onToggle}
          className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
              collapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}
