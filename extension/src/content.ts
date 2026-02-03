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

const ICONS = {
  CHAT: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
  PEOPLE: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  BUZZ: '<svg viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
  SYNC: '<svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>',
  LEAVE: '<svg viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',
  SEND: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
  CLOSE: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
};

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
  private currentMode: 'sync' | 'stream' = 'stream';

  // UI Elements
  private controlBar: HTMLDivElement | null = null;
  private sidePanel: HTMLDivElement | null = null;
  private isPanelOpen: boolean = false;
  private currentTab: 'chat' | 'people' = 'chat';

  constructor() {
    this.injectStyles();
    this.setupMessageListeners();
  }

  private injectStyles() {
    const style = document.createElement("style");
    style.textContent = cssText;
    document.head.appendChild(style);
    
    // Inject font
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
  }

  private applyTheme(theme: string) {
    const root = document.documentElement;
    // Basic theme support preserved
    switch (theme) {
      case "cyberpunk":
        root.style.setProperty("--wp-primary", "#f472b6");
        break;
      case "cozy":
        root.style.setProperty("--wp-primary", "#f59e0b");
        break;
      case "neon":
        root.style.setProperty("--wp-primary", "#10b981");
        break;
      default:
        root.style.setProperty("--wp-primary", "#8ab4f8");
        break;
    }
  }

  private handleBuzz() {
    this.playSound('message'); 
    document.body.classList.add("wp-shake-anim");
    setTimeout(() => {
        document.body.classList.remove("wp-shake-anim");
    }, 500);
    
    if (this.sidePanel) {
        this.sidePanel.classList.add("wp-shake-anim");
        setTimeout(() => {
            this.sidePanel?.classList.remove("wp-shake-anim");
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
      // Ignore
    }
  }

  private initVideoController() {
    const findBestVideo = () => {
        const videos = Array.from(document.querySelectorAll("video"));
        if (videos.length === 0) return null;

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

    attemptAttach();
    const observer = new MutationObserver(() => attemptAttach());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private initStreamManager() {
    if (!this.roomId || !this.user) return;
    
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
        this.currentMode = request.mode || "stream"; 

        this.applyTheme(request.theme || "default");
        
        this.initStreamManager();
        this.createControlBar();
        this.createSidePanel();

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
        left: "20px",
        width: "320px",
        height: "180px",
        zIndex: "2147483645",
        background: "#202124",
        border: "1px solid #3c4043",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
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

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = ICONS.CLOSE;
    Object.assign(closeBtn.style, {
        position: "absolute", top: "8px", right: "8px",
        background: "rgba(0,0,0,0.6)", color: "white", border: "none",
        borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer",
        zIndex: "2", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "4px"
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

  // --- UI Components ---

  private createControlBar() {
      if (this.controlBar) return;

      const bar = document.createElement("div");
      this.controlBar = bar;
      bar.className = "wp-control-bar";

      const buttons = [
          {
              icon: ICONS.SYNC,
              label: "Sync Mode",
              id: "wp-btn-sync",
              action: () => alert(`Current Mode: ${this.currentMode === 'sync' ? 'Native Sync' : 'Screen Share'}`)
          },
          {
              icon: ICONS.BUZZ,
              label: "Buzz",
              id: "wp-btn-buzz",
              action: () => {
                  this.streamManager?.sendBuzz();
                  this.handleBuzz();
              }
          },
          {
              icon: ICONS.LEAVE,
              label: "Leave Call",
              danger: true,
              id: "wp-btn-leave",
              action: () => {
                  if (confirm("Leave the Watch Party?")) {
                      location.reload();
                  }
              }
          },
          {
              icon: ICONS.CHAT,
              label: "Chat",
              id: "wp-btn-chat",
              action: () => this.toggleSidePanel('chat')
          },
          {
              icon: ICONS.PEOPLE,
              label: "People",
              id: "wp-btn-people",
              action: () => this.toggleSidePanel('people')
          }
      ];

      buttons.forEach(btn => {
          const b = document.createElement("button");
          b.className = `wp-control-btn ${btn.danger ? "danger" : ""}`;
          b.id = btn.id || "";
          b.onclick = btn.action;
          
          b.innerHTML = `
            ${btn.icon}
            <span class="wp-tooltip">${btn.label}</span>
          `;
          
          bar.appendChild(b);
      });

      document.body.appendChild(bar);
  }

  private toggleSidePanel(tab: 'chat' | 'people') {
      if (!this.sidePanel) return;
      
      const chatBtn = document.getElementById("wp-btn-chat");
      const peopleBtn = document.getElementById("wp-btn-people");

      // If panel is closed, open it to the requested tab
      if (!this.isPanelOpen) {
          this.sidePanel.classList.add("open");
          this.isPanelOpen = true;
          this.switchTab(tab);
      } 
      // If panel is open
      else {
          // If clicking same tab, close it
          if (this.currentTab === tab) {
              this.sidePanel.classList.remove("open");
              this.isPanelOpen = false;
              chatBtn?.classList.remove("active");
              peopleBtn?.classList.remove("active");
          } 
          // If clicking different tab, switch to it
          else {
              this.switchTab(tab);
          }
      }
  }

  private switchTab(tab: 'chat' | 'people') {
      this.currentTab = tab;
      
      const chatBtn = document.getElementById("wp-btn-chat");
      const peopleBtn = document.getElementById("wp-btn-people");
      const chatTab = document.getElementById("wp-tab-chat");
      const peopleTab = document.getElementById("wp-tab-people");
      const chatContent = document.getElementById("wp-content-chat");
      const peopleContent = document.getElementById("wp-content-people");

      // Update Control Bar Buttons
      if (tab === 'chat') {
          chatBtn?.classList.add("active");
          peopleBtn?.classList.remove("active");
      } else {
          chatBtn?.classList.remove("active");
          peopleBtn?.classList.add("active");
      }

      // Update Panel Tabs
      if (tab === 'chat') {
          chatTab?.classList.add("active");
          peopleTab?.classList.remove("active");
          chatContent?.classList.add("active");
          peopleContent?.classList.remove("active");
          
          // Focus input
          setTimeout(() => this.sidePanel?.querySelector("input")?.focus(), 100);
      } else {
          chatTab?.classList.remove("active");
          peopleTab?.classList.add("active");
          chatContent?.classList.remove("active");
          peopleContent?.classList.add("active");
          this.updatePeopleList();
      }
  }

  private createSidePanel() {
      if (this.sidePanel) return;

      const panel = document.createElement("div");
      this.sidePanel = panel;
      panel.className = "wp-side-panel";

      // Header
      const header = document.createElement("div");
      header.className = "wp-panel-header";
      header.innerHTML = `<span class="wp-panel-title">Watch Party</span>`;
      
      const closeBtn = document.createElement("button");
      closeBtn.className = "wp-close-btn";
      closeBtn.innerHTML = ICONS.CLOSE;
      closeBtn.onclick = () => {
          this.sidePanel?.classList.remove("open");
          this.isPanelOpen = false;
          document.getElementById("wp-btn-chat")?.classList.remove("active");
          document.getElementById("wp-btn-people")?.classList.remove("active");
      };
      header.appendChild(closeBtn);
      panel.appendChild(header);

      // Tabs
      const tabs = document.createElement("div");
      tabs.className = "wp-tabs";
      tabs.innerHTML = `
        <button id="wp-tab-chat" class="wp-tab active">Chat</button>
        <button id="wp-tab-people" class="wp-tab">People</button>
      `;
      panel.appendChild(tabs);
      
      // Event listeners for tabs
      setTimeout(() => {
          document.getElementById("wp-tab-chat")!.onclick = () => this.switchTab('chat');
          document.getElementById("wp-tab-people")!.onclick = () => this.switchTab('people');
      }, 0);

      // Chat Content
      const chatContent = document.createElement("div");
      chatContent.id = "wp-content-chat";
      chatContent.className = "wp-panel-content active";
      
      const messagesArea = document.createElement("div");
      messagesArea.className = "wp-chat-messages";
      chatContent.appendChild(messagesArea);

      // Reactions
      const reactionsBar = document.createElement("div");
      reactionsBar.className = "wp-reactions-bar";
      const emojis = ["❤️", "😂", "😮", "😢", "🔥", "🎉"];
      emojis.forEach(emoji => {
          const btn = document.createElement("button");
          btn.innerText = emoji;
          btn.className = "wp-reaction-btn";
          btn.onclick = () => {
              this.streamManager?.sendReaction(emoji);
              this.showFloatingReaction(emoji);
          };
          reactionsBar.appendChild(btn);
      });
      chatContent.appendChild(reactionsBar);

      // Input
      const inputArea = document.createElement("div");
      inputArea.className = "wp-input-area";
      
      const inputWrapper = document.createElement("div");
      inputWrapper.className = "wp-chat-input-wrapper";
      
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Send a message...";
      input.className = "wp-chat-input";
      
      const sendBtn = document.createElement("button");
      sendBtn.className = "wp-send-btn";
      sendBtn.innerHTML = ICONS.SEND;
      sendBtn.disabled = true;

      const sendMessage = () => {
          const text = input.value.trim();
          if (text) {
              this.streamManager?.sendChatMessage(text);
              this.addChatMessage({ 
                  id: Date.now().toString(), 
                  sender: this.user?.nickname || "Me", 
                  text, 
                  timestamp: Date.now() 
              }, true);
              input.value = "";
              sendBtn.disabled = true;
          }
      };

      input.oninput = () => sendBtn.disabled = !input.value.trim();
      input.onkeydown = (e) => { if (e.key === "Enter") sendMessage(); };
      sendBtn.onclick = sendMessage;

      inputWrapper.appendChild(input);
      inputWrapper.appendChild(sendBtn);
      inputArea.appendChild(inputWrapper);
      chatContent.appendChild(inputArea);

      panel.appendChild(chatContent);

      // People Content
      const peopleContent = document.createElement("div");
      peopleContent.id = "wp-content-people";
      peopleContent.className = "wp-panel-content";
      panel.appendChild(peopleContent);

      document.body.appendChild(panel);
  }

  private addChatMessage(msg: any, isSelf = false) {
      const area = this.sidePanel?.querySelector(".wp-chat-messages");
      if (!area) return;

      const div = document.createElement("div");
      div.className = `wp-chat-msg ${isSelf ? "self" : ""}`;
      
      // Format time
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      div.innerHTML = `
        <div class="wp-chat-msg-header">
            <span class="wp-chat-author">${isSelf ? "You" : msg.sender}</span>
            <span class="wp-chat-time">${time}</span>
        </div>
        <div class="wp-chat-bubble">${msg.text}</div>
      `;

      area.appendChild(div);
      area.scrollTop = area.scrollHeight;

      if (!this.isPanelOpen || this.currentTab !== 'chat') {
          this.playSound('message');
          // Maybe show a badge on the chat button?
          const chatBtn = document.getElementById("wp-btn-chat");
          chatBtn?.classList.add("active"); // Flash it active briefly or permanently?
          setTimeout(() => {
              if (this.currentTab !== 'chat' || !this.isPanelOpen) chatBtn?.classList.remove("active");
          }, 1000);
      }
  }

  private showFloatingReaction(emoji: string) {
      const el = document.createElement("div");
      el.innerText = emoji;
      Object.assign(el.style, {
          position: "fixed",
          bottom: "100px",
          right: "100px", // Approximate area
          fontSize: "40px",
          zIndex: "2147483647",
          pointerEvents: "none",
          animation: "wp-float-up 2s forwards"
      });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
  }

  private updatePeopleList() {
      const container = document.getElementById("wp-content-people");
      if (!container) return;

      container.innerHTML = ""; // Clear

      // Add self
      this.addParticipant(this.user?.nickname || "Me", true);

      // Add others
      if (this.streamManager) {
          const others = Array.from(this.streamManager.connectedUsers.values());
          if (others.length === 0) {
               const div = document.createElement("div");
               div.className = "wp-participant-item";
               div.style.color = "#9aa0a6";
               div.style.justifyContent = "center";
               div.style.fontStyle = "italic";
               div.innerText = "Waiting for others...";
               container.appendChild(div);
          } else {
              others.forEach(user => {
                  this.addParticipant(user.nickname, false);
              });
          }
      }
  }

  private addParticipant(name: string, isSelf: boolean) {
      const container = document.getElementById("wp-content-people");
      const div = document.createElement("div");
      div.className = "wp-participant-item";
      div.innerHTML = `
        <div class="wp-avatar">${name[0].toUpperCase()}</div>
        <div class="wp-participant-name">${name} ${isSelf ? "(You)" : ""}</div>
      `;
      container?.appendChild(div);
  }

  private showConfetti() {
      // Placeholder for now
      console.log("Confetti!");
  }
}

new WatchPartyManager();
