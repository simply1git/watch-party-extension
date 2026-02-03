import io, { Socket } from "socket.io-client";
import { CONFIG } from "../config";

interface StreamConfig {
  onStreamFound: (stream: MediaStream) => void;
  onStreamEnded: () => void;
  roomId: string;
  user: { nickname: string; avatar: string };
}

export class StreamManager {
  private socket: Socket;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private roomId: string;
  private user: { nickname: string; avatar: string };
  private isStreamer: boolean = false;
  private onStreamFound: (stream: MediaStream) => void;
  private onStreamEnded: () => void;
  public onChatMessage: ((msg: any) => void) | null = null;
  public onChatHistory: ((messages: any[]) => void) | null = null;
  public onReaction: ((data: { senderId: string; emoji: string }) => void) | null = null;
  public onBuzz: ((data: { senderId: string }) => void) | null = null;
  public onUserListUpdate: ((users: Array<{ nickname: string; avatar: string }>) => void) | null = null;

  private config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  public connectedUsers: Map<string, { nickname: string; avatar: string }> = new Map();

  constructor(config: StreamConfig) {
    this.roomId = config.roomId;
    this.user = config.user;
    this.onStreamFound = config.onStreamFound;
    this.onStreamEnded = config.onStreamEnded;

    this.socket = io(CONFIG.SERVER_URL);
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to signaling server");
      this.socket.emit("join-room", this.roomId, this.user);
    });

    this.socket.on("room-users", (users: Array<{ userId: string; user: any }>) => {
      console.log("Existing users:", users);
      users.forEach(u => this.connectedUsers.set(u.userId, u.user));
    });

    this.socket.on("user-joined", ({ userId, user }) => {
      console.log("User joined:", userId, user);
      this.connectedUsers.set(userId, user);
      if (this.isStreamer && this.localStream) {
        this.createPeerConnection(userId, true);
      }
    });
    
    this.socket.on("user-left", ({ userId }) => {
        this.connectedUsers.delete(userId);
        const peer = this.peers.get(userId);
        if (peer) {
            peer.close();
            this.peers.delete(userId);
        }
    });

    this.socket.on("chat-message", (msg) => {
      if (this.onChatMessage) {
        this.onChatMessage(msg);
      }
    });

    this.socket.on("chat-history", (messages: any[]) => {
      if (this.onChatHistory) {
        this.onChatHistory(messages);
      }
    });

    this.socket.on("reaction", (data) => {
      if (this.onReaction) {
        this.onReaction(data);
      }
    });

    this.socket.on("buzz", (data) => {
      if (this.onBuzz) {
        this.onBuzz(data);
      }
    });

    this.socket.on("signal", async ({ sender, signal }) => {
      const peer = this.peers.get(sender) || this.createPeerConnection(sender, false);
      
      if (signal.sdp) {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === "offer") {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          this.socket.emit("signal", {
            target: sender,
            signal: { sdp: peer.localDescription }
          });
        }
      } else if (signal.candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });
  }

  public async startStream() {
    try {
      this.localStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1280 },
          height: { max: 720 },
          frameRate: { max: 30 }
        },
        audio: true
      });

      this.isStreamer = true;
      this.localStream.getVideoTracks()[0].onended = () => this.stopStream();

      // Initiate connections to all existing users
      this.connectedUsers.forEach((_, userId) => {
        this.createPeerConnection(userId, true);
      });
      
    } catch (err) {
      console.error("Error starting stream:", err);
    }
  }

  public sendChatMessage(message: string) {
    this.socket.emit("chat-message", {
      roomId: this.roomId,
      message,
      user: this.user
    });
  }

  public sendReaction(emoji: string) {
    this.socket.emit("reaction", {
      roomId: this.roomId,
      emoji
    });
  }

  public sendBuzz() {
    this.socket.emit("buzz", {
      roomId: this.roomId
    });
  }

  public stopStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.isStreamer = false;
    this.peers.forEach(peer => peer.close());
    this.peers.clear();
    this.onStreamEnded();
  }

  public destroy() {
    this.stopStream();
    this.connectedUsers.clear();
    this.socket.disconnect();
  }

  private notifyUserListUpdate() {
    if (this.onUserListUpdate) {
        this.onUserListUpdate(Array.from(this.connectedUsers.values()));
    }
  }

  private createPeerConnection(targetId: string, initiator: boolean): RTCPeerConnection {
    const peer = new RTCPeerConnection(this.config);
    this.peers.set(targetId, peer);

    if (this.isStreamer && this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peer.addTrack(track, this.localStream!);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("signal", {
          target: targetId,
          signal: { candidate: event.candidate }
        });
      }
    };

    peer.ontrack = (event) => {
      console.log("Received remote stream");
      this.onStreamFound(event.streams[0]);
    };

    if (initiator) {
      peer.createOffer().then(offer => {
        return peer.setLocalDescription(offer);
      }).then(() => {
        this.socket.emit("signal", {
          target: targetId,
          signal: { sdp: peer.localDescription }
        });
      });
    }

    return peer;
  }
}
