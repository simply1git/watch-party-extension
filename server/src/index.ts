
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { RoomSchema } from '@watch-party/shared';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';
import { RoomManager } from './services/RoomManager';

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', connections: io.engine.clientsCount });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Watch Party Server</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .status { padding: 20px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; text-align: center; }
          .dot { height: 12px; width: 12px; background-color: #10b981; border-radius: 50%; display: inline-block; margin-right: 8px; }
        </style>
      </head>
      <body>
        <div class="status">
          <h1><span class="dot"></span>Server is Running</h1>
          <p>Socket.IO and Yjs signaling are active.</p>
        </div>
      </body>
    </html>
  `);
});

const httpServer = createServer(app);

// 1. Socket.IO for Signaling & Chat
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 2. Yjs WebSocket for State Sync
const wss = new WebSocketServer({ server: httpServer, path: '/yjs' });

wss.on('connection', (conn, req) => {
  const docName = req.url?.split('/').pop() || 'default';
  setupWSConnection(conn, req, { docName });
});

import { appendFileSync } from 'fs';

const log = (msg: string) => {
  console.log(msg);
  try {
    appendFileSync('server.log', msg + '\n');
  } catch (e) {}
};

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  log(`Client connected: ${socket.id}`);
  log(`Transport: ${socket.conn.transport.name}`);

  socket.onAny((event, ...args) => {
    // Reduce log noise for common events if needed
    if (event !== 'signal') {
      log(`[DEBUG] Received event '${event}' from ${socket.id}`);
    }
  });

  socket.on('join-room', async (roomId: string, user: { nickname: string; avatar: string }) => {
    log(`RECEIVED join-room for ${roomId} from ${socket.id}`);
    
    // Join Socket.IO room
    socket.join(roomId);
    
    // Update RoomManager
    roomManager.joinRoom(roomId, socket.id, user);
    
    // Store user data on the socket instance for easy retrieval
    // @ts-ignore
    socket.data.user = user;
    // @ts-ignore
    socket.data.roomId = roomId;
    
    console.log(`Socket ${socket.id} joined room ${roomId} as ${user?.nickname}`);
    
    // Notify others in the room that a new user joined
    socket.to(roomId).emit('user-joined', { userId: socket.id, user });

    // Send list of existing users to the new user
    const existingUsers = roomManager.getUsers(roomId)
      .filter(u => u.id !== socket.id)
      .map(u => ({
        userId: u.id,
        user: { nickname: u.nickname, avatar: u.avatar }
      }));
    
    socket.emit('room-users', existingUsers);

    // Send chat history
    const history = roomManager.getMessages(roomId);
    socket.emit('chat-history', history);
  });

  socket.on('signal', (payload: { target: string; signal: any }) => {
    io.to(payload.target).emit('signal', {
      sender: socket.id,
      signal: payload.signal
    });
  });

  socket.on('chat-message', (payload: { roomId: string; message: string; user: any }) => {
    const messageObj = {
      id: Math.random().toString(36).substring(7),
      senderId: socket.id,
      user: payload.user,
      message: payload.message,
      timestamp: Date.now()
    };

    // Store in RoomManager
    roomManager.addMessage(payload.roomId, messageObj);

    // Broadcast to everyone in the room INCLUDING sender (simplifies UI)
    io.in(payload.roomId).emit('chat-message', messageObj);
  });

  socket.on('reaction', (payload: { roomId: string; emoji: string }) => {
    io.in(payload.roomId).emit('reaction', {
      senderId: socket.id,
      emoji: payload.emoji,
      timestamp: Date.now()
    });
  });

  socket.on('buzz', (payload: { roomId: string }) => {
    io.in(payload.roomId).emit('buzz', {
      senderId: socket.id,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Use RoomManager to find the room and remove the user
    // @ts-ignore
    const roomId = socket.data.roomId || roomManager.getUserRoom(socket.id);
    
    if (roomId) {
      roomManager.leaveRoom(roomId, socket.id);
      socket.to(roomId).emit('user-left', { userId: socket.id });
      console.log(`User ${socket.id} left room ${roomId}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
