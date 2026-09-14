const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const connectDB = require("./config/db");
const { initializeSocket } = require("./config/socket");

const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// =========================
// DATABASE
// =========================

connectDB();

// =========================
// SOCKET.IO
// =========================

initializeSocket(server);

// =========================
// MIDDLEWARE
// =========================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Wedding Halls API is running 🚀",
  });
});

// =========================
// ROUTES
// =========================

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/halls", require("./routes/hallRoutes"));

app.use("/api/v1/packages", require("./routes/packageRoutes"));

app.use("/api/v1/payments", require("./routes/paymentRoutes"));

app.use(
  "/api/v1/availability",
  require("./routes/availabilityRoutes")
);

app.use("/api/v1/bookings", require("./routes/bookingRoutes"));

app.use("/api/v1/reviews", require("./routes/reviewRoutes"));

app.use(
  "/api/v1/dashboard",
  require("./routes/dashboardRoutes")
);

app.use(
  "/api/v1/notifications",
  require("./routes/notificationRoutes")
);

app.use("/api/v1/users", require("./routes/userRoutes"));

app.use(
  "/api/v1/admin/halls",
  require("./routes/adminHallRoutes")
);

// =========================
// 404
// =========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// =========================
// GLOBAL ERROR HANDLER
// =========================

app.use((err, req, res, next) => {
  console.error("❌ Global error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// =========================
// START SERVER
// =========================

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});