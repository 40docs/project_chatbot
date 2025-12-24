import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, Message } from '../types';
import { generateUUID } from '../utils/uuid';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
}

type ChatAction =
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: { conversationId: string; messageId: string; content: string } }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'DELETE_CONVERSATION'; payload: string };

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  isStreaming: false
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        activeConversationId: action.payload.id
      };

    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversationId: action.payload
      };

    case 'ADD_MESSAGE': {
      const { conversationId, message } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, message],
                updatedAt: new Date(),
                title: conv.messages.length === 0 && message.role === 'user'
                  ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
                  : conv.title
              }
            : conv
        )
      };
    }

    case 'UPDATE_STREAMING_MESSAGE': {
      const { conversationId, messageId, content } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === messageId ? { ...msg, content } : msg
                )
              }
            : conv
        )
      };
    }

    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.payload
      };

    case 'DELETE_CONVERSATION':
      const newConversations = state.conversations.filter(c => c.id !== action.payload);
      return {
        ...state,
        conversations: newConversations,
        activeConversationId: state.activeConversationId === action.payload
          ? (newConversations[0]?.id ?? null)
          : state.activeConversationId
      };

    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  createConversation: () => string;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateStreamingMessage: (conversationId: string, messageId: string, content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  deleteConversation: (id: string) => void;
  getActiveConversation: () => Conversation | undefined;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const createConversation = (): string => {
    const newConversation: Conversation = {
      id: generateUUID(),
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
    return newConversation.id;
  };

  const setActiveConversation = (id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: id });
  };

  const addMessage = (conversationId: string, message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message } });
  };

  const updateStreamingMessage = (conversationId: string, messageId: string, content: string) => {
    dispatch({ type: 'UPDATE_STREAMING_MESSAGE', payload: { conversationId, messageId, content } });
  };

  const setStreaming = (isStreaming: boolean) => {
    dispatch({ type: 'SET_STREAMING', payload: isStreaming });
  };

  const deleteConversation = (id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  };

  const getActiveConversation = () => {
    return state.conversations.find(c => c.id === state.activeConversationId);
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        createConversation,
        setActiveConversation,
        addMessage,
        updateStreamingMessage,
        setStreaming,
        deleteConversation,
        getActiveConversation
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
