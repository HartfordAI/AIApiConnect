import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Send, Trash2, Circle } from "lucide-react";
import { localStorage as storage, type Message } from "@/lib/storage";

// Available Puter AI models
const PUTER_MODELS = [
  { value: "gpt-5", label: "ChatGPT 5" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
  { value: "deepseek-chat", label: "DeepSeek Chat" },
  { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
  { value: "deepseek-v3", label: "DeepSeek V3.1" },
  { value: "grok-beta", label: "Grok" },
  { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash" },
  { value: "o1", label: "OpenAI o1" },
  { value: "o1-mini", label: "OpenAI o1 Mini" },
];

export default function ChatStandalone() {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-5");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Store selected model in localStorage
  useEffect(() => {
    const storedModel = window.localStorage.getItem('selectedModel');
    if (storedModel) {
      setSelectedModel(storedModel);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);

  // Load messages
  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  const loadMessages = async () => {
    const msgs = await storage.getMessagesForSession(sessionId);
    setMessages(msgs);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) {
      return;
    }

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Add user message to storage and state
      const userMsg = await storage.addMessage({
        content: userMessage,
        role: "user",
        model: selectedModel,
        sessionId,
      });
      setMessages(prev => [...prev, userMsg]);

      // Prepare conversation history for Puter
      const conversationHistory = [...messages, userMsg].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call Puter.js API
      // @ts-ignore - puter is loaded from external script
      const response = await window.puter.ai.chat(conversationHistory, {
        model: selectedModel,
        max_tokens: 1000
      });

      const aiContent = response.message?.content || response.toString() || "No response received";

      // Add AI response to storage and state
      const aiMsg = await storage.addMessage({
        content: aiContent,
        role: "assistant",
        model: selectedModel,
        sessionId,
      });
      setMessages(prev => [...prev, aiMsg]);

    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear the conversation?")) {
      await storage.clearMessages(sessionId);
      setMessages([]);
      toast({
        title: "Success",
        description: "Chat cleared successfully",
      });
    }
  };

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: "numeric", 
      minute: "2-digit" 
    });
  };

  const canSend = message.trim() && !isLoading;

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
              {/* AI Model Selection */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">AI Model:</label>
                <Select value={selectedModel} onValueChange={setSelectedModel} data-testid="select-model">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PUTER_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Clear Chat Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearChat}
                disabled={isLoading}
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
              <p className="text-sm">Start chatting with AI for free - no API key required!</p>
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
                    : PUTER_MODELS.find(m => m.value === msg.model)?.label || msg.model
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
          {isLoading && (
            <div className="flex justify-start mb-4" data-testid="loading-indicator">
              <div className="bg-card border border-border rounded-lg px-4 py-2 font-mono text-sm">
                <div className="text-xs text-muted-foreground mb-1">
                  {PUTER_MODELS.find(m => m.value === selectedModel)?.label || selectedModel}
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
                <Circle className="w-2 h-2 text-green-500 fill-current" />
                Connected
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