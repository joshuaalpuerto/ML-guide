import { Message } from 'ai';
import { clsx } from 'clsx';

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-lg px-4 py-3 text-sm',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={clsx(
          'rounded-lg p-3',
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-800',
        )}
      >
        <p className="font-medium">{isUser ? 'You' : 'AI'}</p>
        <p>{message.content}</p>
      </div>
    </div>
  );
}
