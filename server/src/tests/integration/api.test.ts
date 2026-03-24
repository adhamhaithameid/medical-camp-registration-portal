import { execSync } from "node:child_process";
import path from "node:path";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const projectRoot = path.resolve(__dirname, "../../../..");
const serverRoot = path.resolve(projectRoot, "server");

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./test-integration.db";
process.env.JWT_SECRET = "integration-secret-123";
process.env.JWT_EXPIRES_IN = "8h";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "admin12345";
process.env.CORS_ORIGIN = "http://localhost:5173";

const initializeDatabase = () => {
  execSync(
    "PRISMA_SCHEMA_ENGINE_LOG_LEVEL=trace RUST_LOG=debug npx prisma db push --force-reset --skip-generate",
    {
    cwd: serverRoot,
    stdio: "ignore",
    env: process.env
    }
  );
};

describe("API integration", () => {
  let app: ReturnType<typeof import("../../app").createApp>;

  beforeAll(async () => {
    initializeDatabase();

    const [{ seedDatabase }, { createApp }] = await Promise.all([
      import("../../scripts/seed"),
      import("../../app")
    ]);

    await seedDatabase();
    app = createApp();
  });

  afterAll(async () => {
    const { prisma } = await import("../../config/prisma");
    await prisma.$disconnect();
  });

  it("returns health status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("lists and fetches camp details", async () => {
    const campsResponse = await request(app).get("/api/camps");
    expect(campsResponse.status).toBe(200);
    expect(campsResponse.body.camps.length).toBeGreaterThan(0);

    const campId = campsResponse.body.camps[0].id;
    const detailsResponse = await request(app).get(`/api/camps/${campId}`);

    expect(detailsResponse.status).toBe(200);
    expect(detailsResponse.body.camp.id).toBe(campId);
  });

  it("creates a registration", async () => {
    const campsResponse = await request(app).get("/api/camps");
    const campId = campsResponse.body.camps[0].id;

    const registrationResponse = await request(app).post("/api/registrations").send({
      fullName: "Nour Hassan",
      age: 33,
      contactNumber: "+20 101 234 7890",
      campId
    });

    expect(registrationResponse.status).toBe(201);
    expect(registrationResponse.body.registration.fullName).toBe("Nour Hassan");
  });

  it("rejects invalid registration payload", async () => {
    const response = await request(app).post("/api/registrations").send({
      fullName: "",
      age: 0,
      contactNumber: "abc",
      campId: -1
    });

    expect(response.status).toBe(400);
  });

  it("protects admin registrations endpoint and allows access after login", async () => {
    const anonymousResponse = await request(app).get("/api/admin/registrations");
    expect(anonymousResponse.status).toBe(401);

    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.authenticated).toBe(true);

    const protectedResponse = await agent.get("/api/admin/registrations");
    expect(protectedResponse.status).toBe(200);
    expect(Array.isArray(protectedResponse.body.registrations)).toBe(true);

    const logoutResponse = await agent.post("/api/auth/logout");
    expect(logoutResponse.status).toBe(200);

    const afterLogoutResponse = await agent.get("/api/admin/registrations");
    expect(afterLogoutResponse.status).toBe(401);
  });
});
