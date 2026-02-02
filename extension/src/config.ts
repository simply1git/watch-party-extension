const SERVER_URL = process.env.PLASMO_PUBLIC_SERVER_URL || "http://localhost:3000";

export const CONFIG = {
  SERVER_URL: SERVER_URL,
  WS_URL: SERVER_URL.replace(/^http/, 'ws') + "/yjs"
};
