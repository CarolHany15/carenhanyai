import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import instructorRoutes from "./routes/instructor.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import { pool } from "./config/database.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

// Basic origin check for state-changing browser requests.
// Add a dedicated CSRF token strategy before production deployment.
app.use("/api", (req, res, next) => {
  const methods = ["POST", "PUT", "PATCH", "DELETE"];
  const origin = req.get("origin");
  const requestOrigin = new URL(`${req.protocol}://${req.get("host")}`).origin;
  if (methods.includes(req.method) && origin && origin !== requestOrigin) {
    return res.status(403).json({ message: "Request origin is not allowed." });
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ message: "DAHAB DIVE CENTER API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bookings", bookingRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await pool.query("SELECT 1");
    app.listen(PORT, () => console.log(`DAHAB API running on port ${PORT}`));
  } catch (error) {
    console.error("Could not connect to PostgreSQL:", error);
    process.exit(1);
  }
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export = app;
