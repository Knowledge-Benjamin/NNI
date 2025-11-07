const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const pino = require("pino");
const pinoHttp = require("pino-http");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

// Load environment variables
dotenv.config();
// === AUTO-DECODE GOOGLE CLOUD SERVICE ACCOUNT KEY FROM BASE64 ===
const keyPath = path.join(__dirname, "config", "google-cloud-key.json");

if (!fs.existsSync(keyPath)) {
  const base64Key = process.env.GCP_SERVICE_ACCOUNT_BASE64;
  if (!base64Key) {
    console.error(
      "FATAL: GCP_SERVICE_ACCOUNT_BASE64 environment variable is missing!"
    );
    process.exit(1);
  }

  try {
    const buffer = Buffer.from(base64Key, "base64");
    fs.mkdirSync(path.dirname(keyPath), { recursive: true });
    fs.writeFileSync(keyPath, buffer);
    console.log(
      "Google Cloud service account key decoded and saved to: " + keyPath
    );
  } catch (err) {
    console.error(
      "FATAL: Failed to decode GCP_SERVICE_ACCOUNT_BASE64:",
      err.message
    );
    process.exit(1);
  }
}
// === END DECODE ===
// Validate required environment
const requiredEnv = [
  "NODE_ENV",
  "PORT",
  "GOOGLE_CLOUD_PROJECT",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GCS_BUCKET_NAME",
];
requiredEnv.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Initialize logger
const logger = pino({
  level: NODE_ENV === "production" ? "info" : "debug",
  transport: NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});

// (dev) service env presence logging removed to avoid printing environment details

// Initialize Express app
const app = express();

// Initialize Express app

// Initialize app middleware

// CORS configuration
app.use(
  cors({
    origin:
      NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
      ? "https://yourdomain.com"
      : ["http://localhost:5173", "http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "User-Agent",
      "Referer",
      "Sec-Fetch-Mode",
      "Sec-Fetch-Site",
      "Sec-Fetch-Dest",
    ],
    exposedHeaders: ["Content-Length", "Content-Type"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Request logging with request ID
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"] || uuidv4(),
    autoLogging: true,
  })
);

// Body parsing
// Increase limits to allow larger article payloads (rich HTML, inline content)
// Keep this reasonably bounded to avoid DoS via huge request bodies.
const JSON_LIMIT = process.env.EXPRESS_JSON_LIMIT || "10mb";
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));

// Auth Routes
app.use("/api/auth", require("./src/routes/auth"));

// Articles Routes (protected)
app.use("/api/articles", require("./src/routes/articles"));

// Upload proxy (ImgBB) - server-side upload to hide API key from clients
app.use("/api/uploads", require("./src/routes/uploads"));

// Newsletter proxy (server-side Beehiiv forwarding)
app.use("/api/newsletter", require("./src/routes/newsletter"));

// Sitemap (dynamic)
app.use("/", require("./src/routes/sitemap"));

// Protect /api/users with JWT + ADMIN role
const { verifyToken, requireRole } = require("./src/middleware/auth");
app.use("/api/users", verifyToken, requireRole("ADMIN"));
app.use("/api/users", require("./src/routes/users"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is healthy",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: "1.0.0",
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  req.log.warn({ url: req.originalUrl }, "Route not found");
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((error, req, res, next) => {
  req.log.error(
    { err: error, url: req.originalUrl, method: req.method, requestId: req.id },
    "Unhandled error"
  );

  // Handle large payload errors explicitly
  if (error && (error.type === "entity.too.large" || error.status === 413)) {
    const msg =
      "Request payload too large. Reduce article size or upload images separately.";
    return res.status(413).json({ error: msg, requestId: req.id });
  }

  const status = error.status || error.statusCode || 500;
  const message =
    NODE_ENV === "production" ? "Internal Server Error" : error.message;

  res.status(status).json({
    error: message,
    requestId: req.id,
    ...(NODE_ENV !== "production" && { stack: error.stack }),
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on http://localhost:${PORT}`);
});

const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info("Server closed. Exiting.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
