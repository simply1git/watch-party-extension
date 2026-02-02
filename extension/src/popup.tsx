import { useState, useEffect } from "react"
import "./popup.css"

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

  // Socket connection status check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("http://localhost:3000/health");
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
  useState(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url)
        const hostname = url.hostname
        if (hostname.includes("youtube.com") || hostname.includes("netflix.com") || hostname.includes("vimeo.com")) {
            setMode("sync")
            setSiteName(hostname.replace("www.", ""))
        } else {
            setMode("stream")
            setSiteName("Generic Site")
        }
      }
    })

    chrome.storage.sync.get(["nickname", "avatar", "theme"], (result) => {
      if (result.nickname) setNickname(result.nickname)
      if (result.avatar) setAvatar(result.avatar)
      if (result.theme) setTheme(result.theme)
    })
  })

  const saveProfile = () => {
    chrome.storage.sync.set({ nickname, avatar, theme })
  }

  const handleAction = () => {
    saveProfile()
    let roomToJoin = roomId
    if (activeTab === "create") {
      roomToJoin = Math.random().toString(36).substring(7)
    }
    
    if (!roomToJoin) return
    setCurrentRoom(roomToJoin)

    // Notify content script to join the room
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: "JOIN_ROOM", 
          roomId: roomToJoin,
          user: { nickname: nickname || "Anonymous", avatar },
          mode: mode,
          theme: theme
        })
      }
    })
  }

  const toggleStream = () => {
    const action = isStreaming ? "STOP_STREAM" : "START_STREAM"
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: action, 
          roomId: currentRoom,
          user: { nickname: nickname || "Anonymous", avatar }
        })
        setIsStreaming(!isStreaming)
      }
    })
  }

  return (
    <div className="container">
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

      {/* Main Content */}
      {!currentRoom ? (
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
