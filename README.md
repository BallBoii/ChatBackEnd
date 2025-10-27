# 👻 GhostRooms Backend# ChatBackEnd



A userless, session-only web chat backend built with clean architecture principles. No accounts, no cookies, no localStorage—just ephemeral, privacy-first group chat that forgets itself when the session ends.A real-time chat backend application built with **Node.js**, **Socket.IO**, **Prisma**, **PostgreSQL**, and **Docker**.



## 🌟 Features## Features



- **Session-Only Chat**: No user accounts or persistent storage of user data- 🚀 Real-time messaging with Socket.IO

- **Token-Based Rooms**: Create and join rooms using unique tokens- 💬 Multiple chat rooms support

- **Real-Time Messaging**: WebSocket support via Socket.IO- 👥 User management

- **Multiple Message Types**: TEXT, STICKER, IMAGE, FILE- 🗄️ PostgreSQL database with Prisma ORM

- **Auto-Expiring Rooms**: Configurable TTL (default 24h)- 🐳 Dockerized application with Docker Compose

- **Rate Limiting**: Built-in protection against spam- 📦 Package management with pnpm

- **Clean Architecture**: Organized with layers (Repository → Service → Controller)- 🔒 TypeScript for type safety

- **Type-Safe**: Full TypeScript support- 🌐 CORS enabled for cross-origin requests

- **Privacy-First**: Data is ephemeral and auto-deleted

## Tech Stack

## 📁 Project Structure

- **Runtime**: Node.js 20

```- **Language**: TypeScript

ChatBackEnd/- **Package Manager**: pnpm

├── src/- **Framework**: Express.js

│   ├── server.ts                 # Main application entry point- **WebSocket**: Socket.IO

│   ├── config/- **ORM**: Prisma

│   │   ├── config.ts            # Configuration management- **Database**: PostgreSQL

│   │   └── database.ts          # Prisma client setup- **Containerization**: Docker & Docker Compose

│   ├── types/                   # TypeScript types and interfaces

│   │   ├── room.types.ts## Prerequisites

│   │   ├── session.types.ts

│   │   ├── message.types.ts- Node.js 20 or higher

│   │   ├── socket.types.ts- pnpm (will be installed automatically with npm)

│   │   └── error/- Docker and Docker Compose (for containerized deployment)

│   │       └── AppError.ts      # Custom error class- PostgreSQL (if running without Docker)

│   ├── repository/              # Data access layer

│   │   ├── RoomRepository.ts## Installation

│   │   ├── SessionRepository.ts

│   │   └── MessageRepository.ts### 1. Clone the repository

│   ├── services/                # Business logic layer

│   │   ├── RoomService.ts```bash

│   │   ├── SessionService.tsgit clone https://github.com/BallBoii/ChatBackEnd.git

│   │   └── MessageService.tscd ChatBackEnd

│   ├── controllers/             # HTTP request handlers```

│   │   ├── RoomController.ts

│   │   └── MessageController.ts### 2. Install pnpm (if not already installed)

│   ├── routes/                  # API routes

│   │   ├── RouteManager.ts```bash

│   │   ├── roomRouter.tsnpm install -g pnpm

│   │   └── messageRouter.ts```

│   ├── handlers/                # WebSocket handlers

│   │   └── socketHandlers.ts### 3. Install dependencies

│   ├── middlewares/             # Express middlewares

│   │   ├── errorHandler.ts```bash

│   │   ├── rateLimiter.tspnpm install

│   │   └── sanitize.ts```

│   └── utils/                   # Utility functions

│       ├── room.ts### 4. Set up environment variables

│       └── cleanup.ts           # Cleanup scheduler

├── prisma/Copy the example environment file and update it with your configuration:

│   └── schema.prisma            # Database schema

├── .env                         # Environment variables```bash

├── .env.example                 # Example environment variablescp .env.example .env

├── docker-compose.yml           # Docker services```

├── Dockerfile                   # Container setup

├── package.jsonUpdate the `.env` file with your database credentials and other settings.

├── tsconfig.json

└── README.md## Running the Application

```

### Option 1: Using Docker Compose (Recommended)

## 🏗️ Clean Architecture Layers

This will start both the PostgreSQL database and the application:

### 1. **Repository Layer** (`src/repository/`)

- Direct database access using Prisma```bash

- CRUD operationsdocker-compose up --build

- Data persistence logic```



### 2. **Service Layer** (`src/services/`)The application will be available at `http://localhost:3000`

- Business logic

- Validation### Option 2: Local Development

- Rate limiting

- Inter-repository coordination1. **Start PostgreSQL** (make sure it's running on port 5432)



### 3. **Controller Layer** (`src/controllers/`)2. **Run database migrations**:

- HTTP request/response handling

- Input validation```bash

- Calling servicespnpm prisma:migrate

```

### 4. **Handler Layer** (`src/handlers/`)

- WebSocket event handling3. **Generate Prisma Client**:

- Real-time communication

```bash

### 5. **Middleware Layer** (`src/middlewares/`)pnpm prisma:generate

- Error handling```

- Rate limiting

- Input sanitization4. **Start the development server**:



## 🚀 Getting Started```bash

pnpm dev

### Prerequisites```



- Node.js 18+The server will start on `http://localhost:3000` with hot-reload enabled.

- pnpm (recommended) or npm

- PostgreSQL 16+### Option 3: Production Build

- Docker & Docker Compose (optional)

1. **Build the application**:

### Installation

```bash

1. **Clone the repository**pnpm build

   ```bash```

   git clone <repository-url>

   cd ChatBackEnd2. **Start the production server**:

   ```

```bash

2. **Install dependencies**pnpm start

   ```bash```

   pnpm install

   ```## Available Scripts



3. **Set up environment variables**- `pnpm dev` - Start development server with hot-reload

   ```bash- `pnpm build` - Build TypeScript to JavaScript

   cp .env.example .env- `pnpm start` - Start production server

   # Edit .env with your configuration- `pnpm prisma:generate` - Generate Prisma Client

   ```- `pnpm prisma:migrate` - Run database migrations

- `pnpm prisma:studio` - Open Prisma Studio (database GUI)

4. **Start PostgreSQL** (using Docker)- `pnpm db:push` - Push schema changes to database without migrations

   ```bash

   pnpm docker:up## API Endpoints

   ```

### REST API

5. **Run database migrations**

   ```bash- `GET /health` - Health check endpoint

   pnpm prisma:migrate- `GET /api/rooms` - Get all chat rooms

   pnpm prisma:generate- `GET /api/rooms/:roomId` - Get specific room details with messages

   ```

### Socket.IO Events

6. **Start the development server**

   ```bash#### Client -> Server

   pnpm dev

   ```- `register` - Register a user

  ```typescript

The server will start on `http://localhost:3000`  { userId: string, username: string }

  ```

## 🔧 Environment Variables

- `createRoom` - Create a new chat room

```env  ```typescript

# Server Configuration  { name: string, userId: string }

PORT=3000  ```

NODE_ENV=development

- `joinRoom` - Join a chat room

# Database Configuration  ```typescript

DATABASE_URL="postgresql://admin:strongpassword@localhost:5432/adminDB?schema=public"  { roomId: string, userId: string, username: string }

  ```

# CORS Configuration

CORS_ORIGIN=http://localhost:3002- `sendMessage` - Send a message to a room

  ```typescript

# File Server Configuration  { roomId: string, userId: string, content: string }

FILE_SERVER_URL=http://localhost:6969  ```



# Room Configuration- `leaveRoom` - Leave a chat room

ROOM_TTL_HOURS=24  ```typescript

ROOM_MAX_CAPACITY=50  roomId: string

  ```

# Rate Limiting

RATE_LIMIT_MESSAGES_PER_MINUTE=10- `getRooms` - Get list of all rooms

RATE_LIMIT_ROOM_CREATE_PER_HOUR=5

#### Server -> Client

# Message Configuration

MAX_MESSAGE_LENGTH=2000- `registered` - User registration confirmation

MAX_FILE_SIZE_MB=10- `roomCreated` - Room creation confirmation

```- `joinedRoom` - Room join confirmation with room data

- `newMessage` - New message received

## 📡 API Endpoints- `userJoined` - User joined the room

- `userLeft` - User left the room

### REST API- `roomsList` - List of all rooms

- `error` - Error message

#### Rooms

- `POST /api/rooms` - Create a new room## Database Schema

- `GET /api/rooms/:token` - Get room information

- `GET /api/rooms/:token/validate` - Validate room token### User

- `POST /api/rooms/:token/join` - Join a room (creates session)- `id`: UUID (Primary Key)

- `username`: String (Unique)

#### Messages- `createdAt`: DateTime

- `GET /api/messages/:roomToken` - Get messages (requires Authorization header)- `updatedAt`: DateTime



#### Health### Room

- `GET /health` - Health check endpoint- `id`: UUID (Primary Key)

- `name`: String

### WebSocket Events- `createdAt`: DateTime

- `updatedAt`: DateTime

#### Client → Server

- `join_room` - Join a room with session token### Message

- `send_message` - Send a message to the room- `id`: UUID (Primary Key)

- `delete_message` - Delete your own message- `content`: String

- `leave_room` - Leave the current room- `userId`: UUID (Foreign Key)

- `heartbeat` - Keep session alive- `roomId`: UUID (Foreign Key)

- `createdAt`: DateTime

#### Server → Client

- `room_joined` - Confirmation of joining a room### RoomUser (Join Table)

- `room_left` - Notification when leaving a room- `id`: UUID (Primary Key)

- `room_closed` - Room has been closed- `userId`: UUID (Foreign Key)

- `room_ttl_warning` - Room is expiring soon- `roomId`: UUID (Foreign Key)

- `new_message` - New message in the room- `joinedAt`: DateTime

- `message_deleted` - A message was deleted

- `user_joined` - Another user joined the room## Environment Variables

- `user_left` - Another user left the room

- `error` - Error notification| Variable | Description | Default |

|----------|-------------|---------|

## 🛠️ Development Scripts| `DATABASE_URL` | PostgreSQL connection string | `postgresql://chatuser:chatpassword@localhost:5432/chatdb` |

| `PORT` | Server port | `3000` |

```bash| `NODE_ENV` | Environment mode | `development` |

# Development| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3001` |

pnpm dev              # Start dev server with hot reload

## Docker Services

# Build

pnpm build            # Compile TypeScript to JavaScript### PostgreSQL Database

pnpm start            # Run production build- **Image**: postgres:16-alpine

- **Port**: 5432

# Database- **Database**: chatdb

pnpm prisma:generate  # Generate Prisma Client- **User**: chatuser

pnpm prisma:migrate   # Run database migrations- **Password**: chatpassword

pnpm prisma:studio    # Open Prisma Studio GUI

pnpm db:push          # Push schema changes to database### Application Server

- **Port**: 3000

# Docker- **Auto-restarts**: Yes

pnpm docker:up        # Start Docker containers- **Health checks**: Enabled

pnpm docker:down      # Stop Docker containers

pnpm docker:logs      # View container logs## Development

```

### Viewing the Database

## 🐳 Docker Deployment

Use Prisma Studio to browse and edit your database:

The project includes a Docker Compose setup with:

- PostgreSQL 16 database```bash

- DUFS file server (for image/file uploads)pnpm prisma:studio

```

```bash

# Start all servicesThis will open a web interface at `http://localhost:5555`

docker-compose up -d

### Database Migrations

# View logs

docker-compose logs -fWhen you modify the Prisma schema, create a migration:



# Stop all services```bash

docker-compose downpnpm prisma:migrate

``````



## 🔐 Security Features## Project Structure



- **Input Sanitization**: XSS protection on all inputs```

- **Rate Limiting**: Prevents spam and abuseChatBackEnd/

- **Session Validation**: Token-based authentication├── prisma/

- **CORS Protection**: Configurable origins│   └── schema.prisma       # Database schema

- **Error Handling**: No sensitive data in error messages├── src/

│   ├── config/

## 🧹 Automatic Cleanup│   │   └── database.ts     # Prisma client configuration

│   ├── handlers/

The server automatically:│   │   └── socketHandlers.ts  # Socket.IO event handlers

- Removes expired rooms (past TTL)│   ├── types/

- Deletes inactive sessions (30 minutes inactive)│   │   └── index.ts        # TypeScript type definitions

- Cleans up associated messages│   └── index.ts            # Application entry point

- Runs cleanup every 10 minutes├── .env                    # Environment variables (not in git)

├── .env.example            # Example environment variables

## 📊 Message Types├── .gitignore              # Git ignore rules

├── docker-compose.yml      # Docker Compose configuration

1. **TEXT**: Plain text messages├── Dockerfile              # Docker build instructions

2. **STICKER**: Sticker/emoji codes├── package.json            # Project dependencies and scripts

3. **IMAGE**: Image attachments with metadata└── tsconfig.json           # TypeScript configuration

4. **FILE**: File attachments with metadata```



## 🎯 Usage Example## Contributing



### Creating a Room1. Fork the repository

```javascript2. Create your feature branch (`git checkout -b feature/amazing-feature`)

const response = await fetch('http://localhost:3000/api/rooms', {3. Commit your changes (`git commit -m 'Add some amazing feature'`)

  method: 'POST',4. Push to the branch (`git push origin feature/amazing-feature`)

  headers: { 'Content-Type': 'application/json' },5. Open a Pull Request

  body: JSON.stringify({ ttlHours: 24 })

});## License

const { data } = await response.json();

// data.token = "ghost-abc12345"ISC

```

## Support

### Joining a Room

```javascriptFor issues and questions, please open an issue on the GitHub repository.

const response = await fetch(`http://localhost:3000/api/rooms/${roomToken}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nickname: 'GhostUser' })
});
const { data } = await response.json();
// data.sessionToken = "..."
```

### Connecting via WebSocket
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.emit('join_room', { roomToken, sessionToken });

socket.on('room_joined', (data) => {
  console.log('Joined room:', data);
});

socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

## 🤝 Contributing

Contributions are welcome! Please follow the existing code structure and clean architecture principles.

## 📄 License

ISC

---

**Built with ❤️ for privacy-first ephemeral chat experiences** 👻
