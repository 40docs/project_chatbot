interface StreamingMessageProps {
  content: string;
  isComplete?: boolean;
}

export function StreamingMessage({ content, isComplete }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 dark:text-gray-100">
          {content}
          {!isComplete && (
            <span className="inline-block w-2 h-4 ml-1 bg-gray-400 dark:bg-gray-500 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
