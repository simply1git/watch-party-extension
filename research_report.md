# Watch Party Platforms: State of the Art Research (2025)

## 1. Executive Summary
The "Watch Together" market has matured from simple synchronization scripts to full-fledged social viewing platforms. The current "State of the Art" (SOTA) combines **frame-perfect synchronization** with **rich social presence** (video/voice/reactions) and **platform agnosticism**.

While our current MVP covers the *technical* core (Sync + P2P Streaming), it lacks the *social* layer that defines modern competitors like Scener and Discord.

## 2. Competitive Landscape Analysis

| Platform | Core Tech | Key Features | Pros | Cons |
| :--- | :--- | :--- | :--- | :--- |
| **Teleparty** (Netflix Party) | Extension + WebSocket | Syncs Netflix/Disney+/Hulu; Text Chat. | Lightweight; simple; widespread adoption. | Desktop only; text-only (mostly); requires all users to have sub. |
| **Scener** | Chrome Ext + WebRTC (SFU) | "Virtual Theater"; Video/Voice Chat; Host controls. | High social presence; handles large groups (1M+). | Heavy resource usage; complex setup; requires subs. |
| **Kast** | Cloud Browser / Screen Share | Screen sharing; Video/Voice; "Parties". | Works with ANY content (not just supported sites). | Quality depends on uploader; formerly paid-only cloud models. |
| **Discord** | WebRTC (SFU) | Screen Share; Low-latency Voice. | Ubiquitous; low friction for gamers. | No "Sync" logic (manual seek); 720p limit (free); DRM black screens. |
| **Apple SharePlay** | OS-Level FaceTime | Deep OS integration; Picture-in-Picture. | Seamless on Apple devices; shared playback controls. | Apple ecosystem locked; requires supported apps. |

## 3. Technical Architecture Trends

### A. Synchronization (The "When")
*   **Legacy:** Centralized server "pings" time (high latency, drift).
*   **SOTA:** **CRDTs (Conflict-free Replicated Data Types)** or Optimistic UI.
    *   *Our approach (Y.js)* is already SOTA here. It handles network jitter better than naive WebSocket message passing.

### B. Streaming (The "What")
*   **Method 1: Command Sync (Teleparty/Scener):**
    *   Don't stream video. Stream *commands* (Play @ 10:00).
    *   *Req:* Everyone needs a Netflix account.
    *   *Quality:* 4K/HDR (Native).
*   **Method 2: Screen Share (Discord/Kast):**
    *   Stream the pixels (WebRTC).
    *   *Req:* Only host needs account.
    *   *Quality:* 720p/1080p compressed.
    *   *SOTA Trend:* **Hybrid**. Use Command Sync where possible (YouTube, MP4), fall back to Screen Share for others.

### C. Social Presence (The "Who")
*   **Text:** Threaded chat, spoiler tags.
*   **Reactions:** Floating emojis over video (like TikTok/Instagram Live).
*   **Audio/Video:** Spatial audio (voice volume lowers when movie gets loud - "Ducking").

## 4. Gap Analysis (Us vs. SOTA)

| Feature | SOTA Standard | Our Current MVP | Status |
| :--- | :--- | :--- | :--- |
| **Sync Engine** | CRDT / Drift Correction | Y.js + Auto-Drift | ✅ **Parity** |
| **Streaming** | P2P / High Efficiency | WebRTC Mesh | ✅ **Parity** |
| **Identity** | Persistent Profiles / Avatars | Random IDs | ❌ **Missing** |
| **Chat** | Rich Text / Emojis / History | None | ❌ **Missing** |
| **Reactions** | Floating / Time-synced | None | ❌ **Missing** |
| **Mobile** | PWA / Native App | Desktop Extension | ❌ **Missing** |
| **DRM Bypass** | Auto-disable Hardware Accel | Manual Instruction | ⚠️ **Manual** |

## 5. Recommended Feature Roadmap
Based on this research, the immediate priority should be the **Social Layer** to transform the tool from a "utility" to a "platform".

1.  **Identity System:** Nicknames, Avatars (Gravatar/UIFaces), Persistence.
2.  **Real-Time Chat:** Side-panel chat with system events ("User joined").
3.  **Live Reactions:** Floating emojis for non-intrusive interaction.
4.  **Smart Source Switching:** Toggle between "Tab Capture" and "Direct Video Element Capture" for better performance.
