// Frontend-only storage using localStorage for GitHub Pages deployment
export interface Message {
  id: string;
  content: string;
  role: string;
  model: string;
  timestamp: Date;
  sessionId: string;
}

class LocalStorage {
  private getMessages(sessionId: string): Message[] {
    const stored = localStorage.getItem(`messages-${sessionId}`);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch {
      return [];
    }
  }

  async getMessagesForSession(sessionId: string): Promise<Message[]> {
    return this.getMessages(sessionId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const messages = this.getMessages(message.sessionId);
    messages.push(newMessage);
    
    localStorage.setItem(`messages-${message.sessionId}`, JSON.stringify(messages));
    return newMessage;
  }

  async clearMessages(sessionId: string): Promise<void> {
    localStorage.removeItem(`messages-${sessionId}`);
  }
}

export const localStorage = new LocalStorage();