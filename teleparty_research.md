# Teleparty (formerly Netflix Party) - Deep Dive Research & Architecture Analysis

## 1. Executive Summary
Teleparty is a browser extension and mobile application that enables synchronized video viewing and social interaction across multiple streaming platforms. It acts as a "remote control" layer on top of existing streaming services, ensuring all participants see the same content at the same time, accompanied by a real-time chat interface.

## 2. Core Features

### 2.1. Synchronization (The Core)
*   **Playback Sync:** When any user plays, pauses, or seeks the video, the action is replicated instantly for all other users in the "party".
*   **State Management:** The system handles buffering and network lags. If a user lags behind, the system pauses others or jumps the lagging user forward to catch up.
*   **Democratized Control:** Typically, any user can control playback, though "Only Host controls" is often an option.

### 2.2. Communication
*   **Text Chat:** A sidebar overlay that persists alongside the video player.
*   **Real-time Updates:** Message delivery is instant.
*   **Rich Media:** Emojis, GIFs (often via integrations like Giphy).
*   **Video/Voice Chat (Premium):** Teleparty Premium adds the ability to see and hear friends while watching.

### 2.3. Platform Support
*   **Free Tier:** Netflix, YouTube, Disney+, Hulu, HBO Max, Amazon Prime Video.
*   **Premium Tier:** Crunchyroll, Funimation, Paramount+, Apple TV+, ESPN+, and others.

### 2.4. Business Model
*   **Freemium:** Core sync and text chat are free.
*   **Subscription:** Monthly/Annual fee for Premium (Video/Voice chat, extra platforms, badges, priority support).

## 3. Technical Architecture Analysis

Based on research and standard industry patterns for this type of application, here is the inferred architecture:

### 3.1. Client-Side (Browser Extension)
*   **Content Scripts:** Injected into the specific streaming service's webpage (e.g., `netflix.com/watch/*`).
    *   **DOM Manipulation:** Finds the `<video>` element to attach event listeners (play, pause, seeking, timeupdate).
    *   **UI Injection:** Injects the chat sidebar into the page DOM.
*   **Background Service Worker:** Handles persistent connections (WebSockets) to the server, managing state even if the popup is closed.
*   **Popup UI:** The interface for "Start Party", "Join Party", and settings.

### 3.2. Server-Side (The Coordinator)
*   **Real-time Gateway:** Likely Node.js with WebSockets (Socket.io or raw `ws`).
    *   **Role:** Relays messages between clients. It does *not* stream video. It only streams *control signals* (timestamps, states).
*   **State Management:**
    *   **Redis:** Used for "volatile" state. Stores active rooms, connected user IDs, current playback timestamp, and play/pause status.
    *   **Persistence:** A database (SQL/NoSQL) for user accounts, chat history (optional/temporary), and premium subscriptions.

### 3.3. Synchronization Mechanism (The "Secret Sauce")
1.  **Event Interception:** When User A clicks pause, the Content Script intercepts the event.
2.  **Signal Transmission:** Content Script sends a `{ type: 'PAUSE', timestamp: 124.5 }` message to the Server via WebSocket.
3.  **Broadcast:** Server broadcasts this message to Users B, C, and D in the same room ID.
4.  **Execution:** Clients B, C, and D receive the message. Their Content Scripts programmatically trigger `video.pause()` and `video.currentTime = 124.5` (if needed to drift correct).

## 4. Proposed Architecture for Your Application

To build a similar application, I recommend the following modern stack:

### 4.1. Technology Stack
*   **Frontend (Extension):**
    *   **Framework:** React or Preact (lightweight) or Svelte.
    *   **Build Tool:** Vite or Webpack (configured for Manifest V3).
    *   **UI Library:** Tailwind CSS (scoped to avoid conflict with host sites) or styled-components.
*   **Backend (Signaling Server):**
    *   **Runtime:** Node.js (TypeScript).
    *   **Real-time Engine:** **Socket.io** (easiest for rooms/events) or **uWebSockets.js** (high performance).
    *   **Database:** **Redis** (essential for fast room state).
*   **Infrastructure:**
    *   **Hosting:** Railway, Render, or AWS (EC2/Fargate for persistent WebSocket connections). Serverless (Lambda) is generally *bad* for WebSockets due to connection limits and costs.

### 4.2. High-Level Data Flow
1.  **Create Room:** Client -> HTTP POST `/api/room` -> Returns `roomId`.
2.  **Join Room:** Client -> WebSocket Connect `/?roomId=xyz`.
3.  **Sync Loop:**
    *   Client sends `UPDATE_STATE` (time, status) every few seconds or on change.
    *   Server reconciles state (e.g., "Leader" source of truth or "Latest Action" wins).
    *   Server broadcasts `SYNC_TARGET` to all clients.

### 4.3. Key Challenges to Solve
*   **Video Element Isolation:** Streaming sites (like Netflix) use complex player wrappers (Cadmium player, etc.). You often need specific adapters for each site to find the correct video element and control it reliably.
*   **Anti-Cheat/DRM:** Some sites might block script injection or overlay interaction.
*   **Drift Correction:** Network latency means "play now" arrives 50ms later for someone else. You need a "threshold" (e.g., only seek if drift > 2 seconds) to avoid jittery playback.
