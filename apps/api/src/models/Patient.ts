
import { model, Schema, Types, type InferSchemaType } from "mongoose";

const patientSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 130,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export type Patient = InferSchemaType<typeof patientSchema>;
export type PatientCreatorId = Types.ObjectId;

const PatientModel = model("Patient", patientSchema);

export default PatientModel;
