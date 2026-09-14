const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
  });

  // =========================
  // SOCKET AUTH MIDDLEWARE
  // =========================

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select(
        "_id name email role isActive"
      );

      if (!user) {
        return next(new Error("User not found"));
      }

      if (!user.isActive) {
        return next(new Error("Account is inactive"));
      }

      socket.user = user;

      next();
    } catch (error) {
      console.error("❌ Socket authentication error:", error.message);
      next(new Error("Invalid or expired token"));
    }
  });

  // =========================
  // CONNECTION
  // =========================

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    const role = socket.user.role;

    console.log(
      `🔌 Socket connected: ${socket.user.name} (${role}) - ${socket.id}`
    );

    // Every authenticated user gets a personal room
    socket.join(`user:${userId}`);

    // Hall owners get an owner room
    if (role === "hallOwner") {
      socket.join(`owner:${userId}`);
    }

    // Admins get admin room
    if (role === "admin") {
      socket.join("admin");
    }

    // =========================
    // JOIN HALL ROOM
    // =========================

    socket.on("joinHall", (hallId) => {
      if (!hallId) return;

      socket.join(`hall:${hallId}`);

      console.log(
        `🏛️ ${socket.user.name} joined hall room: hall:${hallId}`
      );
    });

    // =========================
    // LEAVE HALL ROOM
    // =========================

    socket.on("leaveHall", (hallId) => {
      if (!hallId) return;

      socket.leave(`hall:${hallId}`);

      console.log(
        `🚪 ${socket.user.name} left hall room: hall:${hallId}`
      );
    });

    // =========================
    // DISCONNECT
    // =========================

    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 Socket disconnected: ${socket.user.name} - ${reason}`
      );
    });
  });

  console.log("🔌 Socket.IO initialized");

  return io;
};

// =========================
// GET IO INSTANCE
// =========================

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};

// =========================
// EMIT TO USER
// =========================

const emitToUser = (userId, event, data) => {
  if (!io) return;

  io.to(`user:${userId}`).emit(event, data);
};

// =========================
// EMIT TO OWNER
// =========================

const emitToOwner = (ownerId, event, data) => {
  if (!io) return;

  io.to(`owner:${ownerId}`).emit(event, data);
};

// =========================
// EMIT TO ADMIN
// =========================

const emitToAdmin = (event, data) => {
  if (!io) return;

  io.to("admin").emit(event, data);
};

// =========================
// EMIT TO HALL
// =========================

const emitToHall = (hallId, event, data) => {
  if (!io) return;

  io.to(`hall:${hallId}`).emit(event, data);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToOwner,
  emitToAdmin,
  emitToHall,
};