import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Message, ChatRequest } from "@shared/schema";
import { Terminal, Send, Trash2, Circle, Keyboard } from "lucide-react";

type Provider = "openai" | "deepseek" | "puter";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState<Provider>("puter");
  const [apiKey, setApiKey] = useState("");
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Store API key in sessionStorage
  useEffect(() => {
    const storedApiKey = sessionStorage.getItem(`apiKey-${provider}`);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, [provider]);

  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem(`apiKey-${provider}`, apiKey);
    }
  }, [apiKey, provider]);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", sessionId],
    enabled: !!sessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (chatRequest: ChatRequest) => {
      if (chatRequest.provider === "puter") {
        // Handle Puter.js directly in frontend
        const messages = await queryClient.getQueryData<Message[]>(["/api/messages", sessionId]) || [];
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Add current message to history
        conversationHistory.push({ role: "user", content: chatRequest.message });
        
        // Call Puter.js API
        // @ts-ignore - puter is loaded from external script
        const response = await window.puter.ai.chat(conversationHistory, {
          model: "gpt-4o",
          max_tokens: 1000
        });
        
        const aiContent = response.message?.content || response.toString() || "No response received";
        
        // Store the AI response in backend
        await apiRequest("POST", "/api/ai-response", {
          content: aiContent,
          provider: "puter",
          sessionId
        });
        
        return { success: true };
      } else {
        // Handle OpenAI and DeepSeek through backend
        const response = await apiRequest("POST", "/api/chat", chatRequest);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Clear messages mutation
  const clearMessagesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/messages/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
      toast({
        title: "Success",
        description: "Chat cleared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear chat",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessageMutation.isPending]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) {
      return;
    }
    
    // For puter, no API key required, for others, API key is required
    if (provider !== "puter" && !apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key is required for this provider",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      message: message.trim(),
      provider,
      sessionId,
      apiKey: provider === "puter" ? undefined : apiKey,
    });
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the conversation?")) {
      clearMessagesMutation.mutate();
    }
  };

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: "numeric", 
      minute: "2-digit" 
    });
  };

  const isConnected = provider === "puter" ? true : !!apiKey.trim();
  const canSend = message.trim() && (provider === "puter" || apiKey.trim()) && !sendMessageMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Terminal className="text-primary-foreground w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold">AI Chat Console</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Provider Selection */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Provider:</label>
                <Select value={provider} onValueChange={(value: Provider) => setProvider(value)} data-testid="select-provider">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="puter">Puter AI (Free)</SelectItem>
                    <SelectItem value="openai">ChatGPT</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* API Key Input - only show for providers that need it */}
              {provider !== "puter" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">API Key:</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-48"
                    data-testid="input-api-key"
                  />
                </div>
              )}
              
              {/* Clear Chat Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearChat}
                disabled={clearMessagesMutation.isPending}
                data-testid="button-clear-chat"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin" data-testid="chat-container">
          
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Terminal className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">Welcome to AI Chat Console</h3>
              <p className="text-sm">
                {provider === "puter" 
                  ? "Start chatting with AI for free using Puter" 
                  : "Enter your API key above and start chatting with AI"
                }
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-4 message-fade-in ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
              data-testid={`message-${msg.role}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-xs sm:max-w-md lg:max-w-lg font-mono text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                <div className={`text-xs mb-1 ${
                  msg.role === "user" ? "opacity-75" : "text-muted-foreground"
                }`}>
                  {msg.role === "user" 
                    ? "You" 
                    : msg.provider === "openai" 
                      ? "ChatGPT" 
                      : msg.provider === "deepseek" 
                        ? "DeepSeek" 
                        : "Puter AI"
                  }
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-xs mt-1 ${
                  msg.role === "user" ? "opacity-75" : "text-muted-foreground"
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {sendMessageMutation.isPending && (
            <div className="flex justify-start mb-4" data-testid="loading-indicator">
              <div className="bg-card border border-border rounded-lg px-4 py-2 font-mono text-sm">
                <div className="text-xs text-muted-foreground mb-1">
                  {provider === "openai" ? "ChatGPT" : provider === "deepseek" ? "DeepSeek" : "Puter AI"}
                </div>
                <div className="flex items-center gap-2 typing-indicator">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                className="min-h-[44px] max-h-32 resize-none font-mono"
                data-testid="textarea-message"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!canSend}
              data-testid="button-send"
            >
              <Send className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          
          {/* Status Bar */}
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1" data-testid="connection-status">
                <Circle className={`w-2 h-2 ${isConnected ? "text-green-500 fill-current" : "text-red-500 fill-current"}`} />
                {isConnected ? "Connected" : "Disconnected"}
              </span>
              <span data-testid="message-count">{messages.length} messages</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Enter</kbd>
              <span>to send</span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Shift+Enter</kbd>
              <span>new line</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
