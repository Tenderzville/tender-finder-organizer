
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot } from "lucide-react";

// This component uses a simple interface to start
// You can connect it to an actual open-source AI API later
export const OpenSourceAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{text: string, isUser: boolean}[]>([
    {text: "Hello! I'm your open-source AI assistant. How can I help you today?", isUser: false}
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, {text: input, isUser: true}]);
    setIsLoading(true);
    
    // Here you would normally connect to an open-source AI API
    // For now, we'll just simulate a response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: "This is a placeholder response. In production, you would connect this to an open-source AI model API like Hugging Face or a self-hosted model.",
        isUser: false
      }]);
      setIsLoading(false);
    }, 1000);
    
    setInput('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot size={20} />
          Open Source Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.isUser 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button disabled={isLoading || !input.trim()} onClick={handleSend}>
            <Send size={18} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
