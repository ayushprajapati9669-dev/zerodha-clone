import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Routes
import orderRoutes from "./routes/order.js";
import holdingRoutes from "./routes/holding.js";
import positonRoutes from "./routes/position.js";
import fundRoutes from "./routes/fund.js";
import authRoutes from "./routes/auth.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";

import { connectTrueData } from "./services/trueDataService.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
export const io = new Server(server, {
      cors: {
            origin: [
                  "http://localhost:5173",
                  "http://localhost:5174",
            ],
            credentials: true,
      },
});

// Middleware
app.use(
      cors({
            origin: [
                  "http://localhost:5173",
                  "http://localhost:5174",
            ],
            credentials: true,
      }),
);

app.use(bodyParser.json());

app.use(passport.initialize());

app.use(cookieParser());

// Routes
app.use("/api/orders", orderRoutes);

app.use("/api/holdings", holdingRoutes);

app.use("/api/positions", positonRoutes);

app.use("/api/funds", fundRoutes);

app.use("/api/auth", authRoutes);

app.use(
      "/api/notifications",
      notificationRoutes,
);

app.use("/api/ai", aiRoutes);

app.use(
      "/api/watchlist",
      watchlistRoutes,
);

app.use("/api/market", marketRoutes);


// ===============================
// SOCKET.IO
// ===============================

io.on("connection", (socket) => {
      console.log(
            "Socket connected:",
            socket.id,
      );

      socket.on(
            "join-user-room",
            (userId) => {
                  if (!userId) {
                        return;
                  }

                  const roomName = `user:${userId}`;

                  socket.join(roomName);

                  console.log(
                        `User ${userId} joined room ${roomName}`,
                  );
            },
      );

      socket.on("disconnect", () => {
            console.log(
                  "Socket disconnected:",
                  socket.id,
            );
      });
});


// ===============================
// START SERVER
// ===============================

const startServer = async () => {
      try {
            await connectDB();

            console.log("MongoDB connected");

            connectTrueData();

            server.listen(PORT, () => {
                  console.log(
                        `Server is listening on port ${PORT}`,
                  );
            });
      } catch (error) {
            console.error(
                  "Database connection failed:",
                  error,
            );
      }
};

startServer();