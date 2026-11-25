import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response) {
  return res.status(404).json({ message: "API route not found." });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled server error:", error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
}
