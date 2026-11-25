import { Router, type Request, type Response } from "express";
import { z } from "zod";
import argon2 from "argon2";
import rateLimit from "express-rate-limit";
import { pool } from "../config/database.js";
import { authenticate, type AuthRequest } from "../middleware/auth.middleware.js";
import { cookieOptions, createToken, SESSION_COOKIE } from "../utils/auth.js";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255),
  password: z.string().min(10).max(128),
  phone: z.string().trim().max(30).optional()
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128)
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

// Public registration creates customer accounts only.
// Receptionist accounts must be provisioned by a trusted administrator.
router.post("/register", authLimiter, async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Please check your registration details.",
      errors: parsed.error.flatten().fieldErrors
    });
  }

  const { fullName, password, phone } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const client = await pool.connect();

  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await client.query("BEGIN");

    const customerResult = await client.query(
      `INSERT INTO public.customers (full_name, email, phone)
       VALUES ($1, $2, $3) RETURNING id`,
      [fullName, email, phone ?? null]
    );

    const customerId = customerResult.rows[0].id;

    const userResult = await client.query(
      `INSERT INTO public.users (email, password_hash, role, customer_id)
       VALUES ($1, $2, 'customer', $3)
       RETURNING id, email, role, customer_id, staff_id`,
      [email, passwordHash, customerId]
    );

    await client.query("COMMIT");

    const user = userResult.rows[0];
    res.cookie(SESSION_COOKIE, createToken(user), cookieOptions);
    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer_id
      }
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({ message: "This email is already registered." });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed. Please try again." });
  } finally {
    client.release();
  }
});

router.post("/login", authLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please enter a valid email and password." });
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.customer_id, u.staff_id,
              s.role AS staff_role
       FROM public.users u
       LEFT JOIN public.staff s ON s.id = u.staff_id
       WHERE u.email = $1
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];
    const validPassword = await argon2.verify(user.password_hash, parsed.data.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const validCustomer =
      user.role === "customer" && !!user.customer_id && !user.staff_id;

    const validReceptionist =
      user.role === "receptionist" &&
      !!user.staff_id &&
      user.staff_role === "receptionist" &&
      !user.customer_id;

    if (!validCustomer && !validReceptionist) {
      return res.status(403).json({ message: "This account does not have an allowed role." });
    }

    res.cookie(SESSION_COOKIE, createToken(user), cookieOptions);
    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer_id
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
  });
  return res.json({ message: "Logged out successfully." });
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, customer_id
       FROM public.users WHERE id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Account no longer exists." });
    }

    const user = result.rows[0];
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer_id
      }
    });
  } catch (error) {
    console.error("Current user lookup error:", error);
    return res.status(500).json({ message: "Could not retrieve your account." });
  }
});

export default router;
