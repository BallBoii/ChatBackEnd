import { Router } from "express";
import roomRouter from './roomRouter';
import messageRouter from './messageRouter';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { sanitizeInput } from '@/middlewares/sanitize';
    
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
        this.router.use("/api/rooms", roomRouter);
        this.router.use("/api/messages", messageRouter);
        
        // Health check (already defined in server.ts, but can be here too)
        this.router.get("/api/health", (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                service: 'GhostRooms API'
            });
        });
        
        // 404 handler for API routes
        this.router.use("/api/*", notFoundHandler);
    }

    public getRouter(): Router {
        return this.router;
    }
}
