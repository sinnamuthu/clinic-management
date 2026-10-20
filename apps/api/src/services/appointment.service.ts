
import { Types, type QueryFilter } from "mongoose";

import AppointmentModel, {
  type AppointmentDocument,
} from "../models/Appointment.js";
import PatientModel from "../models/Patient.js";
import UserModel from "../models/User.js";

import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../validators/appointment.validator.js";

type AuthRole = "admin" | "doctor";

interface AuthUser {
  userId: string;
  role: AuthRole;
}

export class AppointmentServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppointmentServiceError";
  }
}

function assertObjectId(id: string, field: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppointmentServiceError(400, `Invalid ${field}`);
  }
}

function ensureValidTime(startTime: Date, endTime: Date): void {
  if (
    Number.isNaN(startTime.getTime()) ||
    Number.isNaN(endTime.getTime())
  ) {
    throw new AppointmentServiceError(400, "Invalid appointment date");
  }

  if (endTime <= startTime) {
    throw new AppointmentServiceError(
      400,
      "End time must be after start time",
    );
  }
}

async function validateDoctorAndPatient(
  doctorId: string,
  patientId: string,
  authUser: AuthUser,
): Promise<void> {
  assertObjectId(doctorId, "doctor ID");
  assertObjectId(patientId, "patient ID");

  if (
    authUser.role === "doctor" &&
    authUser.userId !== doctorId
  ) {
    throw new AppointmentServiceError(
      403,
      "Doctors can create appointments only for themselves",
    );
  }

  const doctor = await UserModel.findOne({
    _id: new Types.ObjectId(doctorId),
  }).select("_id role");

  if (!doctor || doctor.role !== "doctor") {
    throw new AppointmentServiceError(404, "Doctor not found");
  }

  const patient = await PatientModel.findOne({
    _id: new Types.ObjectId(patientId),
  }).select("_id createdBy");

  if (!patient) {
    throw new AppointmentServiceError(404, "Patient not found");
  }

  if (
    authUser.role === "doctor" &&
    patient.createdBy.toString() !== authUser.userId
  ) {
    throw new AppointmentServiceError(
      403,
      "You can create appointments only for your own patients",
    );
  }
}


async function ensureNoConflict(
  doctorId: string,
  patientId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string,
): Promise<void> {
  const query: QueryFilter<AppointmentDocument> = {
    status: "scheduled",
    $or: [
      {
        doctorId: new Types.ObjectId(doctorId),
      },
      {
        patientId: new Types.ObjectId(patientId),
      },
    ],
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeAppointmentId) {
    query._id = {
      $ne: new Types.ObjectId(excludeAppointmentId),
    };
  }

  const conflict = await AppointmentModel
    .findOne(query)
    .select("_id");

  if (conflict) {
    throw new AppointmentServiceError(
      409,
      "The doctor or patient already has an overlapping appointment",
    );
  }
}


export async function createAppointment(
  input: CreateAppointmentInput,
  authUser: AuthUser,
) {
  assertObjectId(authUser.userId, "user ID");

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  ensureValidTime(startTime, endTime);

  await validateDoctorAndPatient(
    input.doctorId,
    input.patientId,
    authUser,
  );

  await ensureNoConflict(
    input.doctorId,
    input.patientId,
    startTime,
    endTime,
  );

  return AppointmentModel.create({
    patientId: new Types.ObjectId(input.patientId),
    doctorId: new Types.ObjectId(input.doctorId),
    startTime,
    endTime,
    reason: input.reason,
    status: "scheduled",
    createdBy: new Types.ObjectId(authUser.userId),
  });
}

export async function listAppointments(authUser: AuthUser) {
  assertObjectId(authUser.userId, "user ID");

  const filter =
    authUser.role === "doctor"
      ? { doctorId: new Types.ObjectId(authUser.userId) }
      : {};

  return AppointmentModel.find(filter)
    .populate("patientId", "fullName phone")
    .populate("doctorId", "name email")
    .sort({ startTime: 1 });
}

export async function getAppointmentById(
  appointmentId: string,
  authUser: AuthUser,
) {
  assertObjectId(appointmentId, "appointment ID");

  const appointment = await AppointmentModel.findOne({
    _id: new Types.ObjectId(appointmentId),
  })
    .populate("patientId", "fullName phone")
    .populate("doctorId", "name email");

  if (!appointment) {
    throw new AppointmentServiceError(404, "Appointment not found");
  }

  if (
    authUser.role === "doctor" &&
    appointment.doctorId.toString() !== authUser.userId
  ) {
    throw new AppointmentServiceError(403, "Access denied");
  }

  return appointment;
}

export async function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput,
  authUser: AuthUser,
) {
  assertObjectId(appointmentId, "appointment ID");

  const appointment = await AppointmentModel.findOne({
    _id: new Types.ObjectId(appointmentId),
  });

  if (!appointment) {
    throw new AppointmentServiceError(404, "Appointment not found");
  }

  if (
    authUser.role === "doctor" &&
    appointment.doctorId.toString() !== authUser.userId
  ) {
    throw new AppointmentServiceError(403, "Access denied");
  }

  const doctorId =
    input.doctorId ?? appointment.doctorId.toString();

  const patientId =
    input.patientId ?? appointment.patientId.toString();

  const startTime = input.startTime
    ? new Date(input.startTime)
    : appointment.startTime;

  const endTime = input.endTime
    ? new Date(input.endTime)
    : appointment.endTime;

  ensureValidTime(startTime, endTime);

  if (input.doctorId || input.patientId) {
    await validateDoctorAndPatient(
      doctorId,
      patientId,
      authUser,
    );
  }

  const willBeScheduled =
    input.status === "scheduled" ||
    (input.status === undefined &&
      appointment.status === "scheduled");

  if (willBeScheduled) {
    await ensureNoConflict(
      doctorId,
      patientId,
      startTime,
      endTime,
      appointmentId,
    );
  }

  if (input.doctorId) {
    appointment.doctorId = new Types.ObjectId(input.doctorId);
  }

  if (input.patientId) {
    appointment.patientId = new Types.ObjectId(input.patientId);
  }

  if (input.startTime) {
    appointment.startTime = startTime;
  }

  if (input.endTime) {
    appointment.endTime = endTime;
  }

  if (input.reason !== undefined) {
    appointment.reason = input.reason;
  }

  if (input.status) {
    appointment.status = input.status;
  }

  await appointment.save();

  return appointment;
}

export async function cancelAppointment(
  appointmentId: string,
  authUser: AuthUser,
) {
  assertObjectId(appointmentId, "appointment ID");

  const appointment = await AppointmentModel.findOne({
    _id: new Types.ObjectId(appointmentId),
  });

  if (!appointment) {
    throw new AppointmentServiceError(404, "Appointment not found");
  }

  if (
    authUser.role === "doctor" &&
    appointment.doctorId.toString() !== authUser.userId
  ) {
    throw new AppointmentServiceError(403, "Access denied");
  }

  if (appointment.status === "cancelled") {
    throw new AppointmentServiceError(
      400,
      "Appointment is already cancelled",
    );
  }

  if (appointment.status === "completed") {
    throw new AppointmentServiceError(
      400,
      "Completed appointments cannot be cancelled",
    );
  }

  appointment.status = "cancelled";

  await appointment.save();

  return appointment;
}
