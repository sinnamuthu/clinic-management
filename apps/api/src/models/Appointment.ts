
import mongoose, { Schema } from "mongoose";

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

const appointmentSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type AppointmentDocument =
  mongoose.InferSchemaType<typeof appointmentSchema>;

appointmentSchema.index({
  doctorId: 1,
  startTime: 1,
});

appointmentSchema.index({
  patientId: 1,
  startTime: -1,
});

const Appointment = mongoose.models.Appointment
  ? mongoose.model<AppointmentDocument>("Appointment")
  : mongoose.model<AppointmentDocument>("Appointment", appointmentSchema);

export default Appointment;
