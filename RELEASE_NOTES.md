# Watch Party Extension v1.0 - Release Notes

We are excited to announce the first major release of the **Watch Party Extension**! This release brings a robust, real-time video sharing experience to your browser.

## 🚀 Key Features

### 🎥 Synchronized Viewing
-   **Real-time Video Sync**: Pause, play, and seek in perfect harmony with your friends.
-   **Smart Source Switching**: Automatically detects the main video player on complex sites (Netflix, YouTube, Prime Video, etc.).
-   **Decentralized Sync**: Powered by Y.js for conflict-free state management.

### 💬 Rich Communication
-   **Persistent Chat**: Chat history is now saved! Join a room late and see what you missed.
-   **Identity**: Choose a nickname and avatar to represent yourself in the room.
-   **"Buzz" Your Friends**: Send a visual "shake" and audio alert to grab everyone's attention.
-   **Live Reactions**: React to scenes with floating emojis (❤️, 😂, 😮, etc.).

### 🛠 Reliability & Performance
-   **Room Persistence**: Rooms stay alive for 24 hours. If the server restarts or you disconnect, your room state (and chat) is safe.
-   **Automatic Reconnection**: Seamlessly rejoins the room if your internet flickers.
-   **Resource cleanup**: Optimized connection management to prevent memory leaks.

## 📦 Deployment
-   **Cloud Ready**: Server is pre-configured for **Vercel** and **Railway/Heroku**.
-   **Easy Config**: Extension automatically points to your production server via environment variables.

## 🐛 Bug Fixes
-   Fixed an issue where native build bindings caused errors on Windows (switched to mocked Babel transformer).
-   Resolved socket connection leaks when closing the popup.

---

*Happy Watching!* 🍿
