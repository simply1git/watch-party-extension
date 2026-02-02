
const io = require("socket.io-client");

const SERVER_URL = "http://localhost:3000";
const ROOM_ID = "test-room-history";

console.log("Starting Chat History Test...");

// Client A connects and sends a message
const clientA = io(SERVER_URL);

clientA.on("connect", () => {
  console.log("Client A connected:", clientA.id);
  
  clientA.emit("join-room", ROOM_ID, { nickname: "User A", avatar: "A" });
  
  setTimeout(() => {
    console.log("Client A sending message...");
    clientA.emit("chat-message", {
      roomId: ROOM_ID,
      message: "History Check 123",
      user: { nickname: "User A", avatar: "A" }
    });
    
    // Give it a moment to save, then disconnect
    setTimeout(() => {
      console.log("Client A disconnecting...");
      clientA.disconnect();
      startClientB();
    }, 500);
  }, 500);
});

function startClientB() {
  console.log("Starting Client B...");
  const clientB = io(SERVER_URL);
  
  let historyReceived = false;

  clientB.on("connect", () => {
    console.log("Client B connected:", clientB.id);
    clientB.emit("join-room", ROOM_ID, { nickname: "User B", avatar: "B" });
  });

  clientB.on("chat-history", (history) => {
    console.log("Client B received history:", JSON.stringify(history, null, 2));
    
    const found = history.some(msg => msg.message === "History Check 123");
    
    if (found) {
      console.log("SUCCESS: History verified! Message 'History Check 123' found.");
      process.exit(0);
    } else {
      console.log("FAILURE: Message not found in history.");
      process.exit(1);
    }
  });

  // Timeout if no history received
  setTimeout(() => {
    if (!historyReceived) {
      console.log("TIMEOUT: Client B did not receive history event.");
      process.exit(1);
    }
  }, 3000);
}
