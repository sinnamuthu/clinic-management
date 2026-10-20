import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import UserModel from "../models/User.js";

async function resetAdminPassword(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const newPassword = process.env.ADMIN_PASSWORD;
  const mongoUri = process.env.MONGODB_URI;

  // Validate required environment variables.
  if (!email || !newPassword || !mongoUri) {
    throw new Error(
      "ADMIN_EMAIL, ADMIN_PASSWORD and MONGODB_URI must be set in apps/api/.env",
    );
  }

  if (newPassword.length < 12) {
    throw new Error("New password must be at least 12 characters long.");
  }

  await mongoose.connect(mongoUri);

  try {
    // Find the existing Admin account.
    const admin = await UserModel.findOne({
      email,
      role: "admin",
    });

    if (!admin) {
      throw new Error(
        `No Admin account found for ${email}. Check ADMIN_EMAIL in .env.`,
      );
    }

    // Hash the new password before saving it.
    const passwordHash = await bcrypt.hash(newPassword, 12);

    admin.passwordHash = passwordHash;
    await admin.save();

    console.log("Admin password changed successfully.");
    console.log(`Admin email: ${email}`);
    console.log("You can now log in with your new password.");
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword().catch((error: unknown) => {
  console.error(
    "Unable to reset Admin password:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});