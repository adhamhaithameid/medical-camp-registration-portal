import { Router } from "express";
import type { DoctorResponse, DoctorsResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth";
import { mapDoctor } from "../utils/mappers";
import {
  doctorInputSchema,
  scheduleSchema,
  specializationSchema
} from "../validation/doctor";

const doctorsRouter = Router();

doctorsRouter.use(requireAuth);

const parseEntityId = (rawId: string) => {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

doctorsRouter.get("/", async (_request, response) => {
  const doctors = await prisma.doctor.findMany({
    orderBy: { fullName: "asc" }
  });

  const payload: DoctorsResponse = { doctors: doctors.map(mapDoctor) };
  return response.status(200).json(payload);
});

doctorsRouter.post("/", async (request, response) => {
  const parsed = doctorInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.doctor.findUnique({
    where: { email: parsed.data.email }
  });

  if (existing) {
    return response.status(409).json({ message: "A doctor with this email already exists" });
  }

  const doctor = await prisma.doctor.create({
    data: parsed.data
  });

  const payload: DoctorResponse = { doctor: mapDoctor(doctor) };
  return response.status(201).json(payload);
});

doctorsRouter.get("/:id", async (request, response) => {
  const doctorId = parseEntityId(request.params.id);

  if (!doctorId) {
    return response.status(400).json({ message: "Doctor id must be a positive integer" });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    return response.status(404).json({ message: "Doctor not found" });
  }

  const payload: DoctorResponse = { doctor: mapDoctor(doctor) };
  return response.status(200).json(payload);
});

doctorsRouter.patch("/:id/specialization", async (request, response) => {
  const doctorId = parseEntityId(request.params.id);

  if (!doctorId) {
    return response.status(400).json({ message: "Doctor id must be a positive integer" });
  }

  const parsed = specializationSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    return response.status(404).json({ message: "Doctor not found" });
  }

  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      specialization: parsed.data.specialization
    }
  });

  const payload: DoctorResponse = { doctor: mapDoctor(updated) };
  return response.status(200).json(payload);
});

doctorsRouter.patch("/:id/schedule", async (request, response) => {
  const doctorId = parseEntityId(request.params.id);

  if (!doctorId) {
    return response.status(400).json({ message: "Doctor id must be a positive integer" });
  }

  const parsed = scheduleSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    return response.status(404).json({ message: "Doctor not found" });
  }

  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      schedule: parsed.data.schedule
    }
  });

  const payload: DoctorResponse = { doctor: mapDoctor(updated) };
  return response.status(200).json(payload);
});

doctorsRouter.get("/:id/schedule", async (request, response) => {
  const doctorId = parseEntityId(request.params.id);

  if (!doctorId) {
    return response.status(400).json({ message: "Doctor id must be a positive integer" });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    return response.status(404).json({ message: "Doctor not found" });
  }

  const payload: DoctorResponse = { doctor: mapDoctor(doctor) };
  return response.status(200).json(payload);
});

export { doctorsRouter };
