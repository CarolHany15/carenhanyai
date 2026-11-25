import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "dahab_session";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  path: "/",
  maxAge: 15 * 60 * 1000
};

export function createToken(user: {
  id: string;
  role: string;
  customer_id: string | null;
  staff_id: string | null;
}) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return jwt.sign(
    {
      role: user.role,
      customerId: user.customer_id,
      staffId: user.staff_id
    },
    secret,
    { subject: user.id, expiresIn: "15m" }
  );
}
