if (typeof globalThis.process === "undefined") {
  (globalThis as any).process = {
    env: {
      NODE_ENV: "production",
      PLASMO_PUBLIC_SERVER_URL: "https://watch-party-server-7tvy.onrender.com"
    },
  };
}
