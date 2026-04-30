import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
export const socket = io("https://sf-backend-kio9.onrender.com/", {
  transports: ["websocket"],
});

socket.on("connect", () => console.log("✅ Connected:", socket.id));
socket.on("disconnect", () => console.log("❌ Disconnected"));
