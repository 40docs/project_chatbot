import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSettings } from '../../context/SettingsContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { sendMessage } from '../../services/api';
import type { Message } from '../../types';

export function ChatContainer() {
  const { state, addMessage, updateStreamingMessage, setStreaming, getActiveConversation, createConversation } = useChat();
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
      createConversation();
      // Need to get the new conversation ID after creation
      // This is a limitation - we'll use setTimeout to wait for state update
      await new Promise(resolve => setTimeout(resolve, 0));
      conversationId = state.activeConversationId;
    }

    if (!conversationId) {
      console.error('No active conversation');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    addMessage(conversationId, userMessage);

    // Create placeholder for assistant message
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    addMessage(conversationId, assistantMessage);

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
          updateStreamingMessage(conversationId!, assistantMessageId, fullContent);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const errorContent = 'Sorry, an error occurred while processing your request.';
      updateStreamingMessage(conversationId, assistantMessageId, errorContent);
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
