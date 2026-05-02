import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

export const socket = io("https://interactive-2d-combat-engine.onrender.com/", {
  transports: ["polling"],
  upgrade: false,
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

export function connectSocket() {
  if (!socket.connected && !socket.active) {
    socket.connect();
  }
}

socket.on("connect", () => console.log("Socket connected:", socket.id));
socket.on("disconnect", () => console.log("Socket disconnected"));
socket.on("connect_error", (error) =>
  console.warn("Socket connection failed:", error.message),
);
