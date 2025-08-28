import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatRequestSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get chat messages for a session
  app.get("/api/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message to AI
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, provider, sessionId, apiKey } = chatRequestSchema.parse(req.body);

      // Store user message
      await storage.createMessage({
        content: message,
        role: "user",
        provider,
        sessionId,
      });

      let aiResponse: string;

      if (provider === "openai") {
        const openai = new OpenAI({ apiKey });
        
        // Get conversation history
        const messages = await storage.getMessages(sessionId);
        const conversationHistory = messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }));

        const completion = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: conversationHistory,
          max_tokens: 1000,
        });

        aiResponse = completion.choices[0]?.message?.content || "No response received";
      } else if (provider === "deepseek") {
        // DeepSeek API integration
        const messages = await storage.getMessages(sessionId);
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: conversationHistory,
            max_tokens: 1000,
          })
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.statusText}`);
        }

        const data = await response.json();
        aiResponse = data.choices[0]?.message?.content || "No response received";
      } else {
        throw new Error("Invalid provider");
      }

      // Store AI response
      const aiMessage = await storage.createMessage({
        content: aiResponse,
        role: "assistant",
        provider,
        sessionId,
      });

      res.json({ message: aiMessage });
    } catch (error) {
      console.error("Chat error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to process chat message" });
      }
    }
  });

  // Clear chat messages
  app.delete("/api/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearMessages(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
