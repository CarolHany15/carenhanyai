import "dotenv/config";
import { pool } from "../src/config/database.js";
import argon2 from "argon2";

async function main() {
  const fullName = process.env.RECEPTIONIST_NAME?.trim();
  const email = process.env.RECEPTIONIST_EMAIL?.trim().toLowerCase();
  const password = process.env.RECEPTIONIST_PASSWORD;
  if (!fullName || !email || !password || password.length < 10) {
    throw new Error("Set RECEPTIONIST_NAME, RECEPTIONIST_EMAIL, and RECEPTIONIST_PASSWORD (at least 10 characters) in server/.env first.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const staff = await client.query(
      `INSERT INTO public.staff (full_name, email, role)
       VALUES ($1, $2, 'receptionist') RETURNING id`,
      [fullName, email]
    );
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await client.query(
      `INSERT INTO public.users (email, password_hash, role, staff_id)
       VALUES ($1, $2, 'receptionist', $3)`,
      [email, passwordHash, staff.rows[0].id]
    );
    await client.query("COMMIT");
    console.log(`Receptionist account created for ${email}.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
