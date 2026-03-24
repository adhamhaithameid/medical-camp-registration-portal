import { Router } from "express";
import type { PatientResponse, PatientsResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { requireAuth, requireRoles } from "../middleware/auth";
import { recordAudit } from "../services/audit";
import { sendError, sendValidationError } from "../utils/http";
import { mapPatient } from "../utils/mappers";
import { patientInputSchema, patientUpdateSchema } from "../validation/patient";

const parseId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const adminPatientsRouter = Router();

adminPatientsRouter.use(requireAuth, requireRoles("SUPER_ADMIN", "STAFF"));

adminPatientsRouter.get("/", async (request, response) => {
  const search = String(request.query.search ?? "").trim();

  const patients = await prisma.patient.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search } },
            { contactNumber: { contains: search } },
            { email: { contains: search } }
          ]
        }
      : undefined,
    orderBy: [{ fullName: "asc" }, { id: "asc" }]
  });

  const payload: PatientsResponse = {
    patients: patients.map(mapPatient)
  };

  return response.status(200).json(payload);
});

adminPatientsRouter.get("/:id", async (request, response) => {
  const patientId = parseId(request.params.id);

  if (!patientId) {
    return sendError(request, response, 400, "Patient id must be a positive integer");
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!patient) {
    return sendError(request, response, 404, "Patient not found");
  }

  const payload: PatientResponse = {
    patient: mapPatient(patient)
  };

  return response.status(200).json(payload);
});

adminPatientsRouter.post("/", async (request, response) => {
  const parsed = patientInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return sendValidationError(request, response, parsed.error);
  }

  const patient = await prisma.patient.create({
    data: {
      fullName: parsed.data.fullName,
      dateOfBirth: new Date(parsed.data.dateOfBirth),
      gender: parsed.data.gender,
      contactNumber: parsed.data.contactNumber,
      email: parsed.data.email,
      address: parsed.data.address,
      medicalHistory: parsed.data.medicalHistory
    }
  });

  await recordAudit({
    request,
    action: "PATIENT_CREATE",
    entityType: "Patient",
    entityId: String(patient.id),
    details: {
      fullName: patient.fullName,
      contactNumber: patient.contactNumber
    }
  });

  const payload: PatientResponse = {
    patient: mapPatient(patient)
  };

  return response.status(201).json(payload);
});

adminPatientsRouter.patch("/:id", async (request, response) => {
  const patientId = parseId(request.params.id);

  if (!patientId) {
    return sendError(request, response, 400, "Patient id must be a positive integer");
  }

  const parsed = patientUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return sendValidationError(request, response, parsed.error);
  }

  const existing = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!existing) {
    return sendError(request, response, 404, "Patient not found");
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      ...(parsed.data.fullName ? { fullName: parsed.data.fullName } : {}),
      ...(parsed.data.dateOfBirth ? { dateOfBirth: new Date(parsed.data.dateOfBirth) } : {}),
      ...(parsed.data.gender ? { gender: parsed.data.gender } : {}),
      ...(parsed.data.contactNumber ? { contactNumber: parsed.data.contactNumber } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
      ...(parsed.data.address ? { address: parsed.data.address } : {}),
      ...(parsed.data.medicalHistory !== undefined
        ? { medicalHistory: parsed.data.medicalHistory }
        : {})
    }
  });

  await recordAudit({
    request,
    action: "PATIENT_UPDATE",
    entityType: "Patient",
    entityId: String(patient.id),
    details: parsed.data
  });

  const payload: PatientResponse = {
    patient: mapPatient(patient)
  };

  return response.status(200).json(payload);
});

adminPatientsRouter.delete("/:id", async (request, response) => {
  const patientId = parseId(request.params.id);

  if (!patientId) {
    return sendError(request, response, 400, "Patient id must be a positive integer");
  }

  const existing = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!existing) {
    return sendError(request, response, 404, "Patient not found");
  }

  const deleted = await prisma.patient.delete({
    where: { id: patientId }
  });

  await recordAudit({
    request,
    action: "PATIENT_DELETE",
    entityType: "Patient",
    entityId: String(deleted.id),
    details: {
      fullName: deleted.fullName
    }
  });

  return response.status(200).json({
    patient: mapPatient(deleted)
  });
});

export { adminPatientsRouter };
