import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/database.js";
import {
  authenticate,
  allowRoles,
  type AuthRequest
} from "../middleware/auth.middleware.js";

const router = Router();

const createBookingSchema = z.object({
  sessionId: z.string().uuid(),
  instructorId: z.string().uuid().optional(),
  phone: z.string().trim().min(5).max(30)
});

// POST /api/bookings — create a booking for the logged-in customer.
router.post(
  "/",
  authenticate,
  allowRoles("customer"),
  async (req: AuthRequest, res) => {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Please check your booking details.",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const customerId = req.user!.customerId;
    if (!customerId) {
      return res.status(403).json({ message: "Customer profile is not linked to this account." });
    }

    const { sessionId, instructorId, phone } = parsed.data;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Lock the session row so simultaneous requests cannot overbook its capacity.
      const sessionResult = await client.query(
        `SELECT id, capacity, status, start_time
         FROM public.diving_sessions
         WHERE id = $1
         FOR UPDATE`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Diving session not found." });
      }

      const session = sessionResult.rows[0];
      if (session.status !== "scheduled" || new Date(session.start_time) <= new Date()) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "This diving session is not available." });
      }

      if (instructorId) {
        const instructorResult = await client.query(
          `SELECT id FROM public.staff WHERE id = $1 AND role = 'instructor'`,
          [instructorId]
        );
        if (instructorResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "Selected instructor is not valid." });
        }
      }

      const duplicateResult = await client.query(
        `SELECT id FROM public.bookings
         WHERE customer_id = $1 AND session_id = $2`,
        [customerId, sessionId]
      );

      if (duplicateResult.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "You already have a booking for this session." });
      }

      const countResult = await client.query(
        `SELECT COUNT(*)::int AS booked
         FROM public.bookings
         WHERE session_id = $1 AND status IN ('pending', 'confirmed')`,
        [sessionId]
      );

      if (countResult.rows[0].booked >= session.capacity) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "This diving session is fully booked." });
      }

      const bookingResult = await client.query(
        `INSERT INTO public.bookings
          (customer_id, session_id, instructor_id, booking_phone)
         VALUES ($1, $2, $3, $4)
         RETURNING id, customer_id, session_id, instructor_id, booking_phone,
                   status, created_at`,
        [customerId, sessionId, instructorId ?? null, phone]
      );

      await client.query("COMMIT");
      return res.status(201).json({
        message: "Diving session booked successfully.",
        booking: bookingResult.rows[0]
      });
    } catch (error: unknown) {
      await client.query("ROLLBACK");
      if ((error as { code?: string }).code === "23505") {
        return res.status(409).json({ message: "You already have a booking for this session." });
      }
      console.error("Create booking error:", error);
      return res.status(500).json({ message: "Could not create booking. Please try again." });
    } finally {
      client.release();
    }
  }
);

// GET /api/bookings/my — only bookings belonging to the logged-in customer.
router.get("/my", authenticate, allowRoles("customer"), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id, b.status, b.booking_phone, b.created_at,
         ds.id AS session_id, ds.title AS session_title, ds.start_time, ds.price,
         s.full_name AS instructor_name
       FROM public.bookings b
       JOIN public.diving_sessions ds ON ds.id = b.session_id
       LEFT JOIN public.staff s ON s.id = b.instructor_id
       WHERE b.customer_id = $1
       ORDER BY ds.start_time DESC`,
      [req.user!.customerId]
    );
    return res.json({ bookings: result.rows });
  } catch (error) {
    console.error("My bookings error:", error);
    return res.status(500).json({ message: "Could not load your bookings." });
  }
});

// GET /api/bookings — receptionist sees all bookings.
router.get(
  "/",
  authenticate,
  allowRoles("receptionist"),
  async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           b.id, b.status, b.booking_phone, b.created_at,
           c.full_name AS customer_name, c.email AS customer_email,
           ds.title AS session_title, ds.start_time, ds.price,
           s.full_name AS instructor_name
         FROM public.bookings b
         JOIN public.customers c ON c.id = b.customer_id
         JOIN public.diving_sessions ds ON ds.id = b.session_id
         LEFT JOIN public.staff s ON s.id = b.instructor_id
         ORDER BY ds.start_time DESC`
      );
      return res.json({ bookings: result.rows });
    } catch (error) {
      console.error("Receptionist bookings error:", error);
      return res.status(500).json({ message: "Could not load bookings." });
    }
  }
);

// PATCH /api/bookings/:id/status — receptionist updates booking status.
router.patch(
  "/:id/status",
  authenticate,
  allowRoles("receptionist"),
  async (req, res) => {
    const idSchema = z.string().uuid();
    const statusSchema = z.object({
      status: z.enum(["pending", "confirmed", "cancelled"])
    });

    const id = idSchema.safeParse(req.params.id);
    const body = statusSchema.safeParse(req.body);

    if (!id.success || !body.success) {
      return res.status(400).json({ message: "A valid booking ID and status are required." });
    }

    try {
      const result = await pool.query(
        `UPDATE public.bookings
         SET status = $1
         WHERE id = $2
         RETURNING id, status`,
        [body.data.status, id.data]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Booking not found." });
      }
      return res.json({
        message: "Booking status updated.",
        booking: result.rows[0]
      });
    } catch (error) {
      console.error("Update booking status error:", error);
      return res.status(500).json({ message: "Could not update booking status." });
    }
  }
);

export default router;
