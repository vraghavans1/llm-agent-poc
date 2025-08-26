import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Minimal health check endpoint (optional)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      server: 'LLM Agent POC - Client-Side Only',
      timestamp: new Date().toISOString(),
      note: 'All API calls handled client-side'
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}