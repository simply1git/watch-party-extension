import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import type { PlasmoCSConfig } from "plasmo"
import { StreamManager } from "./services/StreamManager"
import { CONFIG } from "./config"
import cssText from "data-text:./styles/overlay.css"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

class VideoController {
  public readonly video: HTMLVideoElement
  private doc: Y.Doc
  private provider: WebsocketProvider | null = null
  private state: Y.Map<any>
  private isRemoteUpdate = false

  constructor(video: HTMLVideoElement) {
    this.video = video
    this.doc = new Y.Doc()
    this.state = this.doc.getMap("room-state")
    
    this.setupListeners()
  }

  public connect(roomId: string) {
    if (this.provider) {
      this.provider.destroy()
    }

    // Connect to our local server
    this.provider = new WebsocketProvider(
      CONFIG.WS_URL,
      roomId,
      this.doc
    )

    this.provider.on('status', (event: any) => {
      console.log('Yjs Connection Status:', event.status)
    })

    // Listen for remote state changes
    this.state.observe(() => {
      this.handleRemoteUpdate()
    })
  }

  public disconnect() {
    if (this.provider) {
      this.provider.destroy()
      this.provider = null
    }
  }

  public destroy() {
    this.disconnect()
    this.video.removeEventListener("play", this.handlePlay)
    this.video.removeEventListener("pause", this.handlePause)
    this.video.removeEventListener("seeked", this.handleSeek)
  }

  private setupListeners() {
    this.video.addEventListener("play", this.handlePlay)
    this.video.addEventListener("pause", this.handlePause)
    this.video.addEventListener("seeked", this.handleSeek)
  }

  private handlePlay = () => {
    if (this.isRemoteUpdate) return
    console.log("Local Play")
    this.state.set("playing", true)
    this.state.set("time", this.video.currentTime)
    this.state.set("lastUpdated", Date.now())
  }

  private handlePause = () => {
    if (this.isRemoteUpdate) return
    console.log("Local Pause")
    this.state.set("playing", false)
    this.state.set("time", this.video.currentTime)
    this.state.set("lastUpdated", Date.now())
  }

  private handleSeek = () => {
    if (this.isRemoteUpdate) return
    console.log("Local Seek")
    this.state.set("time", this.video.currentTime)
    this.state.set("lastUpdated", Date.now())
  }

  // Handle updates coming from the server (other users)
  private handleRemoteUpdate() {
    this.isRemoteUpdate = true

    const isPlaying = this.state.get("playing") as boolean
    const time = this.state.get("time") as number
    const lastUpdated = this.state.get("lastUpdated") as number
    
    // Calculate drift
    // If playing, add elapsed time since update
    const now = Date.now()
    const elapsed = (now - lastUpdated) / 1000
    const targetTime = isPlaying ? time + elapsed : time

    console.log(`Remote Update: ${isPlaying ? 'Play' : 'Pause'} at ${targetTime}`)

    // Apply State
    if (Math.abs(this.video.currentTime - targetTime) > 0.5) {
      this.video.currentTime = targetTime
    }

    if (isPlaying && this.video.paused) {
      this.video.play().catch(e => console.error("Auto-play blocked", e))
    } else if (!isPlaying && !this.video.paused) {
      this.video.pause()
    }
    
    setTimeout(() => {
        this.isRemoteUpdate = false
    }, 100)
  }
}

class WatchPartyManager {
  private videoController: VideoController | null = null;
  private streamManager: StreamManager | null = null;
  private roomId: string | null = null;
  private user: { nickname: string; avatar: string } | null = null;
  private chatContainer: HTMLDivElement | null = null;
  private currentMode: 'sync' | 'stream' = 'stream';

  constructor() {
    this.injectStyles();
    this.setupMessageListeners();
  }

  private injectStyles() {
    const style = document.createElement("style");
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  private applyTheme(theme: string) {
    const root = document.documentElement;
    switch (theme) {
      case "cyberpunk":
        root.style.setProperty("--wp-primary", "#f472b6");
        root.style.setProperty("--wp-bg-glass", "rgba(10, 10, 20, 0.95)");
        break;
      case "cozy":
        root.style.setProperty("--wp-primary", "#f59e0b");
        root.style.setProperty("--wp-bg-glass", "rgba(40, 30, 20, 0.9)");
        break;
      case "neon":
        root.style.setProperty("--wp-primary", "#10b981");
        root.style.setProperty("--wp-bg-glass", "rgba(0, 20, 10, 0.9)");
        break;
      default:
        root.style.setProperty("--wp-primary", "#6366f1");
        root.style.setProperty("--wp-bg-glass", "rgba(15, 23, 42, 0.85)");
        break;
    }
  }

  private handleBuzz() {
    this.playSound('message'); // Use message sound for now, maybe louder?
    document.body.classList.add("wp-shake-anim");
    setTimeout(() => {
        document.body.classList.remove("wp-shake-anim");
    }, 500);
    
    // Also shake chat container
    if (this.chatContainer) {
        this.chatContainer.classList.add("wp-shake-anim");
        setTimeout(() => {
            this.chatContainer?.classList.remove("wp-shake-anim");
        }, 500);
    }
  }

  private playSound(type: 'message' | 'reaction') {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'message') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      // Ignore audio errors (e.g. user hasn't interacted yet)
    }
  }

  private initVideoController() {
    // Smart Source Switching: continuously monitor for the "best" video
    const findBestVideo = () => {
        const videos = Array.from(document.querySelectorAll("video"));
        if (videos.length === 0) return null;

        // Prioritize:
        // 1. Videos that are currently playing
        // 2. The largest video by area
        // 3. The first video found
        
        const playingVideo = videos.find(v => !v.paused && v.readyState > 2);
        if (playingVideo) return playingVideo;

        const largestVideo = videos.reduce((prev, current) => {
            const prevRect = prev.getBoundingClientRect();
            const currRect = current.getBoundingClientRect();
            return (prevRect.width * prevRect.height) > (currRect.width * currRect.height) ? prev : current;
        });

        return largestVideo;
    };

    const attemptAttach = () => {
        const bestVideo = findBestVideo();
        if (bestVideo && (!this.videoController || this.videoController.video !== bestVideo)) {
            console.log("Found new video source:", bestVideo);
            if (this.videoController) {
                this.videoController.destroy();
            }
            this.videoController = new VideoController(bestVideo);
             if (this.roomId && this.user && this.currentMode === 'sync') {
                 this.videoController.connect(this.roomId);
             }
        }
    };

    // Initial check
    attemptAttach();

    // Watch for DOM changes (SPA navigation, dynamic loading)
    const observer = new MutationObserver(() => {
        attemptAttach();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
  }

  private initStreamManager() {
    if (!this.roomId || !this.user) return;
    
    // Clean up existing
    if (this.streamManager) {
        this.streamManager.destroy();
    }

    this.streamManager = new StreamManager({
        roomId: this.roomId,
        user: this.user,
        onStreamFound: (stream) => this.createVideoOverlay(stream),
        onStreamEnded: () => this.removeVideoOverlay()
    });

    this.streamManager.onChatMessage = (msg) => this.addChatMessage(msg);
    this.streamManager.onChatHistory = (msgs) => msgs.forEach(msg => this.addChatMessage(msg));
    this.streamManager.onReaction = (data) => this.showFloatingReaction(data.emoji);
    this.streamManager.onBuzz = () => this.handleBuzz();
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "JOIN_ROOM") {
        this.roomId = request.roomId;
        this.user = request.user;
        this.currentMode = request.mode || "stream"; // Default to stream if not provided

        this.applyTheme(request.theme || "default");
        
        this.initStreamManager();
        this.createChatOverlay();

        if (this.currentMode === "sync") {
             console.log("Initializing Sync Mode");
             this.initVideoController();
             this.videoController?.connect(this.roomId);
        } else {
             console.log("Initializing Stream Mode");
             if (this.videoController) {
                 this.videoController.destroy();
                 this.videoController = null;
             }
        }
        
        // Fun Entrance!
        this.showConfetti();
      } else if (request.type === "START_STREAM") {
        if (!this.streamManager && this.roomId && this.user) {
             this.initStreamManager();
        }
        this.streamManager?.startStream();
      } else if (request.type === "STOP_STREAM") {
        this.streamManager?.stopStream();
      }
    });
  }

  private createVideoOverlay(stream: MediaStream) {
    this.removeVideoOverlay();

    const container = document.createElement("div");
    container.id = "watch-party-stream";
    Object.assign(container.style, {
        position: "fixed",
        top: "20px",
        right: "340px", // Left of chat
        width: "320px",
        height: "180px",
        zIndex: "2147483647",
        background: "#0f172a",
        border: "2px solid #6366f1",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
        resize: "both",
        transition: "all 0.3s ease"
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.controls = true;
    video.playsInline = true;
    Object.assign(video.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    });

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    Object.assign(closeBtn.style, {
        position: "absolute", top: "4px", right: "8px",
        background: "rgba(0,0,0,0.6)", color: "white", border: "none",
        borderRadius: "4px", width: "20px", height: "20px", cursor: "pointer",
        zIndex: "2", display: "flex", alignItems: "center", justifyContent: "center"
    });
    closeBtn.onclick = () => container.remove();

    container.appendChild(closeBtn);
    container.appendChild(video);
    document.body.appendChild(container);
  }

  private removeVideoOverlay() {
      const el = document.getElementById("watch-party-stream");
      if (el) el.remove();
  }

  private createChatOverlay() {
      if (this.chatContainer) {
          this.chatContainer.style.display = "flex"; // Re-show if hidden
          return;
      }

      // Floating Toggle Button (Bubble)
      const toggleBtn = document.createElement("button");
      toggleBtn.id = "wp-chat-toggle";
      toggleBtn.innerHTML = "💬";
      Object.assign(toggleBtn.style, {
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          zIndex: "2147483646",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
          display: "none", // Hidden initially
          transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      });
      toggleBtn.onmouseenter = () => toggleBtn.style.transform = "scale(1.1)";
      toggleBtn.onmouseleave = () => toggleBtn.style.transform = "scale(1)";
      toggleBtn.onclick = () => {
          if (this.chatContainer) {
              this.chatContainer.style.display = "flex";
              this.chatContainer.style.transform = "translateX(0)";
              toggleBtn.style.display = "none";
          }
      };
      document.body.appendChild(toggleBtn);

      const container = document.createElement("div");
      this.chatContainer = container;
      Object.assign(container.style, {
          position: "fixed",
          top: "0",
          right: "0",
          width: "320px",
          height: "100vh",
          zIndex: "2147483647",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "-5px 0 25px rgba(0,0,0,0.3)"
      });
      container.classList.add("wp-glass");

      // Header
      const header = document.createElement("div");
      Object.assign(header.style, {
          padding: "16px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(12px)",
          color: "white",
          fontWeight: "600",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "14px",
          letterSpacing: "0.5px"
      });
      header.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><span>💬</span> Party Chat</div>`;
      
      const controlsDiv = document.createElement("div");
      controlsDiv.style.display = "flex";
      controlsDiv.style.gap = "8px";

      const minimizeBtn = document.createElement("button");
      minimizeBtn.innerHTML = "−";
      Object.assign(minimizeBtn.style, {
          background: "none", border: "none", color: "#94a3b8", 
          fontSize: "18px", cursor: "pointer", padding: "4px"
      });
      minimizeBtn.onclick = () => {
          container.style.display = "none";
          toggleBtn.style.display = "flex";
      };

      controlsDiv.appendChild(minimizeBtn);
      header.appendChild(controlsDiv);

      // Messages Area
      const messagesArea = document.createElement("div");
      messagesArea.id = "wp-chat-messages";
      Object.assign(messagesArea.style, {
          flex: "1",
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
      });

      // Input Area
      const inputArea = document.createElement("div");
      Object.assign(inputArea.style, {
          padding: "16px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
      });

      // Reactions Bar
      const reactionsBar = document.createElement("div");
      Object.assign(reactionsBar.style, {
          display: "flex",
          justifyContent: "space-around",
          paddingBottom: "8px"
      });
      const emojis = ["❤️", "😂", "😮", "😢", "🔥"];
      emojis.forEach(emoji => {
          const btn = document.createElement("button");
          btn.innerText = emoji;
          btn.classList.add("wp-reaction-btn");
          Object.assign(btn.style, {
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
          });
          btn.onclick = () => {
              this.streamManager?.sendReaction(emoji);
          };
          reactionsBar.appendChild(btn);
      });
      inputArea.appendChild(reactionsBar);

      const inputRow = document.createElement("div");
      Object.assign(inputRow.style, { display: "flex", gap: "8px" });

      const input = document.createElement("input");
      Object.assign(input.style, {
          flex: "1",
          padding: "10px 16px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.2)",
          color: "white",
          outline: "none",
          backdropFilter: "blur(4px)"
      });
      input.placeholder = "Type a message...";
      input.onfocus = () => input.style.background = "rgba(0,0,0,0.4)";
      input.onblur = () => input.style.background = "rgba(0,0,0,0.2)";
      input.onkeypress = (e) => {
          if (e.key === "Enter" && input.value.trim()) {
              this.streamManager?.sendChatMessage(input.value.trim());
              input.value = "";
          }
      };

      const sendBtn = document.createElement("button");
      sendBtn.innerText = "➤";
      Object.assign(sendBtn.style, {
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(99, 102, 241, 0.4)"
      });
      sendBtn.classList.add("wp-reaction-btn"); // Reuse hover effect
      sendBtn.onclick = () => {
          if (input.value.trim()) {
              this.streamManager?.sendChatMessage(input.value.trim());
              input.value = "";
          }
      };

      inputRow.appendChild(input);
      inputRow.appendChild(sendBtn);

      inputArea.appendChild(inputRow);

      container.appendChild(header);
      container.appendChild(messagesArea);
      container.appendChild(inputArea);
      document.body.appendChild(container);
  }

  private addChatMessage(msg: any) {
      const area = document.getElementById("wp-chat-messages");
      if (!area) return;

      this.playSound('message');

      const isMe = msg.user.nickname === this.user?.nickname; 
      
      const msgEl = document.createElement("div");
      Object.assign(msgEl.style, {
          display: "flex",
          flexDirection: "column",
          alignItems: isMe ? "flex-end" : "flex-start",
          maxWidth: "85%",
          alignSelf: isMe ? "flex-end" : "flex-start",
          animation: "wp-pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      });

      const meta = document.createElement("div");
      meta.style.fontSize = "11px";
      meta.style.color = "rgba(255,255,255,0.5)";
      meta.style.marginBottom = "2px";
      meta.innerText = `${msg.user.avatar} ${msg.user.nickname}`;

      const bubble = document.createElement("div");
      if (isMe) {
          bubble.classList.add("wp-gradient-bubble");
      }
      Object.assign(bubble.style, {
          background: isMe ? "" : "rgba(255,255,255,0.1)",
          color: "white",
          padding: "10px 14px",
          borderRadius: "16px",
          borderBottomRightRadius: isMe ? "2px" : "16px",
          borderBottomLeftRadius: isMe ? "16px" : "2px",
          fontSize: "14px",
          lineHeight: "1.4",
          backdropFilter: isMe ? "none" : "blur(4px)",
          border: isMe ? "none" : "1px solid rgba(255,255,255,0.1)"
      });
      bubble.innerText = msg.message;

      msgEl.appendChild(meta);
      msgEl.appendChild(bubble);
      area.appendChild(msgEl);
      area.scrollTop = area.scrollHeight;
  }

  private showFloatingReaction(emoji: string) {
    this.playSound('reaction');
    
    // Spawn a burst of 3-5 emojis
    const count = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        el.innerText = emoji;
        
        // Randomize start position slightly
        const startX = (Math.random() - 0.5) * 60;
        
        Object.assign(el.style, {
            position: "fixed",
            bottom: "120px",
            right: "350px", // Start near chat input
            fontSize: `${Math.random() * 20 + 24}px`, // Random size 24-44px
            pointerEvents: "none",
            zIndex: "2147483647",
            animation: `wp-float-up ${2 + Math.random()}s ease-out forwards`,
            left: `calc(100% - 350px + ${startX}px)` // Position relative to right
        });
        
        document.body.appendChild(el);
        
        // Cleanup
        setTimeout(() => {
            el.remove();
        }, 3000);
    }
  }

  private showConfetti() {
    this.playSound('reaction');
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 50; i++) {
        const el = document.createElement("div");
        Object.assign(el.style, {
            position: "fixed",
            top: "-10px",
            left: `${Math.random() * 100}vw`,
            width: "10px",
            height: "10px",
            background: colors[Math.floor(Math.random() * colors.length)],
            zIndex: "2147483647",
            pointerEvents: "none",
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
            animation: `wp-float-up ${1.5 + Math.random()}s ease-in reverse forwards` // Reusing float-up but reversed/tweaked? Actually float-up goes UP. Need drop down.
        });
        
        // Override animation for falling confetti
        el.animate([
            { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${Math.random()*100 - 50}px, 100vh) rotate(${Math.random()*720}deg)`, opacity: 0 }
        ], {
            duration: 1500 + Math.random() * 1500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });

        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
  }
}

new WatchPartyManager();
