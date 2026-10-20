
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createPatient,
  listPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from "../controllers/patient.controller.js";

const router: ExpressRouter = Router();

// Every patient endpoint requires authentication.
router.use(authenticate);

router.post("/", createPatient);
router.get("/", listPatients);
router.get("/:id", getPatientById);
router.patch("/:id", updatePatient);
router.delete("/:id", deletePatient);

export default router;
