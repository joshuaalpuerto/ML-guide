import { UIMessage } from 'ai';
import clsx from 'clsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
// Custom markdown rendering to control overflow & styling for code blocks

export default function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';

  return message.parts.map((part, index) => {
    return part.type === 'text' ? (
      <div
        key={index}
        className={
          clsx(
            'flex items-start gap-3',
            isUser ? 'justify-end' : 'justify-start',
          )
        }
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
          <div className={clsx('markdown space-y-2', !isUser && 'text-gray-900 dark:text-gray-100')}>
            <ReactMarkdown
              components={markdownComponents(isUser)}
            >
              {part.text.replace(/\n/g, '  \n')}
            </ReactMarkdown>
          </div>
        </div>
        {isUser && (
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>You</AvatarFallback>
          </Avatar>
        )}
      </div>
    ) : null;
  });
}

// Separated to avoid re-creating objects for every message unnecessarily (could memoize if needed)
function markdownComponents(isUser: boolean): Components {
  return {
    p: ({ children }) => <p className="leading-relaxed break-words">{children}</p>,
    ul: ({ children }) => <ul className="list-disc ml-5 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="break-words">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ children, href }) => (
      <a
        href={href as string}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 font-medium hover:text-blue-600 dark:hover:text-blue-400"
      >
        {children}
      </a>
    ),
    code(codeProps) {
      // react-markdown passes: node, inline, className, children, ...rest
      const { inline, className, children, ...rest } = codeProps as any;
      const content = children as React.ReactNode;
      if (inline) {
        return (
          <code
            className={clsx(
              'rounded bg-gray-200 dark:bg-gray-700 px-1 py-0.5 font-mono text-[0.85em] break-words',
              isUser && 'bg-blue-600/40'
            )}
            {...rest}
          >
            {content}
          </code>
        );
      }
      return (
        <pre
          className={clsx(
            'my-2 max-w-full overflow-x-auto rounded-md',
            'bg-gray-900 text-gray-100 p-3 shadow-inner'
          )}
        >
          <code className={clsx('font-mono text-xs whitespace-pre', className)} {...rest}>
            {content}
          </code>
        </pre>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic text-sm opacity-90">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-3 border-gray-300 dark:border-gray-700" />,
  } as Components;
}
