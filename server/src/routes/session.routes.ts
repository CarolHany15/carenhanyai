import { Router } from "express";
import { pool } from "../config/database.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/sessions — scheduled future sessions.
router.get("/", authenticate, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         ds.id, ds.title, ds.start_time, ds.capacity, ds.price,
         GREATEST(
           ds.capacity - COUNT(b.id) FILTER (WHERE b.status IN ('pending', 'confirmed')),
           0
         )::int AS spots_remaining
       FROM public.diving_sessions ds
       LEFT JOIN public.bookings b ON b.session_id = ds.id
       WHERE ds.status = 'scheduled' AND ds.start_time >= NOW()
       GROUP BY ds.id
       ORDER BY ds.start_time`
    );
    return res.json({ sessions: result.rows });
  } catch (error) {
    console.error("Session lookup error:", error);
    return res.status(500).json({ message: "Could not load diving sessions." });
  }
});

export default router;
