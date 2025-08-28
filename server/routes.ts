import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatRequestSchema } from "@shared/schema";
import { z } from "zod";

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

  // Send message to AI (simplified for Puter-only)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, model, sessionId } = chatRequestSchema.parse(req.body);

      // Store user message
      await storage.createMessage({
        content: message,
        role: "user",
        model,
        sessionId,
      });

      // For Puter.js, we handle AI calls on the frontend
      // This endpoint just stores the user message and returns success
      res.json({ success: true, userMessageStored: true });
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

  // Store AI response from frontend (for Puter.js)
  app.post("/api/ai-response", async (req, res) => {
    try {
      const { content, model, sessionId } = req.body;
      
      if (!content || !model || !sessionId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const aiMessage = await storage.createMessage({
        content,
        role: "assistant",
        model,
        sessionId,
      });

      res.json({ message: aiMessage });
    } catch (error) {
      console.error("AI response storage error:", error);
      res.status(500).json({ error: "Failed to store AI response" });
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
