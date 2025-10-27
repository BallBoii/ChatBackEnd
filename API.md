# 📡 GhostRooms API Reference

Complete API documentation for GhostRooms backend.

## Base URL

```
http://localhost:3000
```

## 🔑 Authentication

GhostRooms uses session tokens for authentication:
- Session tokens are obtained by joining a room
- Include token in `Authorization` header: `Bearer <sessionToken>`
- Tokens are ephemeral and expire with the room

---

## REST API Endpoints

### 🏠 Room Management

#### Create Room

Create a new chat room with optional TTL.

```http
POST /api/rooms
Content-Type: application/json

{
  "ttlHours": 24  // Optional, defaults to 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "ghost-abc12345",
    "expiresAt": "2025-10-28T10:00:00.000Z"
  }
}
```

---

#### Get Room Info

Get information about a room.

```http
GET /api/rooms/:token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "ghost-abc12345",
    "expiresAt": "2025-10-28T10:00:00.000Z",
    "participantCount": 5,
    "createdAt": "2025-10-27T10:00:00.000Z"
  }
}
```

---

#### Validate Room

Check if a room token is valid and active.

```http
GET /api/rooms/:token/validate
```

**Response:**
```json
{
  "success": true,
  "message": "Room is valid"
}
```

---

#### Join Room

Join a room and create a session.

```http
POST /api/rooms/:token/join
Content-Type: application/json

{
  "nickname": "GhostUser"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "abc...xyz",
    "nickname": "GhostUser",
    "roomToken": "ghost-abc12345"
  }
}
```

**Validation:**
- Nickname: 2-20 characters
- Only alphanumeric, spaces, dots, underscores, hyphens
- Must be unique in the room

---

### 💬 Messages

#### Get Messages

Retrieve messages from a room (requires authentication).

```http
GET /api/messages/:roomToken?limit=50&before=2025-10-27T10:00:00.000Z
Authorization: Bearer <sessionToken>
```

**Query Parameters:**
- `limit`: Number of messages (default: 50, max: 100)
- `before`: Get messages before this timestamp (for pagination)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-123",
      "type": "TEXT",
      "content": "Hello world!",
      "nickname": "GhostUser",
      "createdAt": "2025-10-27T10:00:00.000Z",
      "attachments": []
    }
  ]
}
```

---

### ❤️ Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T10:00:00.000Z",
  "uptime": 123.456,
  "service": "GhostRooms Backend",
  "version": "1.0.0"
}
```

---

## 🔌 WebSocket Events

Connect to WebSocket:
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
```

### Client → Server Events

#### join_room

Join a room after obtaining a session token.

```javascript
socket.emit('join_room', {
  roomToken: 'ghost-abc12345',
  sessionToken: 'abc...xyz'
});
```

---

#### send_message

Send a message to the current room.

```javascript
// Text message
socket.emit('send_message', {
  type: 'TEXT',
  content: 'Hello everyone!'
});

// Image message
socket.emit('send_message', {
  type: 'IMAGE',
  content: 'Check this out!',
  attachments: [{
    fileName: 'photo.jpg',
    fileSize: 102400,
    mimeType: 'image/jpeg',
    url: 'https://example.com/photo.jpg'
  }]
});

// File message
socket.emit('send_message', {
  type: 'FILE',
  content: 'Here is the document',
  attachments: [{
    fileName: 'document.pdf',
    fileSize: 512000,
    mimeType: 'application/pdf',
    url: 'https://example.com/document.pdf'
  }]
});

// Sticker message
socket.emit('send_message', {
  type: 'STICKER',
  content: 'sticker-ghost-happy'
});
```

---

#### delete_message

Delete your own message.

```javascript
socket.emit('delete_message', {
  messageId: 'msg-123'
});
```

---

#### leave_room

Leave the current room.

```javascript
socket.emit('leave_room');
```

---

#### heartbeat

Keep session alive (recommended every 30 seconds).

```javascript
socket.emit('heartbeat');
```

---

### Server → Client Events

#### room_joined

Confirmation that you joined a room, includes message history.

```javascript
socket.on('room_joined', (data) => {
  // data: { 
  //   roomToken: string, 
  //   participantCount: number,
  //   messages: Array<MessageResponseDTO> // Last 50 messages
  // }
});
```

---

#### user_joined

Another user joined the room.

```javascript
socket.on('user_joined', (data) => {
  // data: { nickname: string, participantCount: number }
});
```

---

#### user_left

A user left the room.

```javascript
socket.on('user_left', (data) => {
  // data: { nickname: string, participantCount: number }
});
```

---

#### new_message

New message received.

```javascript
socket.on('new_message', (message) => {
  /*
  message: {
    id: string,
    type: 'TEXT' | 'STICKER' | 'IMAGE' | 'FILE',
    content: string | null,
    nickname: string,
    createdAt: Date,
    attachments: Array<{
      fileName: string,
      fileSize: number,
      mimeType: string,
      url: string
    }>
  }
  */
});
```

---

#### message_deleted

A message was deleted.

```javascript
socket.on('message_deleted', (data) => {
  // data: { messageId: string }
});
```

---

#### room_ttl_warning

Room is expiring soon.

```javascript
socket.on('room_ttl_warning', (data) => {
  // data: { expiresIn: number } // seconds remaining
});
```

---

#### room_closed

Room has been closed.

```javascript
socket.on('room_closed', (data) => {
  // data: { reason: string }
});
```

---

#### error

Error occurred.

```javascript
socket.on('error', (error) => {
  // error: { message: string, code?: string }
});
```

---

## 🚨 Error Codes

### Room Errors
- `ROOM_NOT_FOUND` (404): Room doesn't exist
- `ROOM_EXPIRED` (410): Room has expired
- `ROOM_INACTIVE` (410): Room is no longer active
- `ROOM_FULL` (403): Room is at max capacity

### Session Errors
- `INVALID_SESSION` (401): Invalid session token
- `NICKNAME_IN_USE` (409): Nickname already taken in room
- `INVALID_NICKNAME` (400): Invalid nickname format
- `SESSION_EXPIRED` (401): Session has expired

### Message Errors
- `MESSAGE_NOT_FOUND` (404): Message doesn't exist
- `INVALID_MESSAGE` (400): Invalid message format
- `MESSAGE_TOO_LONG` (400): Message exceeds max length
- `MISSING_ATTACHMENT` (400): Required attachment missing
- `FILE_TOO_LARGE` (400): File exceeds size limit
- `INVALID_MESSAGE_TYPE` (400): Unsupported message type
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `FORBIDDEN` (403): Not authorized for this action

### General Errors
- `NOT_IN_ROOM` (400): Not connected to a room
- `NOT_FOUND` (404): Route not found
- `DATABASE_ERROR` (400): Database error
- `INTERNAL_ERROR` (500): Internal server error

---

## 📊 Rate Limits

Default rate limits (configurable in `.env`):

| Action | Limit |
|--------|-------|
| Create Room | 5 per hour per IP |
| Send Message | 10 per minute per session |
| API Requests | Based on endpoint |

---

## 🔒 Security Notes

1. **Session Tokens**: Store securely, never expose in logs
2. **Input Validation**: All inputs are sanitized server-side
3. **CORS**: Configure `CORS_ORIGIN` for your frontend domain
4. **Rate Limiting**: Adjust limits based on your needs
5. **File Uploads**: Validate file types and sizes client-side too

---

## 📝 Message Types Reference

### TEXT
- Required: `content` (string, 1-2000 chars)
- Optional: None
- Attachments: Not allowed

### STICKER
- Required: `content` (sticker code/ID)
- Optional: None
- Attachments: Not allowed

### IMAGE
- Required: `attachments` array with at least 1 image
- Optional: `content` (caption)
- Attachment fields: `fileName`, `fileSize`, `mimeType`, `url`

### FILE
- Required: `attachments` array with at least 1 file
- Optional: `content` (description)
- Attachment fields: `fileName`, `fileSize`, `mimeType`, `url`

---

## 🎯 Example Full Flow

```javascript
// 1. Create a room
const createRoomRes = await fetch('http://localhost:3000/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ttlHours: 24 })
});
const { data: room } = await createRoomRes.json();
const roomToken = room.token;

// 2. Join the room
const joinRes = await fetch(`http://localhost:3000/api/rooms/${roomToken}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nickname: 'GhostUser' })
});
const { data: session } = await joinRes.json();
const sessionToken = session.sessionToken;

// 3. Connect WebSocket
const socket = io('http://localhost:3000');

// 4. Join room via WebSocket
socket.emit('join_room', { roomToken, sessionToken });

// 5. Listen for events
socket.on('room_joined', (data) => {
  console.log('Joined:', data);
});

socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// 6. Send a message
socket.emit('send_message', {
  type: 'TEXT',
  content: 'Hello GhostRooms!'
});

// 7. Heartbeat to keep alive
setInterval(() => {
  socket.emit('heartbeat');
}, 30000);

// 8. Leave when done
socket.emit('leave_room');
socket.disconnect();
```

---

For more details, see the [main README](./README.md) or [setup guide](./SETUP.md).
