const getEnvVar = () => {
  try {
    return process.env.PLASMO_PUBLIC_SERVER_URL;
  } catch (e) {
    return undefined;
  }
};

const SERVER_URL = getEnvVar() || "https://watch-party-server-7tvy.onrender.com";

console.log("[Config] Server URL:", SERVER_URL);

export const CONFIG = {
  SERVER_URL: SERVER_URL,
  WS_URL: SERVER_URL.replace(/^http/, 'ws') + "/yjs"
};
