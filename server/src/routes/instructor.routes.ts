import { Router } from "express";
import { pool } from "../config/database.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/instructors — list instructor profiles for the booking form.
router.get("/", authenticate, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name
       FROM public.staff
       WHERE role = 'instructor'
       ORDER BY full_name`
    );
    return res.json({ instructors: result.rows });
  } catch (error) {
    console.error("Instructor lookup error:", error);
    return res.status(500).json({ message: "Could not load instructors." });
  }
});

export default router;
