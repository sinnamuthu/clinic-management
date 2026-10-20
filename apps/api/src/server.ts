import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();



app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
}));

app.use(express.json());

app.use(express.json());
app.use(cookieParser());


app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Clinic Management API is running",
    timestamp: new Date().toISOString()
 });
});



app.use("/api/users", userRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);



async function startServer() {
  try {
    await connectDB();

    const PORT = Number(process.env.PORT ?? 4000);
    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
    } catch (error) {   
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}


void startServer();