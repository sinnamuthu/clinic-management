
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

import {
  createDoctor,
  listDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from "../controllers/admin.controller.js";

const router: ExpressRouter = Router();

// Every endpoint requires an authenticated Admin.
router.use(authenticate, authorizeRoles("admin"));

router.post("/doctors", createDoctor);
router.get("/doctors", listDoctors);
router.get("/doctors/:id", getDoctorById);
router.patch("/doctors/:id", updateDoctor);
router.delete("/doctors/:id", deleteDoctor);

export default router;
