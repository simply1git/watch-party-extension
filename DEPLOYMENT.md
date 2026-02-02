# Deployment Guide

This guide covers how to deploy the **Watch Party Server** and build the **Extension** for production.

---

## 🚀 Part 1: Deploying the Server

The server uses **Socket.IO**, which requires a hosting provider that supports **persistent WebSocket connections**.
**⚠️ Do NOT use Vercel or AWS Lambda** for the server, as they are serverless and will break the WebSocket connection.

### Recommended Providers
-   **Railway** (Easiest)
-   **Render**
-   **Heroku**
-   **Fly.io**

### Option A: Deploy to Railway (Recommended)

1.  Push your code to a GitHub repository.
2.  Sign up at [railway.app](https://railway.app/).
3.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
4.  Select your repository.
5.  **Important**: Railway typically detects the root. Since the server is in a subdirectory (`server/`), you need to configure the **Root Directory**:
    -   Go to **Settings** -> **General** -> **Root Directory**.
    -   Set it to `/server`.
6.  Railway will detect the `package.json` and `Procfile`.
    -   It will run `npm install`.
    -   It will run `npm run build` (compiles TypeScript).
    -   It will run `npm start` (starts the server).
7.  Once deployed, copy your **Public Domain** (e.g., `https://watch-party-production.up.railway.app`).

### Option B: Deploy to Render (Easiest)

1.  Sign up at [render.com](https://render.com/).
2.  Click **"New +"** -> **"Blueprint"**.
3.  Connect your GitHub repo (`watch-party-extension`).
4.  Render will automatically detect the `render.yaml` file and configure everything for you.
5.  Click **Apply**.
6.  Copy the URL (e.g., `https://watch-party-server.onrender.com`).

### Option C: Manual Render Setup (If Blueprint fails)

---

## 📦 Part 2: Building the Extension

Once your server is live, you need to build the extension so it connects to your *production* server instead of `localhost`.

### 1. Environment Configuration

The extension build script looks for an environment variable named `PLASMO_PUBLIC_SERVER_URL`.

### 2. Build Command

Open your terminal in the `extension` directory and run the following:

**Windows (PowerShell):**
```powershell
cd extension
$env:PLASMO_PUBLIC_SERVER_URL="https://YOUR-SERVER-URL.up.railway.app"
npm run build
```

**Mac/Linux:**
```bash
cd extension
PLASMO_PUBLIC_SERVER_URL="https://YOUR-SERVER-URL.up.railway.app" npm run build
```

*(Replace the URL with your actual server URL from Part 1)*

### 3. Locate the Build

The production-ready extension will be generated in:
`extension/build/chrome-mv3-prod`

---

## 🌍 Part 3: Distribution

### Option A: Manual Distribution (Side-loading)

1.  Zip the contents of `extension/build/chrome-mv3-prod`.
2.  Send the `.zip` file to your friends.
3.  They must:
    -   Unzip the file.
    -   Open Chrome -> `chrome://extensions`.
    -   Enable **Developer Mode**.
    -   Click **Load unpacked** and select the unzipped folder.

### Option B: Chrome Web Store

1.  Zip the contents of `extension/build/chrome-mv3-prod`.
2.  Create a Developer account at [chrome.google.com/webstore/dev](https://chrome.google.com/webstore/dev) ($5 fee).
3.  Upload the `.zip` file.
4.  Fill in the listing details (Description, Screenshots, etc.).
5.  Submit for review.
