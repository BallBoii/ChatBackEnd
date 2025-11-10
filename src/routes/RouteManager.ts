import { Router } from "express";
import { RoomRouter } from './roomRouter';
import { MessageRouter } from './messageRouter';
import { FileRouter } from './fileRouter';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { sanitizeInput } from '@/middlewares/sanitize';
import express from 'express';
import path from 'path';
    
/**
 * Main RouterManager
 * Entry point for all API routing following Clean Architecture principles
 */
export class RouterManager {
    private readonly router: Router;

    constructor() {
        this.router = Router();
        this.initializeRouters();
    }

    private initializeRouters(): void {
        // Apply sanitization middleware to all routes
        this.router.use(sanitizeInput);
        
        // API routes
        this.router.use("/api/rooms", new RoomRouter().getRouter());
        this.router.use("/api/messages", new MessageRouter().getRouter());
        this.router.use("/api/files", new FileRouter().getRouter());

        // Serve static files (for development/fallback)
        this.router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
        
        // Health check (already defined in server.ts, but can be here too)
        this.router.get("/api/health", (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                service: 'GhostRooms APIIII',
                endpointssssssssssss: {
                    rooms: "/api/rooms",
                    messages: "/api/messages",
                    files: "/api/files",
                }
            });
        });
        
        // 404 handler for API routes
        this.router.use("/api/*", notFoundHandler);
    }

    public getRouter(): Router {
        return this.router;
    }
}
