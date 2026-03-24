import { execSync } from "node:child_process";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const projectRoot = path.resolve(__dirname, "../../../..");
const serverRoot = path.resolve(projectRoot, "server");

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./test-integration.db";
process.env.JWT_SECRET = "integration-secret-123";
process.env.JWT_EXPIRES_IN = "8h";
process.env.DEFAULT_SUPER_ADMIN_USERNAME = "admin";
process.env.DEFAULT_SUPER_ADMIN_PASSWORD = "admin12345";
process.env.DEFAULT_STAFF_USERNAME = "staff";
process.env.DEFAULT_STAFF_PASSWORD = "staff12345";
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

describe("Medical Camp API integration", () => {
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

  it("blocks protected admin endpoint for anonymous users", async () => {
    const response = await request(app).get("/api/admin/registrations");
    expect(response.status).toBe(401);
  });

  it("supports public registration flow with duplicate protection and waitlist", async () => {
    const campsResponse = await request(app).get("/api/camps");
    expect(campsResponse.status).toBe(200);
    expect(campsResponse.body.camps.length).toBeGreaterThan(0);

    const firstCamp = campsResponse.body.camps[0] as {
      id: number;
      capacity: number;
    };

    const registrationResponse = await request(app).post("/api/registrations").send({
      fullName: "Mariam Tarek",
      age: 26,
      contactNumber: "+20 100 555 6677",
      email: "mariam@example.com",
      campId: firstCamp.id
    });

    expect(registrationResponse.status).toBe(201);
    const confirmationCode = registrationResponse.body.registration.confirmationCode as string;

    const duplicateResponse = await request(app).post("/api/registrations").send({
      fullName: "Mariam Tarek",
      age: 26,
      contactNumber: "+20 100 555 6677",
      email: "mariam2@example.com",
      campId: firstCamp.id
    });

    expect(duplicateResponse.status).toBe(409);

    const lookupResponse = await request(app).post("/api/registrations/lookup").send({
      confirmationCode
    });

    expect(lookupResponse.status).toBe(200);
    expect(lookupResponse.body.registration.fullName).toBe("Mariam Tarek");

    const updateResponse = await request(app)
      .patch(`/api/registrations/${confirmationCode}`)
      .send({
        fullName: "Mariam Tarek Updated",
        age: 27,
        contactNumber: "+20 100 777 8899"
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.registration.fullName).toBe("Mariam Tarek Updated");

    const cancelResponse = await request(app).delete(`/api/registrations/${confirmationCode}`);
    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.registration.status).toBe("CANCELLED");
  });

  it("supports admin auth, filtering, csv export, and waitlist promotion", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      username: process.env.DEFAULT_SUPER_ADMIN_USERNAME,
      password: process.env.DEFAULT_SUPER_ADMIN_PASSWORD
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.authenticated).toBe(true);
    expect(loginResponse.body.role).toBe("SUPER_ADMIN");

    const campsResponse = await agent.get("/api/admin/camps");
    expect(campsResponse.status).toBe(200);
    const firstCampId = campsResponse.body.camps[0].id as number;

    const waitlisted = await agent.post("/api/registrations").send({
      fullName: "Waitlist Candidate",
      age: 30,
      contactNumber: "+20 109 999 8888",
      campId: firstCampId
    });

    expect(waitlisted.status).toBe(201);
    expect(["WAITLISTED", "CONFIRMED"]).toContain(waitlisted.body.registration.status);

    const listResponse = await agent.get(
      "/api/admin/registrations?search=Waitlist&page=1&pageSize=10"
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.meta.page).toBe(1);
    expect(Array.isArray(listResponse.body.registrations)).toBe(true);

    const csvResponse = await agent.get("/api/admin/registrations/export.csv");
    expect(csvResponse.status).toBe(200);
    expect(csvResponse.headers["content-type"]).toContain("text/csv");

    const createCamp = await agent.post("/api/admin/camps").send({
      name: "Promotion Flow Camp",
      date: "2026-08-10T09:00:00.000Z",
      location: "Cairo East",
      description: "Camp used in integration tests for waitlist promotion",
      capacity: 1,
      isActive: true
    });
    expect(createCamp.status).toBe(201);
    const promotionCampId = createCamp.body.camp.id as number;

    const confirmedRegistration = await agent.post("/api/registrations").send({
      fullName: "Seat Holder",
      age: 40,
      contactNumber: "+20 101 700 7000",
      campId: promotionCampId
    });
    expect(confirmedRegistration.status).toBe(201);
    expect(confirmedRegistration.body.registration.status).toBe("CONFIRMED");

    const waitlistedRegistration = await agent.post("/api/registrations").send({
      fullName: "Promotion Target",
      age: 29,
      contactNumber: "+20 101 909 8080",
      campId: promotionCampId
    });
    expect(waitlistedRegistration.status).toBe(201);
    expect(waitlistedRegistration.body.registration.status).toBe("WAITLISTED");

    const targetId = waitlistedRegistration.body.registration.id as number;

    const expandCamp = await agent.patch(`/api/admin/camps/${promotionCampId}`).send({
      capacity: 2
    });
    expect(expandCamp.status).toBe(200);

    const promoteResponse = await agent.patch(`/api/admin/registrations/${targetId}/promote`);
    expect(promoteResponse.status).toBe(200);
    expect(promoteResponse.body.registration.status).toBe("CONFIRMED");

    const logoutResponse = await agent.post("/api/auth/logout");
    expect(logoutResponse.status).toBe(200);
  });
});
