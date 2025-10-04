'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { TextStreamChatTransport } from 'ai';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatInterface() {
  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({ api: '/api/chat' }),
  });
  const [inputValue, setInputValue] = useState('');

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

  return (
    <Card className="flex flex-col h-full w-full rounded-lg shadow-none border-none">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold">AI Career Coach</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Ask me anything about your career!</p>
            <p className="text-sm">Upload your CV to get started.</p>
          </div>
        )}
        {messages.map(m => (
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
