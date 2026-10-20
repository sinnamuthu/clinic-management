
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "admin" | "doctor";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization;

 const bearerToken = authorization?.startsWith("Bearer ")
  ? authorization.slice("Bearer ".length).trim()
  : undefined;

const token = bearerToken || req.cookies?.clinic_token;

if (!token) {
  res.status(401).json({
    success: false,
    message: "Authentication token is required",
  });
  return;
}

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      success: false,
      message: "Authentication service is not configured",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      (decoded.role !== "admin" && decoded.role !== "doctor")
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    res.locals.authUser = {
      id: decoded.sub,
      role: decoded.role,
    } satisfies AuthenticatedUser;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

export function authorizeRoles(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.authUser as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}
