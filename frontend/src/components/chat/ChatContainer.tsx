import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSettings } from '../../context/SettingsContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { sendMessage } from '../../services/api';
import type { Message } from '../../types';

export function ChatContainer() {
  const { state, addMessage, setStreaming, getActiveConversation, createConversation } = useChat();
  const { state: settingsState, hasValidCredentials, toggleSettings } = useSettings();
  const [streamingContent, setStreamingContent] = useState('');

  const activeConversation = getActiveConversation();

  const handleSend = async (content: string) => {
    if (!hasValidCredentials()) {
      toggleSettings(true);
      return;
    }

    let conversationId = state.activeConversationId;

    // Create a new conversation if none exists
    if (!conversationId) {
      conversationId = createConversation();
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    addMessage(conversationId, userMessage);

    // Start streaming
    setStreaming(true);
    setStreamingContent('');

    try {
      let fullContent = '';

      await sendMessage(
        conversationId,
        content,
        settingsState.provider,
        settingsState.credentials,
        settingsState.model,
        (chunk: string) => {
          fullContent += chunk;
          setStreamingContent(fullContent);
        }
      );

      // Add assistant message after streaming completes
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date()
      };
      addMessage(conversationId, assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, an error occurred while processing your request.',
        timestamp: new Date()
      };
      addMessage(conversationId, assistantMessage);
    } finally {
      setStreaming(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-gray-50 dark:bg-gray-800">
      <MessageList
        messages={activeConversation?.messages || []}
        isStreaming={state.isStreaming}
        streamingContent={streamingContent}
      />
      <MessageInput
        onSend={handleSend}
        disabled={state.isStreaming}
      />
    </div>
  );
}
