import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { getEnv } from "./config/env";
import { authRouter } from "./routes/auth";
import { campsRouter } from "./routes/camps";
import { registrationsRouter } from "./routes/registrations";
import { adminRouter } from "./routes/admin";
import { errorHandler } from "./middleware/error-handler";

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
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/camps", campsRouter);
  app.use("/api/registrations", registrationsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);

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
