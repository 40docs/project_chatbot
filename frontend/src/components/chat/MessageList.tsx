import { useEffect, useRef } from 'react';
import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent?: string;
}

export function MessageList({ messages, isStreaming, streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">AI</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            How can I help you today?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Start a conversation by typing a message below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isStreaming && streamingContent !== undefined && (
          <StreamingMessage content={streamingContent} isComplete={false} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
