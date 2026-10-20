
import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import PatientModel from "../models/Patient.js";
import {
  createPatientSchema,
  updatePatientSchema,
} from "../validators/patient.validator.js";
import type { AuthenticatedUser } from "../middleware/auth.middleware.js";

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

type PatientFilter = {
  _id?: string | Types.ObjectId;
  createdBy?: Types.ObjectId;
  gender?: "male" | "female" | "other";
  $or?: Array<{
    fullName?: { $regex: string; $options: string };
    phone?: { $regex: string; $options: string };
  }>;
};

function getAuthUser(
  res: Parameters<RequestHandler>[1],
): AuthenticatedUser {
  return res.locals.authUser as AuthenticatedUser;
}

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && Types.ObjectId.isValid(id);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// CREATE: Add a patient
export const createPatient: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const parsed = createPatientSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
      return;
    }

    const { fullName, age, gender, phone, notes } = parsed.data;
    const user = getAuthUser(res);

    const patient = await PatientModel.create({
      fullName,
      age,
      gender,
      phone,
      notes,
      createdBy: new Types.ObjectId(user.id),
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// READ: List, search, gender filter and pagination
export const listPatients: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parsed.error.issues,
      });
      return;
    }

    const { search, gender, page, limit } = parsed.data;
    const user = getAuthUser(res);

    const filter: PatientFilter = {};

    // Doctors can only see their own patients.
    // Admins can see all patients.
    if (user.role === "doctor") {
      filter.createdBy = new Types.ObjectId(user.id);
    }

    if (gender) {
      filter.gender = gender;
    }

    if (search) {
      const escapedSearch = escapeRegex(search);

      filter.$or = [
        {
          fullName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      PatientModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .lean(),

      PatientModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// READ: Get one patient by ID
export const getPatientById: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
      return;
    }

    const user = getAuthUser(res);

    const filter: PatientFilter = { _id: id };

    if (user.role === "doctor") {
      filter.createdBy = new Types.ObjectId(user.id);
    }

    const patient = await PatientModel.findOne(filter)
      .populate("createdBy", "name email")
      .lean();

    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE: Edit patient details
export const updatePatient: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
      return;
    }

    const parsed = updatePatientSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
      return;
    }

    const user = getAuthUser(res);

    const filter: PatientFilter = { _id: id };

    if (user.role === "doctor") {
      filter.createdBy = new Types.ObjectId(user.id);
    }

    const patient = await PatientModel.findOneAndUpdate(
      filter,
      { $set: parsed.data },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Remove a patient
export const deletePatient: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
      return;
    }

    const user = getAuthUser(res);

    const filter: PatientFilter = { _id: id };

    if (user.role === "doctor") {
      filter.createdBy = new Types.ObjectId(user.id);
    }

    const patient = await PatientModel.findOneAndDelete(filter);

    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
