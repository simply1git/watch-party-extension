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
  COPY: '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
  MIC_ON: '<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
  MIC_OFF: '<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 2.76 2.24 5 5 5 .52 0 1.03-.06 1.5-.18L18.73 19l1.27-1.27L4.27 3zM12 19c-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
  CAM_ON: '<svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
  CAM_OFF: '<svg viewBox="0 0 24 24"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>',
  SCREEN: '<svg viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>',
  HAND: '<svg viewBox="0 0 24 24"><path d="M23 11l-3.05-6.68C19.56 3.42 18.72 3 17.84 3c-1.19 0-2.3.72-2.74 1.79l-1.1 2.68V4c0-1.38-1.12-2.5-2.5-2.5S9 2.62 9 4v5.5l-1.34-.34c-.26-.06-.52-.08-.78-.08-1.09 0-2.08.64-2.53 1.62l-2.04 4.54c-.16.36-.26.75-.26 1.16V20c0 2.21 1.79 4 4 4h9.5c1.93 0 3.68-1.42 3.96-3.32l1.24-8.68c.09-.64-.4-1.17-1.05-1.09-.32.04-.61.2-.78.47L17 14h-1l1.83-4.08 1.17-2.6.48-1.07c.18-.41.58-.68 1.03-.68.27 0 .52.1.72.27L23 11z"/></svg>',
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
  private isMicOn: boolean = false;
  private isCamOn: boolean = false;
  private isHandRaised: boolean = false;
  private isScreenSharing: boolean = false;

  constructor() {
    this.setupMessageListeners();
    this.setupMessageListeners();
  }

  private injectStyles() {
    if (document.getElementById("wp-styles")) return;
    
    const style = document.createElement("style");
    style.id = "wp-styles";
    style.textContent = cssText;
    document.head.appendChild(style);
    
    // Inject font
    if (!document.getElementById("wp-font")) {
        const fontLink = document.createElement("link");
        fontLink.id = "wp-font";
        fontLink.href = "https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap";
        fontLink.rel = "stylesheet";
        document.head.appendChild(fontLink);
    }
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

  private toggleMic() {
      this.isMicOn = !this.isMicOn;
      const btn = document.getElementById("wp-btn-mic");
      if (btn) {
          btn.innerHTML = `${this.isMicOn ? ICONS.MIC_ON : ICONS.MIC_OFF}<span class="wp-tooltip">${this.isMicOn ? 'Turn off microphone' : 'Turn on microphone'}</span>`;
          btn.classList.toggle("danger", !this.isMicOn);
          btn.classList.toggle("active", this.isMicOn);
      }
      this.streamManager?.toggleAudio(this.isMicOn);
  }

  private toggleCam() {
      this.isCamOn = !this.isCamOn;
      const btn = document.getElementById("wp-btn-cam");
      if (btn) {
          btn.innerHTML = `${this.isCamOn ? ICONS.CAM_ON : ICONS.CAM_OFF}<span class="wp-tooltip">${this.isCamOn ? 'Turn off camera' : 'Turn on camera'}</span>`;
          btn.classList.toggle("danger", !this.isCamOn);
          btn.classList.toggle("active", this.isCamOn);
      }
      this.streamManager?.toggleVideo(this.isCamOn);
  }

  private toggleHand() {
      this.isHandRaised = !this.isHandRaised;
      const btn = document.getElementById("wp-btn-hand");
      if (btn) {
          btn.classList.toggle("active", this.isHandRaised);
          // Optional: Add some visual indicator
      }
      this.streamManager?.toggleHand(this.isHandRaised);
      // Update local UI immediately
      if (this.user) {
          this.updateParticipantHand(this.user.nickname, this.isHandRaised);
      }
  }

  private async toggleScreenShare() {
      if (this.isScreenSharing) {
          this.streamManager?.stopScreenShare();
          this.isScreenSharing = false;
      } else {
          await this.streamManager?.startScreenShare();
          this.isScreenSharing = true;
      }
      
      const btn = document.getElementById("wp-btn-screen");
      if (btn) {
          btn.classList.toggle("active", this.isScreenSharing);
          btn.innerHTML = `${ICONS.SCREEN}<span class="wp-tooltip">${this.isScreenSharing ? 'Stop presenting' : 'Present now'}</span>`;
      }
  }

  private updateParticipantHand(userName: string, isRaised: boolean) {
      // Find participant item and add/remove hand icon
      const items = document.querySelectorAll(".wp-participant-item");
      items.forEach(item => {
          if (item.querySelector(".wp-participant-name")?.textContent?.includes(userName)) {
              const existingHand = item.querySelector(".wp-hand-icon");
              if (isRaised) {
                  if (!existingHand) {
                      const hand = document.createElement("div");
                      hand.className = "wp-hand-icon";
                      hand.innerHTML = "✋";
                      hand.style.marginLeft = "auto";
                      item.appendChild(hand);
                  }
              } else {
                  existingHand?.remove();
              }
          }
      });

      // Also update video grid if applicable
      // This is harder because video grid uses IDs/streamIDs. 
      // But we can try to find by label.
      const videoLabels = document.querySelectorAll(".wp-video-label");
      videoLabels.forEach(label => {
          if (label.textContent?.includes(userName)) {
              const wrapper = label.closest(".wp-video-wrapper");
              const existingHand = wrapper?.querySelector(".wp-video-hand");
              if (isRaised) {
                  if (!existingHand && wrapper) {
                      const hand = document.createElement("div");
                      hand.className = "wp-video-hand";
                      hand.innerHTML = "✋";
                      hand.style.position = "absolute";
                      hand.style.top = "8px";
                      hand.style.right = "8px";
                      hand.style.fontSize = "24px";
                      wrapper.appendChild(hand);
                  }
              } else {
                  existingHand?.remove();
              }
          }
      });
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
        onStreamFound: (stream, userId) => this.addVideoStream(stream, userId),
        onStreamEnded: (userId, streamId) => this.removeVideoStream(userId, streamId)
    });

    this.streamManager.onChatMessage = (msg) => this.addChatMessage(msg);
    this.streamManager.onChatHistory = (msgs) => msgs.forEach(msg => this.addChatMessage(msg));
    this.streamManager.onReaction = (data) => this.showFloatingReaction(data.emoji);
    this.streamManager.onBuzz = () => this.handleBuzz();
    this.streamManager.onHandUpdate = (data) => {
        const user = this.streamManager?.connectedUsers.get(data.userId);
        if (user) {
            this.updateParticipantHand(user.nickname, data.isRaised);
            if (data.isRaised) {
                this.playSound('message'); // Or a subtle ping
            }
        }
    };
    this.streamManager.onUserListUpdate = () => this.updatePeopleList();
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "JOIN_ROOM") {
        this.roomId = request.roomId;
        this.user = request.user;
        this.currentMode = request.mode || "stream"; 

        this.injectStyles();
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

  private addVideoStream(stream: MediaStream, userId: string) {
    let container = document.getElementById("wp-video-grid");
    if (!container) {
        container = document.createElement("div");
        container.id = "wp-video-grid";
        container.className = "wp-video-grid";
        document.body.appendChild(container);
    }

    // Use stream.id to allow multiple streams per user (e.g. screen + cam)
    const elementId = `wp-video-${userId}-${stream.id}`;
    const existing = document.getElementById(elementId);
    if (existing) return;

    const wrapper = document.createElement("div");
    wrapper.id = elementId;
    wrapper.className = "wp-video-wrapper";
    
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    // Mute local video to avoid feedback
    if (userId === "local" || (this.user && this.streamManager?.connectedUsers.get(userId)?.nickname === this.user.nickname)) {
        video.muted = true;
    }
    
    // Get user info
    const user = this.streamManager?.connectedUsers.get(userId);
    const label = document.createElement("div");
    label.className = "wp-video-label";
    label.innerText = (user?.nickname || userId) + (stream.getVideoTracks().length === 0 ? " (Audio)" : "");

    wrapper.appendChild(video);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  }

  private removeVideoStream(userId: string, streamId?: string) {
      if (streamId) {
          const el = document.getElementById(`wp-video-${userId}-${streamId}`);
          if (el) el.remove();
      } else {
          // Remove all streams for this user
          const wrappers = document.querySelectorAll(`[id^='wp-video-${userId}']`);
          wrappers.forEach(el => el.remove());
      }
      
      const container = document.getElementById("wp-video-grid");
      if (container && container.children.length === 0) {
          container.remove();
      }
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
              icon: ICONS.MIC_OFF,
              label: "Turn on microphone",
              id: "wp-btn-mic",
              action: () => this.toggleMic()
            },
            {
              icon: ICONS.CAM_OFF,
              label: "Turn on camera",
              id: "wp-btn-cam",
              action: () => this.toggleCam()
            },
            {
              icon: ICONS.SCREEN,
              label: "Present now",
              id: "wp-btn-screen",
              action: () => this.toggleScreenShare()
            },
            {
              icon: ICONS.HAND,
              label: "Raise hand",
              id: "wp-btn-hand",
              action: () => this.toggleHand()
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

      // Add Invite Button
      const inviteBtn = document.createElement("button");
      inviteBtn.className = "wp-participant-item";
      inviteBtn.style.width = "100%";
      inviteBtn.style.background = "rgba(138, 180, 248, 0.1)";
      inviteBtn.style.border = "none";
      inviteBtn.style.cursor = "pointer";
      inviteBtn.style.justifyContent = "center";
      inviteBtn.style.color = "#8ab4f8";
      inviteBtn.style.marginBottom = "8px";
      
      const copyIcon = ICONS.COPY.replace('<svg', '<svg style="width:16px;height:16px;margin-right:8px;fill:currentColor"');
      
      inviteBtn.innerHTML = `
        ${copyIcon}
        <span style="font-weight: 500">Copy Room ID: ${this.roomId}</span>
      `;
      inviteBtn.onclick = () => {
          if (this.roomId) {
              navigator.clipboard.writeText(this.roomId);
              const original = inviteBtn.innerHTML;
              inviteBtn.innerHTML = `<span style="color: #81c995; font-weight: 500">Copied!</span>`;
              setTimeout(() => inviteBtn.innerHTML = original, 2000);
          }
      };
      container.appendChild(inviteBtn);

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
