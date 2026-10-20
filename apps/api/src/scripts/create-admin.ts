import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import UserModel from "../models/User.js";

async function createAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Please set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env",
    );
  }

  if (password.length < 12) {
    throw new Error("Admin password must be at least 12 characters.");
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  await mongoose.connect(mongoUri);

  const existing = await UserModel.findOne({ email });

  if (existing) {
    if (existing.role === "admin") {
      console.log("An Admin account with this email already exists.");
      return;
    }

    throw new Error(
      "This email already belongs to a non-admin account. Use a different email.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await UserModel.create({
    name,
    email,
    passwordHash,
    role: "admin",
  });

  console.log("Admin account created successfully.");
  console.log(`Admin email: ${email}`);
}

createAdmin()
  .catch((error: unknown) => {
    console.error("Unable to create Admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
