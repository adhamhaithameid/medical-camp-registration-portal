import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { getEnv } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { appointmentsRouter } from "./routes/appointments";
import { authRouter } from "./routes/auth";
import { billingRouter } from "./routes/billing";
import { doctorsRouter } from "./routes/doctors";
import { patientsRouter } from "./routes/patients";

export const createApp = () => {
  const env = getEnv();
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_request, response) => {
    return response.status(200).json({
      status: "ok",
      service: "hospital-management-system",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/patients", patientsRouter);
  app.use("/api/doctors", doctorsRouter);
  app.use("/api/appointments", appointmentsRouter);
  app.use("/api/billing", billingRouter);

  if (env.NODE_ENV === "production") {
    const clientDistPath = path.resolve(__dirname, "../../client/dist");
    app.use(express.static(clientDistPath));

    app.get(/^\/(?!api).*/, (_request, response) => {
      return response.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
};
