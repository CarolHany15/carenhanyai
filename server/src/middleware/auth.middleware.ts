import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  role: string;
  customerId: string | null;
  staffId: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.dahab_session;

  if (!token) {
    return res.status(401).json({ message: "Please log in first." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Authentication configuration error." });
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    if (typeof decoded.sub !== "string" || typeof decoded.role !== "string") {
      return res.status(401).json({ message: "Invalid login token." });
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      customerId: typeof decoded.customerId === "string" ? decoded.customerId : null,
      staffId: typeof decoded.staffId === "string" ? decoded.staffId : null
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Your session has expired. Please log in again."
    });
  }
}

export function allowRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource."
      });
    }
    next();
  };
}
