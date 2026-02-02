import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import WebSocket from 'ws';

// Polyfill WebSocket for Node.js environment
// @ts-ignore
global.WebSocket = WebSocket;

async function runTest() {
  console.log('--- Starting SOTA Sync Verification ---');

  const ROOM_ID = 'test-room-' + Date.now();
  
  // Simulate Client A (Host)
  const docA = new Y.Doc();
  const providerA = new WebsocketProvider('ws://localhost:3000/yjs', ROOM_ID, docA);
  const stateA = docA.getMap('room-state');

  // Simulate Client B (Viewer)
  const docB = new Y.Doc();
  const providerB = new WebsocketProvider('ws://localhost:3000/yjs', ROOM_ID, docB);
  const stateB = docB.getMap('room-state');

  // Helper to wait for sync
  const waitForSync = (doc: Y.Doc, provider: WebsocketProvider) => {
    return new Promise<void>((resolve) => {
      if (provider.synced) resolve();
      provider.on('sync', (isSynced: boolean) => {
        if (isSynced) resolve();
      });
    });
  };

  await Promise.all([waitForSync(docA, providerA), waitForSync(docB, providerB)]);
  console.log('✅ Both clients connected and synced');

  // TEST 1: Host Plays Video
  console.log('\n--- Test 1: Host Plays Video ---');
  stateA.set('playing', true);
  stateA.set('time', 10.5);
  stateA.set('lastUpdated', Date.now());

  // Wait for propagation
  await new Promise(r => setTimeout(r, 200));

  if (stateB.get('playing') === true && stateB.get('time') === 10.5) {
    console.log('✅ Client B received PLAY command correctly');
  } else {
    console.error('❌ Sync Failed:', stateB.toJSON());
  }

  // TEST 2: Viewer Pauses Video
  console.log('\n--- Test 2: Viewer Pauses Video ---');
  stateB.set('playing', false);
  stateB.set('time', 12.0); // Viewer watched a bit more before pausing

  // Wait for propagation
  await new Promise(r => setTimeout(r, 200));

  if (stateA.get('playing') === false && stateA.get('time') === 12.0) {
    console.log('✅ Client A received PAUSE command correctly');
  } else {
    console.error('❌ Sync Failed:', stateA.toJSON());
  }

  // Cleanup
  providerA.destroy();
  providerB.destroy();
  console.log('\n✅ Verification Complete');
  process.exit(0);
}

runTest().catch(console.error);
