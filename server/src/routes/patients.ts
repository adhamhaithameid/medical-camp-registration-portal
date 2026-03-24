import { Router } from "express";
import type {
  PatientHistoryResponse,
  PatientResponse,
  PatientsResponse
} from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth";
import { mapAppointment, mapInvoice, mapPatient } from "../utils/mappers";
import { patientInputSchema, patientUpdateSchema } from "../validation/patient";

const patientsRouter = Router();

patientsRouter.use(requireAuth);

const parseEntityId = (rawId: string) => {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

patientsRouter.get("/", async (request, response) => {
  const includeDeleted = request.query.includeDeleted === "true";

  const patients = await prisma.patient.findMany({
    where: includeDeleted ? {} : { isDeleted: false },
    orderBy: { createdAt: "desc" }
  });

  const payload: PatientsResponse = {
    patients: patients.map(mapPatient)
  };

  return response.status(200).json(payload);
});

patientsRouter.post("/", async (request, response) => {
  const parsed = patientInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const patient = await prisma.patient.create({
    data: {
      fullName: parsed.data.fullName,
      dateOfBirth: new Date(parsed.data.dateOfBirth),
      gender: parsed.data.gender,
      phone: parsed.data.phone,
      address: parsed.data.address,
      medicalHistory: parsed.data.medicalHistory
    }
  });

  const payload: PatientResponse = { patient: mapPatient(patient) };
  return response.status(201).json(payload);
});

patientsRouter.put("/:id", async (request, response) => {
  const patientId = parseEntityId(request.params.id);

  if (!patientId) {
    return response.status(400).json({ message: "Patient id must be a positive integer" });
  }

  const parsed = patientUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Patient not found" });
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      ...(parsed.data.fullName ? { fullName: parsed.data.fullName } : {}),
      ...(parsed.data.dateOfBirth
        ? { dateOfBirth: new Date(parsed.data.dateOfBirth) }
        : {}),
      ...(parsed.data.gender ? { gender: parsed.data.gender } : {}),
      ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.address ? { address: parsed.data.address } : {}),
      ...(parsed.data.medicalHistory !== undefined
        ? { medicalHistory: parsed.data.medicalHistory }
        : {})
    }
  });

  const payload: PatientResponse = { patient: mapPatient(patient) };
  return response.status(200).json(payload);
});

patientsRouter.get("/:id/history", async (request, response) => {
  const patientId = parseEntityId(request.params.id);

  if (!patientId) {
    return response.status(400).json({ message: "Patient id must be a positive integer" });
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      appointments: {
        include: {
          doctor: {
            select: {
              fullName: true,
              specialization: true
            }
          },
          patient: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: { scheduledAt: "desc" }
      },
      invoices: {
        include: {
          items: true,
          patient: {
            select: {
              fullName: true
            }
          },
          appointment: {
            select: {
              scheduledAt: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!patient) {
    return response.status(404).json({ message: "Patient not found" });
  }

  const payload: PatientHistoryResponse = {
    patient: mapPatient(patient),
    appointments: patient.appointments.map(mapAppointment),
    invoices: patient.invoices.map(mapInvoice)
  };

  return response.status(200).json(payload);
});

patientsRouter.delete("/:id", async (request, response) => {
  const patientId = parseEntityId(request.params.id);

  if (!patientId) {
    return response.status(400).json({ message: "Patient id must be a positive integer" });
  }

  const existing = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Patient not found" });
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });

  const payload: PatientResponse = { patient: mapPatient(patient) };
  return response.status(200).json(payload);
});

export { patientsRouter };
