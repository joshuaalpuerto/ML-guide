import { Message } from 'ai';
import { clsx } from 'clsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex items-start gap-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={clsx(
          'max-w-[75%] rounded-lg p-3 text-sm',
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800',
        )}
      >
        <p>{message.content}</p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
