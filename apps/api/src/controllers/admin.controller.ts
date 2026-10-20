import { z } from "zod";
import type { RequestHandler } from "express";
import { Types } from "mongoose";
import bcrypt from "bcrypt";

import UserModel from "../models/User.js";
import PatientModel from "../models/Patient.js";
import {
  createDoctorSchema,
  updateDoctorSchema,
} from "../validators/admin.validator.js";

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// CREATE DOCTOR
export const createDoctor: RequestHandler = async (req, res, next) => {
  try {
    const input = createDoctorSchema.parse(req.body);

    const existing = await UserModel.findOne({ email: input.email });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const doctor = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "doctor",
    });

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        createdAt: doctor.createdAt,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    next(error);
  }
};

// LIST DOCTORS WITH SEARCH AND PAGINATION
export const listDoctors: RequestHandler = async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
      });
      return;
    }

    const { search, page, limit } = parsed.data;

    const filter: Record<string, unknown> = { role: "doctor" };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [doctors, total] = await Promise.all([
      UserModel.find(filter)
        .select("name email role createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: doctors,
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

// GET ONE DOCTOR
export const getDoctorById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
      return;
    }

    const doctor = await UserModel.findOne({
      _id: id,
      role: "doctor",
    }).select("name email role createdAt updatedAt");

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
      return;
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

// UPDATE DOCTOR
export const updateDoctor: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
      return;
    }

    const parsed = updateDoctorSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
      return;
    }

    const doctor = await UserModel.findOneAndUpdate(
      { _id: id, role: "doctor" },
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).select("name email role createdAt updatedAt");

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    next(error);
  }
};

// DELETE DOCTOR
export const deleteDoctor: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
      return;
    }

    const doctor = await UserModel.findOne({
      _id: id,
      role: "doctor",
    }).select("_id");

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
      return;
    }

    const patientCount = await PatientModel.countDocuments({
      createdBy: doctor._id,
    });

    if (patientCount > 0) {
      res.status(409).json({
        success: false,
        message: "This doctor has patient records. Reassign or archive the account before deletion.",
      });
      return;
    }

    await UserModel.deleteOne({ _id: doctor._id });

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
