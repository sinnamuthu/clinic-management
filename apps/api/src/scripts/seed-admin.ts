import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import UserModel from "../models/User.js";

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!mongoUri || !name || !email || !password) {
    throw new Error(
      "MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required."
    );
  }

  if (password.length < 12) {
    throw new Error("Admin password must contain at least 12 characters.");
  }

  await mongoose.connect(mongoUri);

  // Prevent creating another initial admin.
  const existingAdmin = await UserModel.findOne({ role: "admin" });

  if (existingAdmin) {
    console.log("An admin already exists. No changes made.");
    return;
  }

  // Prevent email conflicts with existing doctor accounts.
  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    throw new Error(
      "This email is already registered. Choose a different admin email."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await UserModel.create({
    name,
    email,
    passwordHash,
    role: "admin",
  });

  console.log("Initial admin account created successfully.");
}

main()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Admin seed failed:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });