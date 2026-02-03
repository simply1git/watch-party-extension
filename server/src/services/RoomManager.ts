
export interface User {
  id: string; // socket.id
  nickname: string;
  avatar: string;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  user: { nickname: string; avatar: string };
  message: string;
  timestamp: number;
}

export interface Room {
  id: string;
  users: Map<string, User>; // socketId -> User
  messages: ChatMessage[];
  lastActivity: number;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private readonly MAX_MESSAGES = 50;
  private readonly ROOM_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Periodically clean up stale rooms
    setInterval(() => this.cleanupStaleRooms(), 60 * 60 * 1000); // Every hour
  }

  public joinRoom(roomId: string, socketId: string, userData: { nickname: string; avatar: string }): User {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        users: new Map(),
        messages: [],
        lastActivity: Date.now()
      };
      this.rooms.set(roomId, room);
    }

    // Check for existing user with same nickname and remove them (ghost handling)
    for (const [existingSocketId, existingUser] of room.users.entries()) {
        if (existingUser.nickname === userData.nickname) {
            console.log(`[RoomManager] Removing duplicate user/ghost: ${userData.nickname} (${existingSocketId})`);
            room.users.delete(existingSocketId);
            // We should ideally notify others that this specific socket left, 
            // but the caller of joinRoom will emit 'user-joined' for the new socket.
            // The old socket ID will just disappear from the user list.
            // If the old socket is still connected, it will get a "disconnect" event eventually,
            // but for now, we remove it from the room state.
        }
    }

    const user: User = {
      id: socketId,
      nickname: userData.nickname,
      avatar: userData.avatar,
      joinedAt: Date.now()
    };

    room.users.set(socketId, user);
    room.lastActivity = Date.now();
    
    return user;
  }

  public leaveRoom(roomId: string, socketId: string): User | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const user = room.users.get(socketId);
    if (user) {
      room.users.delete(socketId);
      room.lastActivity = Date.now();
      
      // If room is empty, we keep it for a while (TTL) to preserve chat history
      // unless it's explicitly destroyed, but cleanupStaleRooms handles that.
    }
    return user;
  }

  public getUsers(roomId: string): User[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    
    // Deduplicate by nickname just in case (prefer newest)
    const uniqueUsers = new Map<string, User>();
    room.users.forEach(u => uniqueUsers.set(u.nickname, u));
    return Array.from(uniqueUsers.values());
  }

  public addMessage(roomId: string, message: ChatMessage) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.messages.push(message);
    if (room.messages.length > this.MAX_MESSAGES) {
      room.messages.shift();
    }
    room.lastActivity = Date.now();
  }

  public getMessages(roomId: string): ChatMessage[] {
    const room = this.rooms.get(roomId);
    return room ? room.messages : [];
  }

  public cleanupStaleRooms() {
    const now = Date.now();
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.size === 0 && (now - room.lastActivity > this.ROOM_TTL)) {
        this.rooms.delete(roomId);
        console.log(`[RoomManager] Cleaned up stale room: ${roomId}`);
      }
    }
  }

  // Helper to find which room a socket is in (if we don't trust socket.rooms)
  public getUserRoom(socketId: string): string | undefined {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.has(socketId)) {
        return roomId;
      }
    }
    return undefined;
  }
}
