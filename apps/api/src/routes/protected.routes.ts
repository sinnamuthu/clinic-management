
import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";
import type { Router as ExpressRouter } from "express";


const router: ExpressRouter = Router();

router.get("/me", authenticate, (req, res) => {
  const user = res.locals.authUser;

  res.status(200).json({
    success: true,
    message: "Authentication successful",
    user,
  });
});

router.get(
  "/admin",
  authenticate,
  authorizeRoles("admin"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  }
);

export default router;
