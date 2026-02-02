const { io } = require("socket.io-client");
const Y = require("yjs");
const { WebsocketProvider } = require("y-websocket");
const WebSocket = require("ws");

// Polyfill for y-websocket in Node environment
global.WebSocket = WebSocket;

const SERVER_URL = "http://localhost:3000";
const ROOM_ID = "test-room-integration";

async function testSignaling() {
    console.log("--- Testing WebRTC Signaling ---");
    
    return new Promise((resolve, reject) => {
        const client1 = io(SERVER_URL);
        const client2 = io(SERVER_URL);
        let steps = 0;

        // Debug packets
        client1.io.engine.on("packet", (packet) => console.log("Client 1 packet:", packet.type, packet.data));
        client2.io.engine.on("packet", (packet) => console.log("Client 2 packet:", packet.type, packet.data));

        client1.on("connect_error", (err) => console.log("Client 1 connect_error:", err.message));
        client2.on("connect_error", (err) => console.log("Client 2 connect_error:", err.message));

        client1.on("connect", () => {
            console.log("Client 1 connected, ID:", client1.id);
            client1.emit("join-room", ROOM_ID, { nickname: "User1", avatar: "🐶" });
            console.log("Client 1 emitted join-room");
        });

        client2.on("connect", () => {
            console.log("Client 2 connected, ID:", client2.id);
            client2.emit("join-room", ROOM_ID, { nickname: "User2", avatar: "🐱" });
            console.log("Client 2 emitted join-room");
        });

        const handleUserJoin = (observer, joinerId, user) => {
            console.log(`Observer ${observer.id} saw joiner ${joinerId} (${user?.nickname})`);
            if (joinerId === client2.id || joinerId === client1.id) {
                 if (observer === client1 && joinerId === client2.id) {
                     console.log("PASS: Client 1 saw Client 2 join");
                     if (user?.nickname === "User2") console.log("PASS: Identity verified via user-joined");
                     initiateSignal(client1, client2);
                 } else if (observer === client2 && joinerId === client1.id) {
                     console.log("PASS: Client 2 saw Client 1 join");
                     initiateSignal(client2, client1);
                 }
            }
        };

        const initiateSignal = (sender, receiver) => {
             if (steps > 0) return; // Already signaled
             steps++;
             sender.emit("signal", {
                target: receiver.id,
                signal: { type: "offer", sdp: "mock-sdp-offer" }
            });
        };

        client1.on("user-joined", ({ userId, user }) => handleUserJoin(client1, userId, user));
        client2.on("user-joined", ({ userId, user }) => handleUserJoin(client2, userId, user));

        client1.on("room-users", (users) => {
            console.log("Client 1 existing users:", users);
            // users is now Array<{ userId, user }>
            const target = users.find(u => u.userId === client2.id);
            if (target) {
                console.log("PASS: Client 1 found Client 2 via room-users");
                if (target.user.nickname === "User2") console.log("PASS: Identity verified via room-users");
                initiateSignal(client1, client2);
            }
        });

        client2.on("room-users", (users) => {
            console.log("Client 2 existing users:", users);
            const target = users.find(u => u.userId === client1.id);
            if (target) {
                 console.log("PASS: Client 2 found Client 1 via room-users");
                 initiateSignal(client2, client1);
            }
        });

        const onSignal = (receiver, senderId, signal) => {
            console.log(`Client ${receiver === client1 ? '1' : '2'} received signal from ${senderId}:`, signal);
            if (signal.type === "offer") {
                console.log("PASS: Signal received correctly");
                // Cleanup
                client1.disconnect();
                client2.disconnect();
                resolve();
            }
        };

        client1.on("signal", ({ sender, signal }) => onSignal(client1, sender, signal));
        client2.on("signal", ({ sender, signal }) => onSignal(client2, sender, signal));

        setTimeout(() => {
            if (steps < 2) {
                reject(new Error("Timeout waiting for signaling test"));
                client1.disconnect();
                client2.disconnect();
            }
        }, 5000);
    });
}

async function testYjsSync() {
    console.log("\n--- Testing Y.js Synchronization ---");
    
    return new Promise((resolve, reject) => {
        const doc1 = new Y.Doc();
        const doc2 = new Y.Doc();
        
        const wsProvider1 = new WebsocketProvider(SERVER_URL + "/yjs", ROOM_ID, doc1);
        const wsProvider2 = new WebsocketProvider(SERVER_URL + "/yjs", ROOM_ID, doc2);

        const map1 = doc1.getMap("room-state");
        const map2 = doc2.getMap("room-state");

        let synced = false;

        wsProvider1.on('status', event => {
            console.log('Client 1 status:', event.status);
        });

        wsProvider2.on('status', event => {
            console.log('Client 2 status:', event.status);
        });

        // Wait for connection
        setTimeout(() => {
            console.log("Setting value on Client 1...");
            map1.set("playing", true);
            map1.set("timestamp", 12345);
        }, 1000);

        map2.observe(() => {
            if (map2.get("playing") === true && map2.get("timestamp") === 12345) {
                console.log("PASS: Client 2 received updates from Client 1");
                synced = true;
                wsProvider1.destroy();
                wsProvider2.destroy();
                resolve();
            }
        });

        setTimeout(() => {
            if (!synced) {
                reject(new Error("Timeout waiting for Y.js sync"));
                wsProvider1.destroy();
                wsProvider2.destroy();
            }
        }, 5000);
    });
}

async function testChat() {
    console.log("\n--- Testing Chat ---");
    return new Promise((resolve, reject) => {
        const client1 = io(SERVER_URL);
        const client2 = io(SERVER_URL);

        client1.on("connect", () => {
            client1.emit("join-room", ROOM_ID, { nickname: "Chatter1", avatar: "A" });
        });
        
        client2.on("connect", () => {
            client2.emit("join-room", ROOM_ID, { nickname: "Chatter2", avatar: "B" });
        });

        client2.on("chat-message", (msg) => {
            console.log("Client 2 received chat:", msg);
            if (msg.message === "Hello World" && msg.user.nickname === "Chatter1") {
                console.log("PASS: Chat message received correctly");
                client1.disconnect();
                client2.disconnect();
                resolve();
            }
        });

        // Wait a bit for connection then send
        setTimeout(() => {
            console.log("Client 1 sending chat...");
            client1.emit("chat-message", {
                roomId: ROOM_ID,
                message: "Hello World",
                user: { nickname: "Chatter1", avatar: "A" }
            });
        }, 1000);
        
        setTimeout(() => {
            reject(new Error("Timeout waiting for chat"));
            client1.disconnect();
            client2.disconnect();
        }, 5000);
    });
}

async function testReactions() {
    console.log("\n--- Testing Reactions ---");
    return new Promise((resolve, reject) => {
        const client1 = io(SERVER_URL);
        const client2 = io(SERVER_URL);

        client1.on("connect", () => {
            client1.emit("join-room", ROOM_ID, { nickname: "Reactor", avatar: "😎" });
        });
        
        client2.on("connect", () => {
            client2.emit("join-room", ROOM_ID, { nickname: "Viewer", avatar: "👀" });
        });

        client2.on("reaction", (data) => {
            console.log("Client 2 received reaction:", data);
            if (data.emoji === "🔥") {
                console.log("PASS: Reaction received correctly");
                
                // Test Buzz
                console.log("--- Testing Buzz ---");
                client1.emit("buzz", { roomId: ROOM_ID });
            }
        });

        client2.on("buzz", (data) => {
            console.log("Client 2 received buzz:", data);
            console.log("PASS: Buzz received correctly");
            // Cleanup
            client1.disconnect();
            client2.disconnect();
            resolve();
        });

        setTimeout(() => {
            console.log("Client 1 sending reaction...");
            client1.emit("reaction", {
                roomId: ROOM_ID,
                emoji: "🔥"
            });
        }, 1000);
        
        setTimeout(() => {
            reject(new Error("Timeout waiting for reaction"));
            client1.disconnect();
            client2.disconnect();
        }, 5000);
    });
}

(async () => {
    try {
        await testSignaling();
        await testYjsSync();
        await testChat();
        await testReactions();
        console.log("\nALL TESTS PASSED SUCCESSFULLY");
        process.exit(0);
    } catch (err) {
        console.error("\nTEST FAILED:", err);
        process.exit(1);
    }
})();
