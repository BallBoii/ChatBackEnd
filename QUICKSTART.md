# ⚡ Quick Start Guide

Get GhostRooms running in 5 minutes!

## 🎯 TL;DR

```bash
# 1. Install dependencies
pnpm install

# 2. Start database
pnpm docker:up

# 3. Setup database
pnpm prisma:generate
pnpm prisma:migrate

# 4. Start server
pnpm dev
```

Server runs at `http://localhost:3000` 🎉

---

## 📋 What's Included

This setup gives you:

✅ **REST API** for room management  
✅ **WebSocket** for real-time messaging  
✅ **PostgreSQL** database  
✅ **DUFS** file server  
✅ **Auto-cleanup** of expired data  
✅ **Rate limiting** & input sanitization  

---

## 🧪 Quick Test

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

### Test 2: Create & Join Room
```bash
# Create room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"ttlHours": 24}'

# Save the token from response, then join:
curl -X POST http://localhost:3000/api/rooms/YOUR_TOKEN/join \
  -H "Content-Type: application/json" \
  -d '{"nickname": "TestUser"}'
```

---

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `src/server.ts` | Main entry point |
| `.env` | Configuration |
| `prisma/schema.prisma` | Database schema |
| `src/handlers/socketHandlers.ts` | WebSocket logic |
| `src/services/` | Business logic |

---

## 🔧 Common Commands

```bash
# Development
pnpm dev                    # Start with hot reload

# Database
pnpm prisma:studio          # Open database GUI
pnpm prisma:migrate         # Run migrations

# Docker
pnpm docker:up              # Start containers
pnpm docker:down            # Stop containers
pnpm docker:logs            # View logs

# Production
pnpm build                  # Build for production
pnpm start                  # Run production server
```

---

## 📚 Next Steps

1. **Read the docs**:
   - [README.md](./README.md) - Full project overview
   - [SETUP.md](./SETUP.md) - Detailed setup guide
   - [API.md](./API.md) - Complete API reference

2. **Configure settings**: Edit `.env` file
   - `PORT` - Server port
   - `CORS_ORIGIN` - Your frontend URL
   - `ROOM_TTL_HOURS` - Room expiration time

3. **Build frontend**: Connect using Socket.IO client

4. **Deploy**: See production deployment guide in README

---

## ❓ Troubleshooting

**Port 3000 in use?**
→ Change `PORT` in `.env`

**Database error?**
→ Run `pnpm docker:up` to start PostgreSQL

**TypeScript errors?**
→ Run `pnpm prisma:generate`

**Need help?**
→ Check [SETUP.md](./SETUP.md) for detailed troubleshooting

---

## 🎯 Architecture at a Glance

```
Client
  ↓
Express + Socket.IO
  ↓
Controllers/Handlers
  ↓
Services (business logic)
  ↓
Repositories (data access)
  ↓
Prisma ORM
  ↓
PostgreSQL
```

**Clean Architecture** = Easy to maintain, test, and scale! 🚀

---

That's it! You're ready to build your ghost-themed chat app! 👻
