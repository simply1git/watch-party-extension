import React, { useState, useEffect } from "react"
import { CONFIG } from "./config"

console.log("Popup script executing...");

const styles = `
:root {
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --bg-dark: #0f172a;
  --bg-card: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border: #334155;
  --success: #10b981;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: var(--text-main);
  width: 360px;
  height: 520px;
}

.container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 20px;
  background: linear-gradient(to right, #818cf8, #c084fc, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: hue-rotate 10s infinite linear;
  filter: drop-shadow(0 0 5px rgba(129, 140, 248, 0.5));
}

@keyframes hue-rotate {
  from { filter: hue-rotate(0deg); }
  to { filter: hue-rotate(360deg); }
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.2);
  backdrop-filter: blur(4px);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--success);
  box-shadow: 0 0 10px var(--success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

/* Tabs */
.tabs {
  display: flex;
  background: rgba(30, 41, 59, 0.5);
  padding: 4px;
  border-radius: 16px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tab {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

/* Card Content */
.card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-left: 4px;
}

.input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  background: rgba(15, 23, 42, 0.8);
}

.btn-primary {
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 13px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4), 0 4px 6px -2px rgba(99, 102, 241, 0.2);
  filter: brightness(1.1);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Room Info */
.room-info {
  margin-top: auto;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.copy-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.6);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-link:hover {
  border-color: #818cf8;
  background: rgba(15, 23, 42, 0.8);
}
`;

// Icons (Inline SVG for performance/simplicity)
const Icons = {
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  )
}

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<"join" | "create">("create")
  const [roomId, setRoomId] = useState("")
  const [nickname, setNickname] = useState("")
  const [avatar, setAvatar] = useState("👤")
  const [status, setStatus] = useState<"connected" | "disconnected">("disconnected")
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [isRestricted, setIsRestricted] = useState(false)
  const [recentRooms, setRecentRooms] = useState<string[]>([])

  // Socket connection status check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${CONFIG.SERVER_URL}/health`);
        if (res.ok) setStatus("connected");
        else setStatus("disconnected");
      } catch (e) {
        setStatus("disconnected");
      }
    }
    
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);
  const [isStreaming, setIsStreaming] = useState(false)
  const [mode, setMode] = useState<"sync" | "stream">("stream")
  const [siteName, setSiteName] = useState("")
  const [theme, setTheme] = useState("default")
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const AVATARS = ["🐶", "🐱", "🦊", "🐼", "🐵", "🦄", "👽", "🤖", "🎃", "👻", "💩", "🤡", "🤠", "👾", "🐉", "🦕"]
  const THEMES = [
    { id: "default", name: "Slate", color: "#6366f1" },
    { id: "cyberpunk", name: "Cyberpunk", color: "#f472b6" },
    { id: "cozy", name: "Cozy", color: "#f59e0b" },
    { id: "neon", name: "Neon", color: "#10b981" }
  ]

  // Check URL on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url)
        const hostname = url.hostname
        
        if (url.protocol === "chrome:" || url.protocol === "edge:" || url.protocol === "about:") {
            setIsRestricted(true)
        } else {
            setIsRestricted(false)
        }

        if (hostname.includes("youtube.com") || hostname.includes("netflix.com") || hostname.includes("vimeo.com")) {
            setMode("sync")
            setSiteName(hostname.replace("www.", ""))
        } else {
            setMode("stream")
            setSiteName("Generic Site")
        }
      }
    })

    chrome.storage.sync.get(["nickname", "avatar", "theme", "recentRooms"], (result) => {
      if (result.nickname) setNickname(result.nickname)
      if (result.avatar) setAvatar(result.avatar)
      if (result.theme) setTheme(result.theme)
      if (result.recentRooms) setRecentRooms(result.recentRooms)
    })
  }, [])

  const saveProfile = () => {
    chrome.storage.sync.set({ nickname, avatar, theme })
  }

  const addToRecentRooms = (room: string) => {
      const updated = [room, ...recentRooms.filter(r => r !== room)].slice(0, 5)
      setRecentRooms(updated)
      chrome.storage.sync.set({ recentRooms: updated })
  }

  const handleAction = () => {
    saveProfile()
    let roomToJoin = roomId
    if (activeTab === "create") {
      roomToJoin = Math.random().toString(36).substring(7)
    }
    
    if (!roomToJoin) return
    setCurrentRoom(roomToJoin)
    addToRecentRooms(roomToJoin)

    // Notify content script to join the room
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        // Check for restricted URLs
         const currentUrl = tabs[0].url || "";
         
         if (currentUrl.startsWith("chrome://") || currentUrl.startsWith("edge://") || currentUrl.startsWith("about:")) {
             setIsRestricted(true); // Switch to restricted view instead of alert
             setCurrentRoom(null);
             return;
         }

        try {
            await chrome.tabs.sendMessage(tabs[0].id, { 
              type: "JOIN_ROOM", 
              roomId: roomToJoin,
              user: { nickname: nickname || "Anonymous", avatar },
              mode: mode,
              theme: theme
            })
        } catch (err) {
            console.error("Failed to connect to content script:", err);
            alert("Could not connect to the page. Please REFRESH the page and try again.");
            setCurrentRoom(null);
        }
      }
    })
  }

  const toggleStream = () => {
    const action = isStreaming ? "STOP_STREAM" : "START_STREAM"
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        try {
            await chrome.tabs.sendMessage(tabs[0].id, { 
              type: action, 
              roomId: currentRoom,
              user: { nickname: nickname || "Anonymous", avatar }
            })
            setIsStreaming(!isStreaming)
        } catch (err) {
            console.error("Stream toggle failed:", err);
            alert("Connection lost. Please refresh the page.");
        }
      }
    })
  }

  return (
    <div className="container">
      <style>{styles}</style>
      {/* Header */}
      <header className="header">
        <div className="brand">
          <Icons.Logo />
          <span>SOTA Watch</span>
        </div>
        <div className="status-badge">
          <div className="status-dot" style={{ background: status === "connected" ? "#10b981" : "#ef4444" }} />
          {status === "connected" ? "Online" : "Offline"}
        </div>
      </header>

      {/* Restricted Mode View */}
      {isRestricted ? (
        <div className="card" style={{ textAlign: "center", alignItems: "center", gap: "20px" }}>
            <div style={{ fontSize: "48px" }}>🛑</div>
            <div>
                <h3 style={{ margin: "0 0 8px 0", color: "#f87171" }}>Restricted Page</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", lineHeight: "1.5" }}>
                    Extensions cannot run on browser system pages (like New Tab or Settings).
                </p>
            </div>
            
            <button 
                className="btn-primary" 
                style={{ width: "100%", background: "#ef4444" }}
                onClick={() => window.open("https://www.youtube.com", "_blank")}
            >
                Open YouTube
            </button>
            
            <div style={{ fontSize: "11px", color: "#64748b" }}>
                Tip: Navigate to a video site and click the extension again.
            </div>
        </div>
      ) : !currentRoom ? (
        <>
          {/* Smart Mode Indicator */}
          <div style={{ 
            padding: "10px", 
            background: mode === "sync" ? "rgba(16, 185, 129, 0.1)" : "rgba(99, 102, 241, 0.1)",
            border: `1px solid ${mode === "sync" ? "#10b981" : "#6366f1"}`,
            borderRadius: "8px",
            marginBottom: "12px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>{mode === "sync" ? "⚡" : "📡"}</span>
            <div>
              <div style={{ fontWeight: 600, color: mode === "sync" ? "#10b981" : "#818cf8" }}>
                {mode === "sync" ? "Native Sync Ready" : "Stream Mode"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                {mode === "sync" 
                  ? `Detected ${siteName}. Syncing player commands.` 
                  : "Generic site. Using P2P screen streaming."}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="label">Identity & Theme</label>
              <div style={{ display: "flex", gap: "4px" }}>
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      background: t.color, border: theme === t.id ? "2px solid white" : "none",
                      cursor: "pointer", boxShadow: theme === t.id ? "0 0 0 2px " + t.color : "none"
                    }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ position: "relative" }}>
                <button 
                  className="input" 
                  style={{ width: "50px", textAlign: "center", cursor: "pointer", fontSize: "20px", padding: "10px" }}
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                >
                  {avatar}
                </button>
                
                {showAvatarPicker && (
                  <div style={{
                    position: "absolute", top: "110%", left: "0",
                    background: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
                    padding: "8px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "4px", zIndex: 10, width: "180px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
                  }}>
                    {AVATARS.map(a => (
                      <button
                        key={a}
                        onClick={() => { setAvatar(a); setShowAvatarPicker(false); }}
                        style={{
                          background: "transparent", border: "none",
                          fontSize: "20px", cursor: "pointer", padding: "8px",
                          borderRadius: "8px", transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                className="input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="tabs">
            <button 
              className={`tab ${activeTab === "create" ? "active" : ""}`}
              onClick={() => setActiveTab("create")}
            >
              Create Room
            </button>
            <button 
              className={`tab ${activeTab === "join" ? "active" : ""}`}
              onClick={() => setActiveTab("join")}
            >
              Join Room
            </button>
          </div>

          {/* Recent Rooms */}
          {activeTab === "join" && recentRooms.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                  <label className="label" style={{ marginBottom: "8px", display: "block" }}>Recent Rooms</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {recentRooms.map(room => (
                          <button 
                            key={room}
                            onClick={() => setRoomId(room)}
                            style={{
                                background: "rgba(99, 102, 241, 0.1)",
                                border: "1px solid rgba(99, 102, 241, 0.2)",
                                color: "#818cf8",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                fontSize: "11px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                          >
                              {room}
                          </button>
                      ))}
                  </div>
              </div>
          )}

          <div className="card">
            <div className="input-group">
              <label className="label">
                {activeTab === "create" ? "Start a new session" : "Enter Room ID"}
              </label>
              {activeTab === "join" && (
                <input 
                  className="input"
                  placeholder="e.g. room-123"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              )}
              {activeTab === "create" && (
                <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
                  Create a new high-quality watch party room. You'll get a link to share with friends.
                </p>
              )}
            </div>

            <button className="btn-primary" onClick={handleAction}>
              {activeTab === "create" ? "Create Party" : "Join Party"}
              <Icons.ArrowRight />
            </button>
          </div>
        </>
      ) : (
        <div className="card">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ 
              width: 60, height: 60, background: "rgba(99, 102, 241, 0.1)", 
              borderRadius: "50%", display: "flex", alignItems: "center", 
              justifyContent: "center", margin: "0 auto 16px", color: "#6366f1" 
            }}>
              <Icons.Logo />
            </div>
            <h3 style={{ margin: 0, fontSize: 18 }}>You're in!</h3>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Waiting for video to start...</p>
          </div>

          <div className="input-group">
            <label className="label">Room Code</label>
            <div className="copy-link" onClick={() => navigator.clipboard.writeText(currentRoom)}>
              <span style={{ fontFamily: "monospace" }}>{currentRoom}</span>
              <Icons.Copy />
            </div>
          </div>

          <div className="room-info">
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <div className="status-badge" style={{ background: "rgba(255, 255, 255, 0.05)", border: "none" }}>
                <Icons.Users />
                <span>1 User</span>
              </div>
            </div>
          </div>

          {mode === "stream" ? (
            <button 
              className="btn-primary" 
              style={{ background: isStreaming ? "#ef4444" : "#8b5cf6", marginBottom: 12, marginTop: 16 }}
              onClick={toggleStream}
            >
              {isStreaming ? "Stop Streaming" : "Start Stream"}
            </button>
          ) : (
            <div style={{ 
              marginTop: 16, marginBottom: 12, padding: 12, 
              background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", 
              borderRadius: 8, textAlign: "center", color: "#10b981", fontSize: 13 
            }}>
              ⚡ Sync Mode Active
            </div>
          )}

          <button 
            className="btn-primary" 
            style={{ background: "#ef4444", marginTop: "auto" }}
            onClick={() => setCurrentRoom(null)}
          >
            Leave Room
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: "#475569" }}>
        State of the Art Architecture v0.1
      </div>
    </div>
  )
}

export default IndexPopup
