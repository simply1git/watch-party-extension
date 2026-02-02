# 🍿 Watch Party Extension

A modern browser extension for watching videos together remotely. Features real-time video synchronization, chat, reactions, and a "buzz" feature to get your friends' attention.

## ✨ Features

-   **Video Sync**: Play/Pause/Seek synchronization across all clients.
-   **Chat**: Real-time messaging with persistent history (new users see past messages).
-   **Smart Detection**: Automatically finds video elements on major streaming platforms.
-   **Interactions**: Send "Buzz" alerts (screen shake) and emoji reactions.
-   **Reliable**: Rooms persist for 24 hours; auto-reconnect handling.

## 📂 Project Structure

-   **`/extension`**: The browser extension (built with [Plasmo](https://docs.plasmo.com/), React, TypeScript).
-   **`/server`**: The WebSocket signaling server (Node.js, Socket.IO, Y.js).

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   npm or pnpm

### 📖 Deployment Guide
**👉 [Click here for the detailed DEPLOYMENT.md guide](DEPLOYMENT.md)** to learn how to:
1.  Deploy the server to the cloud (Railway/Render).
2.  Build the extension for production.
3.  Distribute it to friends.

### 1. Start the Server (Local Development)

The server handles room state and signaling.

```bash
cd server
npm install
npm run dev
```
*Server runs on `http://localhost:3000`*

### 2. Run the Extension (Development)

Load the extension in Chrome with hot-reloading.

```bash
cd extension
npm install
npm run dev
```
1.  Open Chrome and go to `chrome://extensions`
2.  Enable **Developer mode** (top right).
3.  Click **Load unpacked** and select `extension/build/chrome-mv3-dev`.

### 3. Build for Production

#### Server
Deploy the `/server` directory to any Node.js host (Vercel, Railway, Heroku, Render).
-   **Vercel**: Use the provided `vercel.json`.
-   **Railway/Heroku**: Use the provided `Procfile`.

#### Extension
Once your server is deployed, build the extension to point to it.

```bash
cd extension
# Replace with your actual deployed server URL
$env:PLASMO_PUBLIC_SERVER_URL="https://your-app.com"; npm run build
```
The production extension will be in `extension/build/chrome-mv3-prod`.

## 🧪 Testing

We have integration tests to verify connectivity and persistence.

```bash
# Run chat history persistence test
node test-chat-history.js
```

## 📜 License
MIT
