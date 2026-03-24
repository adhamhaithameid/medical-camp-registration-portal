import { Router } from "express";
import type { DoctorResponse, DoctorsResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { requireAuth, requireRoles } from "../middleware/auth";
import { recordAudit } from "../services/audit";
import { mapDoctor } from "../utils/mappers";
import { doctorInputSchema, doctorUpdateSchema } from "../validation/doctor";

const parseId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const adminDoctorsRouter = Router();
adminDoctorsRouter.use(requireAuth, requireRoles("SUPER_ADMIN", "STAFF"));

adminDoctorsRouter.get("/", async (request, response) => {
  const search = String(request.query.search ?? "").trim();

  const doctors = await prisma.doctor.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
            { specialization: { contains: search } },
            { department: { contains: search } }
          ]
        }
      : undefined,
    orderBy: [{ fullName: "asc" }, { id: "asc" }]
  });

  const payload: DoctorsResponse = {
    doctors: doctors.map(mapDoctor)
  };

  return response.status(200).json(payload);
});

adminDoctorsRouter.get("/:id", async (request, response) => {
  const doctorId = parseId(request.params.id);

  if (!doctorId) {
    return response.status(400).json({ message: "Doctor id must be a positive integer" });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    return response.status(404).json({ message: "Doctor not found" });
  }

  const payload: DoctorResponse = {
    doctor: mapDoctor(doctor)
  };

  return response.status(200).json(payload);
});

adminDoctorsRouter.post("/", async (request, response) => {
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
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      contactNumber: parsed.data.contactNumber,
      specialization: parsed.data.specialization,
      department: parsed.data.department,
      isActive: parsed.data.isActive ?? true
    }
  });

  await recordAudit({
    request,
    action: "DOCTOR_CREATE",
    entityType: "Doctor",
    entityId: String(doctor.id),
    details: {
      fullName: doctor.fullName,
      email: doctor.email
    }
  });

  const payload: DoctorResponse = {
    doctor: mapDoctor(doctor)
  };

  return response.status(201).json(payload);
});

adminDoctorsRouter.patch("/:id", async (request, response) => {
  const doctorId = parseId(request.params.id);

  if (!doctorId) {
    return response.status(400).json({ message: "Doctor id must be a positive integer" });
  }

  const parsed = doctorUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Doctor not found" });
  }

  if (parsed.data.email && parsed.data.email !== existing.email) {
    const conflict = await prisma.doctor.findUnique({
      where: { email: parsed.data.email }
    });

    if (conflict) {
      return response.status(409).json({ message: "A doctor with this email already exists" });
    }
  }

  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      ...(parsed.data.fullName ? { fullName: parsed.data.fullName } : {}),
      ...(parsed.data.email ? { email: parsed.data.email } : {}),
      ...(parsed.data.contactNumber ? { contactNumber: parsed.data.contactNumber } : {}),
      ...(parsed.data.specialization ? { specialization: parsed.data.specialization } : {}),
      ...(parsed.data.department !== undefined ? { department: parsed.data.department } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {})
    }
  });

  await recordAudit({
    request,
    action: "DOCTOR_UPDATE",
    entityType: "Doctor",
    entityId: String(doctor.id),
    details: parsed.data
  });

  const payload: DoctorResponse = {
    doctor: mapDoctor(doctor)
  };

  return response.status(200).json(payload);
});

adminDoctorsRouter.delete("/:id", async (request, response) => {
  const doctorId = parseId(request.params.id);

  if (!doctorId) {
    return response.status(400).json({ message: "Doctor id must be a positive integer" });
  }

  const existing = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Doctor not found" });
  }

  const deleted = await prisma.doctor.delete({
    where: { id: doctorId }
  });

  await recordAudit({
    request,
    action: "DOCTOR_DELETE",
    entityType: "Doctor",
    entityId: String(deleted.id),
    details: {
      fullName: deleted.fullName
    }
  });

  return response.status(200).json({
    doctor: mapDoctor(deleted)
  });
});

export { adminDoctorsRouter };
