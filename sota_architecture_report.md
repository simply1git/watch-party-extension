# State-of-the-Art Watch Party Architecture: Synthesis & Recommendations

## 1. Executive Summary
To build a "top 1%" application that eliminates the limitations of current solutions (Teleparty, Scener, etc.), we must move beyond simple DOM manipulation and adopt a **Hybrid Multi-Mode Architecture**. This document synthesizes research on Distributed Systems (CRDTs), Real-Time Communication (WebRTC/SFU), and Cloud Rendering to propose a solution that offers the best of both worlds: high-fidelity synchronized playback *and* universal access.

## 2. Core Technologies & Research Findings

### 2.1. State Synchronization: CRDTs > Operational Transformation (OT)
*   **The Problem:** Traditional "Leader/Follower" logic is brittle. If the leader lags, everyone lags. If the leader disconnects, the room dies.
*   **The Solution: Conflict-free Replicated Data Types (CRDTs).**
    *   **Research:** Unlike Operational Transformation (used by Google Docs), CRDTs allow completely decentralized state management. Every client has a local replica of the "Room State" (Play status: `playing`, Time: `104.5s`).
    *   **Mechanism:** When a user pauses, they don't "request" a pause. They update their local state, which propagates as a "delta" to all peers. The CRDT algorithm mathematically guarantees that all peers will converge to the same state eventually, regardless of message order or network jitter.
    *   **Benefit:** Zero-latency UI updates for the user, offline tolerance, and no "central point of failure" for room logic.

### 2.2. Video Delivery: The "Hybrid" Approach
Current apps force a choice: **High Quality + Login Required** (Teleparty) OR **Low Quality + No Login** (Discord/Screen Share). A "No Cons" app must support **both**.

#### Mode A: "Direct Sync" (The Teleparty/Hulu Watch Party Model)
*   **Mechanism:** Command-based synchronization.
*   **Pros:** 4K/HDR quality (direct from Netflix/YouTube), negligible bandwidth cost for the host.
*   **Cons:** Requires all users to have accounts.
*   **Innovation:** Use **Computer Vision (Optical Character Recognition / Perceptual Hashing)** to detect play/pause states instead of DOM injection. This makes the extension "unbreakable" even if Netflix changes their HTML class names.

#### Mode B: "Virtual Stream" (The Hyperbeam/Discord Model)
*   **Mechanism:** WebRTC Screen Sharing via a Selective Forwarding Unit (SFU).
*   **Pros:** "Universal Access" (only host needs an account/file), works on any site.
*   **Cons:** High bandwidth, potential legal grey area (public performance).
*   **Tech Stack:**
    *   **SFU (Selective Forwarding Unit):** Unlike Mesh networking (which fails > 4 users), an SFU (like **Mediasoup** or **Jitsi Videobridge**) receives the stream *once* from the host and forwards it to N viewers efficiently.
    *   **Codecs:** VP9 or AV1 (if hardware supported) for maximum quality per bit.

### 2.3. Platform Independence: The "Virtual Browser" Concept
*   **The Problem:** Extensions don't work on TVs or Mobile Apps.
*   **The Solution:** For mobile/TV users, the app falls back to **Mode B (Stream)**. The desktop user "broadcasts" the tab. The mobile user sees a video stream.
*   **Advanced Option:** **Cloud Browsing**. Run a Headless Chromium instance in a Docker container on the server (using **Puppeteer** or **Playwright**), capture the viewport, and stream it to clients via WebRTC.
    *   *Result:* A "Phantom Browser" that runs in the cloud. The user controls it from an iPhone, an Xbox, or a cheap laptop.

## 3. Recommended "State of the Art" Architecture

To achieve the "Top 1%" status, we propose the following stack:

### 3.1. The "Cons-Free" Feature Set
1.  **Universal Sync:** Supports *any* video file (local), *any* streaming site (Netflix/YouTube), and *any* generic web video.
2.  **Zero-Config Join:** Friends can join via a simple link. If they have an account, they get **Mode A (4K Sync)**. If they don't, they auto-downgrade to **Mode B (WebRTC Stream)**.
3.  **Bulletproof Sync:** Powered by **Y.js** or **Automerge** (CRDT libraries).
4.  **Privacy:** End-to-End Encryption (E2EE) for chat and video streams using **WebRTC Insertable Streams**.

### 3.2. Technical Stack
*   **Frontend:** React + Vite (Fast, modular).
*   **Extension Core:** Plasmo Framework (Modern, cross-browser extension SDK).
*   **State Sync:** **Y.js** (CRDT) + **Hocuspocus** (Stateless WebSocket backend).
*   **Streaming Core:** **Mediasoup** (Node.js WebRTC SFU) for high-performance video relay.
*   **Resilience:** **Computer Vision** layer (using generic HTML5 Video API + simplistic pixel monitoring) to detect playback state when DOM selectors fail.

## 4. Addressing the "Cons" Directly

| Teleparty Con | Our "State of the Art" Solution |
| :--- | :--- |
| **Everyone needs an account** | **Hybrid Mode:** Auto-switch to **WebRTC Streaming** for users without accounts. |
| **Fragile (Breaks on updates)** | **Generic Adapters:** Use standard HTML5 `<video>` events + **Visual State Detection** (AI/CV) as fallback. |
| **Desktop Only** | **PWA + Stream Receiver:** Mobile/TV users join as "Stream Receivers" viewing the host's broadcast. |
| **Privacy Issues** | **E2EE:** Chat/Video encrypted. No persistent logs. |
| **Paid Features (Voice/Video)** | **Built-in WebRTC:** Free, high-quality voice/video chat included (standard WebRTC feature). |

## 5. Next Steps
1.  **Initialize Monorepo:** Setup `extension` (Client), `server` (Signaling + SFU), and `shared` (Types/CRDT logic).
2.  **Prototype Core Sync:** Implement Y.js over WebSockets.
3.  **Prototype Streaming:** Implement a basic WebRTC Tab Capture -> SFU -> Client pipeline.
