import io, { Socket } from "socket.io-client";
import { CONFIG } from "../config";

interface StreamConfig {
  onStreamFound: (stream: MediaStream, userId: string) => void;
  onStreamEnded: (userId: string, streamId?: string) => void;
  roomId: string;
  user: { nickname: string; avatar: string };
}

export class StreamManager {
  private socket: Socket;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private roomId: string;
  private user: { nickname: string; avatar: string };
  private onStreamFound: (stream: MediaStream, userId: string) => void;
  public onStreamEnded: (userId: string, streamId?: string) => void;
  public onChatMessage: ((msg: any) => void) | null = null;
  public onChatHistory: ((messages: any[]) => void) | null = null;
  public onReaction: ((data: { senderId: string; emoji: string }) => void) | null = null;
  public onBuzz: ((data: { senderId: string }) => void) | null = null;
  public onHandUpdate: ((data: { userId: string; isRaised: boolean }) => void) | null = null;
  public onUserListUpdate: ((users: Array<{ nickname: string; avatar: string }>) => void) | null = null;
  
  private webcamStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

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
      this.connectedUsers.clear(); // Clear existing to prevent duplicates
      users.forEach(u => this.connectedUsers.set(u.userId, u.user));
      this.notifyUserListUpdate();
    });

    this.socket.on("user-joined", ({ userId, user }) => {
      console.log("User joined:", userId, user);
      this.connectedUsers.set(userId, user);
      this.notifyUserListUpdate();
      if (this.webcamStream || this.screenStream) {
        this.createPeerConnection(userId, true);
      }
    });
    
    this.socket.on("user-left", ({ userId }) => {
        this.connectedUsers.delete(userId);
        this.notifyUserListUpdate();
        const peer = this.peers.get(userId);
        if (peer) {
            peer.close();
            this.peers.delete(userId);
        }
        this.onStreamEnded(userId);
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

    this.socket.on("hand-update", (data) => {
      if (this.onHandUpdate) {
        this.onHandUpdate(data);
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

  public async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1280 },
          height: { max: 720 },
          frameRate: { max: 30 }
        },
        audio: true
      });

      this.screenStream.getVideoTracks()[0].onended = () => this.stopScreenShare();

      // Add tracks to existing peers
      this.peers.forEach(peer => {
          this.screenStream!.getTracks().forEach(track => {
              peer.addTrack(track, this.screenStream!);
          });
      });

      // Show local preview
      this.onStreamFound(this.screenStream, "local");

      // If we have connected users but no peers (e.g. we just joined and haven't established connections yet),
      // we should initiate connections.
      this.connectedUsers.forEach((_, userId) => {
          if (!this.peers.has(userId)) {
              this.createPeerConnection(userId, true);
          }
      });
      
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  }

  public stopScreenShare() {
    if (this.screenStream) {
      const streamId = this.screenStream.id;
      this.screenStream.getTracks().forEach(track => track.stop());
      
      // Remove tracks from peers
      this.peers.forEach(peer => {
          peer.getSenders().forEach(sender => {
              if (sender.track && this.screenStream!.getTracks().find(t => t.id === sender.track!.id)) {
                  peer.removeTrack(sender);
              }
          });
      });
      
      this.screenStream = null;
      this.onStreamEnded(this.socket.id || "local", streamId);
    }
  }

  public toggleHand(isRaised: boolean) {
      this.socket.emit("hand-toggle", { roomId: this.roomId, isRaised });
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

  public async toggleAudio(enabled: boolean) {
    if (enabled && !this.webcamStream) {
        await this.initWebcam();
    }
    if (this.webcamStream) {
      this.webcamStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      }
  }

  public async toggleVideo(enabled: boolean) {
    if (enabled && !this.webcamStream) {
        await this.initWebcam();
    }
    if (this.webcamStream) {
      this.webcamStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  private async initWebcam() {
      try {
          this.webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          
          // Disable tracks initially if they weren't requested? 
          // For simplicity, we enable them based on the toggle that called this.
          // But wait, if I click "Audio", I get both but Video might be on?
          // I should respect the current state logic. 
          // Let's just default to enabled=false for the one not requested?
          // The caller sets enabled=true immediately after.
          // Let's set both to false initially.
          this.webcamStream.getTracks().forEach(t => t.enabled = false);

          // Show local preview
          this.onStreamFound(this.webcamStream, "local");

          this.peers.forEach(peer => {
              this.webcamStream!.getTracks().forEach(track => {
                  peer.addTrack(track, this.webcamStream!);
              });
          });
      } catch (err) {
          console.error("Error accessing webcam:", err);
      }
  }

  public destroy() {
    this.stopScreenShare();
    if (this.webcamStream) {
        this.webcamStream.getTracks().forEach(t => t.stop());
    }
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

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        peer.addTrack(track, this.screenStream!);
      });
    }

    if (this.webcamStream) {
        this.webcamStream.getTracks().forEach(track => {
            peer.addTrack(track, this.webcamStream!);
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
      console.log("Received remote stream from", targetId);
      this.onStreamFound(event.streams[0], targetId);
      
      event.streams[0].onremovetrack = () => {
         if (event.streams[0].getTracks().length === 0) {
             this.onStreamEnded(targetId, event.streams[0].id);
         }
      };
    };

    peer.onnegotiationneeded = () => {
         peer.createOffer().then(offer => peer.setLocalDescription(offer))
         .then(() => {
             this.socket.emit("signal", {
                 target: targetId,
                 signal: { sdp: peer.localDescription }
             });
         })
         .catch(err => console.error("Negotiation error:", err));
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
