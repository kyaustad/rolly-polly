/**
 * Rolly Polly - Multiplayer TTRPG dice server
 * Run: node server/index.js (or pnpm run dev:server)
 * Listens on port 3001 for Socket.io.
 */
import { createServer } from "http";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const nanoid = customAlphabet(ALPHABET, 6);

const corsOrigin = process.env.CORS_ORIGIN;
const corsOrigins = corsOrigin
  ? corsOrigin.split(",").map((s) => s.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: corsOrigins },
});

const rooms = new Map(); // roomCode -> { players: Map(socketId -> { name, id }) }

function getRoom(code) {
  return rooms.get(code.toUpperCase());
}

function ensureRoom(code) {
  const c = code.toUpperCase();
  if (!rooms.has(c)) rooms.set(c, { players: new Map() });
  return rooms.get(c);
}

function playerListFor(room, forSocketId) {
  return Array.from(room.players.entries()).map(([sid, p]) => ({
    id: p.id,
    name: p.name,
    you: sid === forSocketId,
  }));
}

io.on("connection", (socket) => {
  socket.on("create_room", (playerName, reply) => {
    const code = nanoid();
    const room = ensureRoom(code);
    const id = nanoid(10);
    room.players.set(socket.id, { name: playerName || "Player", id });
    socket.join(code);
    socket.roomCode = code;
    socket.playerId = id;
    socket.playerName = playerName || "Player";
    reply?.({ code, id, playerName: socket.playerName });
    socket.to(code).emit("player_joined", {
      id,
      name: socket.playerName,
      total: room.players.size,
      players: playerListFor(room, null),
    });
    socket.emit("room_joined", {
      code,
      id,
      name: socket.playerName,
      players: playerListFor(room, socket.id),
    });
  });

  socket.on("join_room", (payload, reply) => {
    const { code, playerName } =
      typeof payload === "string" ? { code: payload, playerName: "Player" } : payload;
    const room = getRoom(code);
    if (!room) {
      reply?.({ error: "Room not found" });
      return;
    }
    const id = nanoid(10);
    room.players.set(socket.id, { name: playerName || "Player", id });
    socket.join(code);
    socket.roomCode = code;
    socket.playerId = id;
    socket.playerName = playerName || "Player";
    reply?.({ code, id, playerName: socket.playerName });
    socket.to(code).emit("player_joined", {
      id,
      name: socket.playerName,
      total: room.players.size,
      players: playerListFor(room, null),
    });
    socket.emit("room_joined", {
      code,
      id,
      name: socket.playerName,
      players: playerListFor(room, socket.id),
    });
  });

  socket.on("roll", (payload) => {
    const { numDice, results } = payload;
    const code = socket.roomCode;
    if (!code) return;
    const room = getRoom(code);
    const player = room?.players.get(socket.id);
    if (!player) return;
    const roll = {
      id: nanoid(10),
      playerId: player.id,
      playerName: player.name,
      numDice: Math.min(12, Math.max(1, numDice || 1)),
      results: Array.isArray(results) ? results : [],
      at: Date.now(),
    };
    io.to(code).emit("roll", roll);
  });

  socket.on("disconnect", () => {
    const code = socket.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;
    room.players.delete(socket.id);
    if (room.players.size === 0) rooms.delete(code);
    else
      socket.to(code).emit("player_left", {
        id: socket.playerId,
        name: socket.playerName,
        total: room.players.size,
        players: playerListFor(room, null),
      });
  });
});

const PORT = Number(process.env.PORT || process.env.SOCKET_PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`[rolly-polly] Socket server on http://localhost:${PORT}`);
});
