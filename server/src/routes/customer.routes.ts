import { Router } from "express";
import { pool } from "../config/database.js";
import { authenticate, type AuthRequest, allowRoles } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/customers/me — only the logged-in customer's own profile.
router.get("/me", authenticate, allowRoles("customer"), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, created_at
       FROM public.customers WHERE id = $1`,
      [req.user!.customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer profile not found." });
    }
    return res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error("Customer profile error:", error);
    return res.status(500).json({ message: "Could not load customer profile." });
  }
});

export default router;
