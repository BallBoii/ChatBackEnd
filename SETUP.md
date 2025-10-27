# 🚀 GhostRooms Setup Guide

This guide will help you get GhostRooms up and running.

## ✅ Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js 18 or higher installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Docker and Docker Compose installed (optional but recommended)
- [ ] PostgreSQL 16+ (if not using Docker)

## 📦 Installation Steps

### Step 1: Install Dependencies

```bash
pnpm install
```

This will install:
- Express & Socket.IO for server and WebSocket
- Prisma for database ORM
- TypeScript and type definitions
- nanoid for unique token generation
- All other dependencies

### Step 2: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your settings (or keep defaults for development)

### Step 3: Start Database

#### Option A: Using Docker (Recommended)
```bash
pnpm docker:up
```

This starts PostgreSQL and DUFS file server.

#### Option B: Using Local PostgreSQL
Make sure PostgreSQL is running and update `DATABASE_URL` in `.env`

### Step 4: Setup Database

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate
```

### Step 5: Start the Server

#### Development Mode (with hot reload)
```bash
pnpm dev
```

#### Production Mode
```bash
pnpm build
pnpm start
```

## 🧪 Testing the Installation

### 1. Check Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T...",
  "uptime": 1.234,
  "service": "GhostRooms Backend",
  "version": "1.0.0"
}
```

### 2. Create a Test Room
```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"ttlHours": 24}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "ghost-abc12345",
    "expiresAt": "2025-10-28T..."
  }
}
```

### 3. Join the Room
```bash
curl -X POST http://localhost:3000/api/rooms/ghost-abc12345/join \
  -H "Content-Type: application/json" \
  -d '{"nickname": "TestUser"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "sessionToken": "...",
    "nickname": "TestUser",
    "roomToken": "ghost-abc12345"
  }
}
```

## 🔧 Common Issues

### Issue: Port 3000 already in use
**Solution**: Change `PORT` in `.env` file

### Issue: Database connection fails
**Solution**: 
- Check if PostgreSQL is running: `docker ps` (if using Docker)
- Verify `DATABASE_URL` in `.env`
- Ensure database exists: `adminDB`

### Issue: Prisma Client not generated
**Solution**: Run `pnpm prisma:generate`

### Issue: TypeScript compilation errors
**Solution**: 
1. Install missing dependency: `pnpm install nanoid`
2. Clear build cache: `rm -rf dist`
3. Rebuild: `pnpm build`

## 📊 Database Management

### View Database GUI
```bash
pnpm prisma:studio
```
Opens at `http://localhost:5555`

### Reset Database (Development Only!)
```bash
pnpm prisma:migrate reset
```

### Push Schema Changes (Development)
```bash
pnpm db:push
```

## 🐳 Docker Commands

```bash
# Start services
pnpm docker:up

# Stop services
pnpm docker:down

# View logs
pnpm docker:logs

# Restart services
docker-compose restart

# View running containers
docker ps
```

## 🎯 Next Steps

1. **Test WebSocket Connection**: Use a Socket.IO client or the frontend
2. **Configure Rate Limits**: Adjust in `.env` as needed
3. **Set CORS Origin**: Update `CORS_ORIGIN` for your frontend URL
4. **Configure File Server**: If using file uploads, ensure DUFS is running

## 📝 Project Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm prisma:generate` | Generate Prisma Client |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm prisma:studio` | Open database GUI |
| `pnpm docker:up` | Start Docker containers |
| `pnpm docker:down` | Stop Docker containers |

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Client App    │
│  (WebSocket +   │
│    REST API)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│        Express + Socket.IO          │
│  (server.ts)                        │
└──────┬──────────────────────────────┘
       │
       ├──► Middlewares (error, rate limit, sanitize)
       │
       ├──► Routes (REST API)
       │     └──► Controllers
       │           └──► Services
       │                 └──► Repositories
       │                       └──► Prisma
       │
       └──► Socket Handlers
             └──► Services
                   └──► Repositories
                         └──► Prisma
                               └──► PostgreSQL
```

## 🎉 You're All Set!

Your GhostRooms backend is now running and ready to accept connections!

- **Server**: http://localhost:3000
- **Health**: http://localhost:3000/health
- **WebSocket**: ws://localhost:3000
- **Database GUI**: http://localhost:5555 (when Prisma Studio is running)

For more information, see the main [README.md](./README.md)
