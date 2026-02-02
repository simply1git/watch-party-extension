// Shim for global process variable - Browser Compatible
(function() {
  const processShim = {
    env: {
      NODE_ENV: 'production',
      PLASMO_PUBLIC_SERVER_URL: 'https://watch-party-server-7tvy.onrender.com'
    },
    version: '',
    platform: 'browser',
    nextTick: (cb) => setTimeout(cb, 0),
    cwd: () => '/'
  };

  // Expose on global object
  if (typeof globalThis !== 'undefined') {
    globalThis.process = processShim;
  } else if (typeof window !== 'undefined') {
    window.process = processShim;
  }
  
  console.log('Process polyfill loaded manually');
})();
