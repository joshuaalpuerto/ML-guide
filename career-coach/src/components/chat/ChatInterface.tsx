'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { TextStreamChatTransport, generateId } from 'ai';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCVParsed } from '@/types/user-data';

export default function ChatInterface({ userCVInfo }: { userCVInfo: UserCVParsed }) {
  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({ api: '/api/chat' }),
    messages: [
      {
        id: generateId(), role: 'system', parts: [
          {
            type: 'text',
            text: `You are an intelligent job search assistant. Analyze the CV which contains skills, work experiences.\nSearch the internet for current job opportunities that match the my qualifications and interests.\nCV:\n${JSON.stringify(userCVInfo)}`
          }
        ]
      }
    ]
  });

  const [compactHeader, setCompactHeader] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    // Shrink header when user scrolls past small threshold
    if (top > 16) {
      if (!compactHeader) setCompactHeader(true);
    } else if (compactHeader) {
      setCompactHeader(false);
    }
  };

  const onSendMessage = (message: string) => {
    sendMessage({ text: message });
  }


  const messagesWithOutSystemMessage = messages.filter(m => m.role !== 'system');

  return (
    <Card className="flex flex-col h-full w-full rounded-lg shadow-none border-none py-0">
      <CardHeader className={`border-b transition-all duration-200 ${compactHeader ? '!py-1' : '!py-4'} px-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur`}>
        <CardTitle className={`font-semibold transition-all duration-200 ${compactHeader ? 'text-base' : 'text-lg'}`}>AI Career Coach</CardTitle>
      </CardHeader>
      <CardContent onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messagesWithOutSystemMessage.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
            <p>Please add your criteria so I can start matching Job postings based on your CV and preferences!</p>
          </div>
        )}
        {messagesWithOutSystemMessage.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <ChatInput onSendMessage={onSendMessage} status={status} />
      </CardFooter>
    </Card>
  );
}

function ChatInput({ onSendMessage, status }: { onSendMessage: (message: string) => void, status: string }) {
  const [inputValue, setInputValue] = useState('');
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-grow: reset height then set to scrollHeight for smooth expansion
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    onSendMessage(inputValue);
    setInputValue('');
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd+Enter / Ctrl+Enter; add new line on plain Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  const isSubmitting = status === 'submitted' || status === 'streaming'

  return (
    <form onSubmit={onSubmit} className="flex items-start w-full space-x-2">
      <Button variant="ghost" size="icon" disabled={isSubmitting}>
        <Paperclip className="h-5 w-5" />
      </Button>
      <div className="flex-1 flex items-end">
        <Textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 max-h-48 leading-relaxed overflow-y-auto"
          rows={isSubmitting ? 1 : 3}
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" size="icon" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </Button>
    </form>
  )
}
