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
process.env.DEFAULT_USER_FULL_NAME = "System Admin";
process.env.DEFAULT_USER_EMAIL = "admin@hms.local";
process.env.DEFAULT_USER_PASSWORD = "admin12345";
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

describe("HMS API integration", () => {
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

  it("protects modules for anonymous users", async () => {
    const response = await request(app).get("/api/patients");
    expect(response.status).toBe(401);
  });

  it("supports full patient-doctor-appointment-billing flow", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: process.env.DEFAULT_USER_EMAIL,
      password: process.env.DEFAULT_USER_PASSWORD
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.authenticated).toBe(true);

    const createPatientResponse = await agent.post("/api/patients").send({
      fullName: "Mariam Tarek",
      dateOfBirth: "1995-07-17",
      gender: "Female",
      phone: "+20 100 555 6677",
      address: "Maadi, Cairo",
      medicalHistory: "Seasonal allergies"
    });

    expect(createPatientResponse.status).toBe(201);
    const patientId = createPatientResponse.body.patient.id as number;

    const createDoctorResponse = await agent.post("/api/doctors").send({
      fullName: "Dr. Hany Nabil",
      email: "hany.nabil@hms.local",
      phone: "+20 110 999 8877",
      specialization: "Dermatology",
      schedule: "Mon-Wed 09:00-14:00"
    });

    expect(createDoctorResponse.status).toBe(201);
    const doctorId = createDoctorResponse.body.doctor.id as number;

    const bookAppointmentResponse = await agent.post("/api/appointments").send({
      patientId,
      doctorId,
      scheduledAt: "2026-09-10T10:00:00.000Z",
      reason: "Skin rash check"
    });

    expect(bookAppointmentResponse.status).toBe(201);
    const appointmentId = bookAppointmentResponse.body.appointment.id as number;

    const rescheduleResponse = await agent
      .patch(`/api/appointments/${appointmentId}/reschedule`)
      .send({
        scheduledAt: "2026-09-11T11:00:00.000Z",
        reason: "Patient requested different day"
      });

    expect(rescheduleResponse.status).toBe(200);
    expect(rescheduleResponse.body.appointment.status).toBe("RESCHEDULED");

    const cancelResponse = await agent
      .patch(`/api/appointments/${appointmentId}/cancel`)
      .send({
        reason: "Patient no longer available"
      });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.appointment.status).toBe("CANCELLED");

    const calculateResponse = await agent.post("/api/billing/calculate").send({
      items: [
        { description: "Consultation", quantity: 1, unitPrice: 400 },
        { description: "Medication", quantity: 2, unitPrice: 90 }
      ]
    });

    expect(calculateResponse.status).toBe(200);
    expect(calculateResponse.body.totalCost).toBe(580);

    const invoiceResponse = await agent.post("/api/billing/invoices").send({
      patientId,
      appointmentId,
      items: [
        { description: "Consultation", quantity: 1, unitPrice: 400 },
        { description: "Medication", quantity: 2, unitPrice: 90 }
      ]
    });

    expect(invoiceResponse.status).toBe(201);
    const invoiceId = invoiceResponse.body.invoice.id as number;

    const payResponse = await agent
      .post(`/api/billing/invoices/${invoiceId}/pay`)
      .send({ paymentMethod: "Cash" });

    expect(payResponse.status).toBe(200);
    expect(payResponse.body.invoice.status).toBe("PAID");

    const historyResponse = await agent.get(`/api/billing/history?patientId=${patientId}`);

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.invoices.length).toBeGreaterThan(0);

    const patientHistoryResponse = await agent.get(`/api/patients/${patientId}/history`);

    expect(patientHistoryResponse.status).toBe(200);
    expect(patientHistoryResponse.body.patient.id).toBe(patientId);
    expect(Array.isArray(patientHistoryResponse.body.appointments)).toBe(true);
    expect(Array.isArray(patientHistoryResponse.body.invoices)).toBe(true);

    const deleteResponse = await agent.delete(`/api/patients/${patientId}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.patient.isDeleted).toBe(true);

    const listActivePatients = await agent.get("/api/patients");
    expect(listActivePatients.status).toBe(200);
    expect(
      listActivePatients.body.patients.some((patient: { id: number }) => patient.id === patientId)
    ).toBe(false);

    const listAllPatients = await agent.get("/api/patients?includeDeleted=true");
    expect(listAllPatients.status).toBe(200);
    expect(
      listAllPatients.body.patients.some((patient: { id: number }) => patient.id === patientId)
    ).toBe(true);

    const logoutResponse = await agent.post("/api/auth/logout");
    expect(logoutResponse.status).toBe(200);

    const afterLogoutResponse = await agent.get("/api/patients");
    expect(afterLogoutResponse.status).toBe(401);
  });
});
