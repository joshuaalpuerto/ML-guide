'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { TextStreamChatTransport, generateId } from 'ai';
import { Input } from '@/components/ui/input';
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
  const [inputValue, setInputValue] = useState('');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    sendMessage({ text: inputValue });
    setInputValue('');
  }

  const isSubmitting = status === 'submitted' || status === 'streaming'
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
        <form onSubmit={onSubmit} className="flex items-center w-full space-x-2">
          <Button variant="ghost" size="icon" disabled={isSubmitting}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button type="submit" size="icon" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
