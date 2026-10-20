
import { Router } from "express";
import jwt from "jsonwebtoken"; 
import bcrypt from "bcrypt";
import type { Router as ExpressRouter } from "express";
import UserModel from "../models/User.js";
import { createUserSchema } from "../validators/user.validator.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema  } from "../validators/user.validator.js";

const router: ExpressRouter = Router();

router.post(
  "/login",
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await UserModel.findOne({ email }).select("+passwordHash");
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

       const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash
      );

      if (!passwordMatches) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      const secret = process.env.JWT_SECRET;

        if (!secret) {
        throw new Error("JWT_SECRET is not configured");
      }

      const token = jwt.sign(
        {
          role: user.role,
        },
        secret,
        {
          subject: user._id.toString(),
          expiresIn: "15m",
        }
      );

      res.cookie("clinic_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000,
        });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
    "/",
  validateBody(createUserSchema),
  async (req, res, next) => {
    try {
      const { name, email, password } = createUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
         res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await UserModel.create({
        name,
        email,
        passwordHash,
      });

       res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });

    } catch (error) {
      // Handle duplicate email if two requests race
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
  }
);


router.post("/logout", (_req, res) => {
  res.clearCookie("clinic_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
export default router;
