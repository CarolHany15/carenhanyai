import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from environment variables.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase PostgreSQL connections require SSL.
  // Use the Supabase-provided connection string and SSL settings for your project.
  ssl: { rejectUnauthorized: true },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

pool.on("error", (error) => {
  console.error("Unexpected database connection error:", error);
});
