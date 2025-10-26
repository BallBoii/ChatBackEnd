# ChatBackEnd

A real-time chat backend application built with **Node.js**, **Socket.IO**, **Prisma**, **PostgreSQL**, and **Docker**.

## Features

- 🚀 Real-time messaging with Socket.IO
- 💬 Multiple chat rooms support
- 👥 User management
- 🗄️ PostgreSQL database with Prisma ORM
- 🐳 Dockerized application with Docker Compose
- 📦 Package management with pnpm
- 🔒 TypeScript for type safety
- 🌐 CORS enabled for cross-origin requests

## Tech Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 20 or higher
- pnpm (will be installed automatically with npm)
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL (if running without Docker)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/BallBoii/ChatBackEnd.git
cd ChatBackEnd
```

### 2. Install pnpm (if not already installed)

```bash
npm install -g pnpm
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Set up environment variables

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials and other settings.

## Running the Application

### Option 1: Using Docker Compose (Recommended)

This will start both the PostgreSQL database and the application:

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`

### Option 2: Local Development

1. **Start PostgreSQL** (make sure it's running on port 5432)

2. **Run database migrations**:

```bash
pnpm prisma:migrate
```

3. **Generate Prisma Client**:

```bash
pnpm prisma:generate
```

4. **Start the development server**:

```bash
pnpm dev
```

The server will start on `http://localhost:3000` with hot-reload enabled.

### Option 3: Production Build

1. **Build the application**:

```bash
pnpm build
```

2. **Start the production server**:

```bash
pnpm start
```

## Available Scripts

- `pnpm dev` - Start development server with hot-reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio (database GUI)
- `pnpm db:push` - Push schema changes to database without migrations

## API Endpoints

### REST API

- `GET /health` - Health check endpoint
- `GET /api/rooms` - Get all chat rooms
- `GET /api/rooms/:roomId` - Get specific room details with messages

### Socket.IO Events

#### Client -> Server

- `register` - Register a user
  ```typescript
  { userId: string, username: string }
  ```

- `createRoom` - Create a new chat room
  ```typescript
  { name: string, userId: string }
  ```

- `joinRoom` - Join a chat room
  ```typescript
  { roomId: string, userId: string, username: string }
  ```

- `sendMessage` - Send a message to a room
  ```typescript
  { roomId: string, userId: string, content: string }
  ```

- `leaveRoom` - Leave a chat room
  ```typescript
  roomId: string
  ```

- `getRooms` - Get list of all rooms

#### Server -> Client

- `registered` - User registration confirmation
- `roomCreated` - Room creation confirmation
- `joinedRoom` - Room join confirmation with room data
- `newMessage` - New message received
- `userJoined` - User joined the room
- `userLeft` - User left the room
- `roomsList` - List of all rooms
- `error` - Error message

## Database Schema

### User
- `id`: UUID (Primary Key)
- `username`: String (Unique)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Room
- `id`: UUID (Primary Key)
- `name`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Message
- `id`: UUID (Primary Key)
- `content`: String
- `userId`: UUID (Foreign Key)
- `roomId`: UUID (Foreign Key)
- `createdAt`: DateTime

### RoomUser (Join Table)
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key)
- `roomId`: UUID (Foreign Key)
- `joinedAt`: DateTime

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://chatuser:chatpassword@localhost:5432/chatdb` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3001` |

## Docker Services

### PostgreSQL Database
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Database**: chatdb
- **User**: chatuser
- **Password**: chatpassword

### Application Server
- **Port**: 3000
- **Auto-restarts**: Yes
- **Health checks**: Enabled

## Development

### Viewing the Database

Use Prisma Studio to browse and edit your database:

```bash
pnpm prisma:studio
```

This will open a web interface at `http://localhost:5555`

### Database Migrations

When you modify the Prisma schema, create a migration:

```bash
pnpm prisma:migrate
```

## Project Structure

```
ChatBackEnd/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── config/
│   │   └── database.ts     # Prisma client configuration
│   ├── handlers/
│   │   └── socketHandlers.ts  # Socket.IO event handlers
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   └── index.ts            # Application entry point
├── .env                    # Environment variables (not in git)
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore rules
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker build instructions
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on the GitHub repository.
