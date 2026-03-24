import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { getEnv } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { authRouter, usersRouter } from "./routes/auth";
import { adminCampsRouter, publicCampsRouter } from "./routes/camps";
import { adminDoctorsRouter } from "./routes/doctors";
import { adminPatientsRouter } from "./routes/patients";
import { adminRegistrationsRouter, registrationsRouter } from "./routes/registrations";

export const createApp = () => {
  const env = getEnv();
  const app = express();

  const normalizeLoopbackOrigin = (origin: string) =>
    origin.replace("://127.0.0.1", "://localhost").trim();

  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOriginSet = new Set(allowedOrigins.map(normalizeLoopbackOrigin));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOriginSet.has(normalizeLoopbackOrigin(origin))) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true
    })
  );

  app.set("trust proxy", 1);
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: env.NODE_ENV === "production" ? 300 : 1200,
      standardHeaders: "draft-8",
      legacyHeaders: false
    })
  );

  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
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
  app.use("/api/camps", publicCampsRouter);
  app.use("/api/registrations", registrationsRouter);
  app.use("/api/admin/camps", adminCampsRouter);
  app.use("/api/admin/registrations", adminRegistrationsRouter);
  app.use("/api/admin/users", usersRouter);
  app.use("/api/admin/patients", adminPatientsRouter);
  app.use("/api/admin/doctors", adminDoctorsRouter);

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
