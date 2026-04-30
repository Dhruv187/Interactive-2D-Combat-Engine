import express from "express";
import http from "http";
const PORT = process.env.PORT || 3000;
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://interactive-2-d-combat-engine.vercel.app/",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("street fighter running");
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("player connected", socket.id);

  // Host sends { roomId, selectedStage }
  socket.on("createRoom", ({ roomId, selectedStage }) => {
    if (rooms[roomId]) {
      return socket.emit("errMessage", "Room already exist");
    }

    rooms[roomId] = {
      players: [{ id: socket.id, playerId: 0 }],
      selectedStage: selectedStage || "ken",
    };
    socket.join(roomId);
    socket.emit("roomCreated", { roomId, playerId: 0 });
    console.log(`Room created: ${roomId}, stage: ${selectedStage}`);
  });

  //Join

  socket.on("joinRoom", (roomId) => {
    const room = rooms[roomId];
    if (!room) return socket.emit("errMessage", "Room not found");
    if (room.players.length >= 2)
      return socket.emit("errMessage", "Room filled");

    const joiner = { id: socket.id, playerId: 1 };
    room.players.push(joiner);
    socket.join(roomId);

    const mapping = {};
    room.players.forEach((p) => (mapping[p.id] = p.playerId));

    // Include selectedStage so the joiner can load the correct stage
    io.to(roomId).emit("bothJoined", {
      roomId,
      mapping,
      selectedStage: room.selectedStage,
    });
    console.log("Both player ready", mapping, "stage:", room.selectedStage);
  });

  // Movement

  socket.on("playerMove", ({ roomId, playerId, moveData }) => {
    socket.to(roomId).emit("opponentMove", { playerId, moveData });
  });

  //Webrtc

  socket.on("webrtc-offer", ({ roomId, sdp, playerId }) => {
    socket.to(roomId).emit("webrtc-offer", { sdp, playerId });
  });

  socket.on("webrtc-answer", ({ roomId, sdp, playerId }) => {
    socket.to(roomId).emit("webrtc-answer", { sdp, playerId });
  });

  socket.on("webrtc-ice", ({ roomId, candidate, playerId }) => {
    socket.to(roomId).emit("webrtc-ice", { candidate, playerId });
  });

  //Disconnect

  socket.on("disconnect", () => {
    console.log("disconnected", socket.id);
    for (const [roomId, room] of Object.entries(rooms)) {
      const wasInRoom = room.players.some((p) => p.id === socket.id);
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.players.length === 0) {
        delete rooms[roomId];
      } else if (wasInRoom) {
        // Notify the remaining player that their opponent disconnected
        io.to(roomId).emit("opponentDisconnected");
      }
    }
  });
});

server.listen(PORT, () => console.log(`server started on ${PORT}`));
