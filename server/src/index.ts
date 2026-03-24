import { getEnv } from "./config/env";
import { prisma } from "./config/prisma";
import { createApp } from "./app";

const env = getEnv();
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
