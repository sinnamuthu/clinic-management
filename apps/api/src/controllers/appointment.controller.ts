
import type { Request, Response, NextFunction } from "express";

import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../validators/appointment.validator.js";

import {
  createAppointment,
  listAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  AppointmentServiceError,
} from "../services/appointment.service.js";

interface AuthUser {
  userId: string;
  role: "admin" | "doctor";
}

function getAuthUser(res: Response): AuthUser {
  const authUser = res.locals.authUser as
    | AuthUser
    | undefined;

  if (
    !authUser ||
    !authUser.userId ||
    !["admin", "doctor"].includes(authUser.role)
  ) {
    throw new AppointmentServiceError(
      401,
      "Authentication required",
    );
  }

  return authUser;
}

function handleError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof AppointmentServiceError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  next(error);
}

export async function createAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createAppointmentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const appointment = await createAppointment(
      parsed.data,
      getAuthUser(res),
    );

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error: unknown) {
    handleError(error, res, next);
  }
}

export async function listAppointmentsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const appointments = await listAppointments(
      getAuthUser(res),
    );

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error: unknown) {
    handleError(error, res, next);
  }
}

export async function getAppointmentByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
        const appointmentId = req.params.id;

        if (typeof appointmentId !== "string") {
        res.status(400).json({
            success: false,
            message: "Invalid appointment ID",
        });
        return;
        }

        const appointment = await getAppointmentById(
        appointmentId,
        getAuthUser(res),
        );

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error: unknown) {
    handleError(error, res, next);
  }
}

export async function updateAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateAppointmentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
      return;
    }

    
const appointmentId = req.params.id;

if (typeof appointmentId !== "string") {
  res.status(400).json({
    success: false,
    message: "Invalid appointment ID",
  });
  return;
}

const appointment = await updateAppointment(
  appointmentId,
  parsed.data,
  getAuthUser(res),
);
    

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error: unknown) {
    handleError(error, res, next);
  }
}

export async function cancelAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
            const appointmentId = req.params.id;

        if (typeof appointmentId !== "string") {
        res.status(400).json({
            success: false,
            message: "Invalid appointment ID",
        });
        return;
        }

        const appointment = await cancelAppointment(
        appointmentId,
        getAuthUser(res),
        );

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error: unknown) {
    handleError(error, res, next);
  }
}
