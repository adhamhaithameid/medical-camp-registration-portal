import { getEnv } from "./config/env";
import { prisma } from "./config/prisma";
import { createApp } from "./app";

const env = getEnv();
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${env.PORT} is already in use. Stop the running server process and start again.`
    );
    process.exit(1);
  }

  console.error("Server failed to start", error);
  process.exit(1);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
