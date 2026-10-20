
import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { authenticate } from "../middleware/auth.middleware.js";

import {
  createAppointmentController,
  listAppointmentsController,
  getAppointmentByIdController,
  updateAppointmentController,
  cancelAppointmentController,
} from "../controllers/appointment.controller.js";

const router: ExpressRouter = Router();

// All appointment routes require authentication.
router.use(authenticate);

// Create a new appointment.
router.post("/", createAppointmentController);

// Get appointments accessible to the logged-in user.
router.get("/", listAppointmentsController);

// Get one appointment by ID.
router.get("/:id", getAppointmentByIdController);

// Update an appointment.
router.patch("/:id", updateAppointmentController);

// Cancel an appointment.
router.delete("/:id", cancelAppointmentController);

export default router;
