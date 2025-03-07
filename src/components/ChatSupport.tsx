
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Translations
  const t = {
    en: {
      chatWithUs: "Chat with Us",
      sendMessage: "Send Message",
      placeholder: "Type your message...",
      initialMessage: "Hello! How can I help you today?",
      loadingMessage: "Processing your request...",
      errorMessage: "Error sending message. Please try again.",
      close: "Close",
    },
    sw: {
      chatWithUs: "Ongea Nasi",
      sendMessage: "Tuma Ujumbe",
      placeholder: "Andika ujumbe wako...",
      initialMessage: "Jambo! Ninawezaje kukusaidia leo?",
      loadingMessage: "Inashughulikia ombi lako...",
      errorMessage: "Hitilafu kutuma ujumbe. Tafadhali jaribu tena.",
      close: "Funga",
    },
  };

  // Add initial message when chat is opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "initial-message",
          content: t[language].initialMessage,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, language, messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "sw" : "en"));
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      content: message,
      role: "user" as const,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // Get AI response from our Edge Function
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message,
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        },
      });

      if (error) throw error;

      // Add AI response
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error in chat:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: t[language].errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg"
        aria-label="Open chat support"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-80 sm:w-96 h-96 shadow-xl flex flex-col rounded-lg overflow-hidden z-50">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
            <h3 className="font-medium">{t[language].chatWithUs}</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-primary-foreground"
                onClick={toggleLanguage}
              >
                {language === "en" ? "🇰🇪" : "🇬🇧"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-primary-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] p-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] p-2 rounded-lg bg-gray-100">
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-75">.</span>
                    <span className="animate-bounce delay-150">.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t[language].placeholder}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
};
