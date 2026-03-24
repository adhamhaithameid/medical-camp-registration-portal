import { Router } from "express";
import type { AppointmentsResponse, AppointmentResponse } from "@medical-camp/shared";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth";
import { mapAppointment } from "../utils/mappers";
import {
  appointmentInputSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema
} from "../validation/appointment";

const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth);

const parseEntityId = (rawId: string) => {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const activeStatuses = [AppointmentStatus.BOOKED, AppointmentStatus.RESCHEDULED, AppointmentStatus.COMPLETED];

appointmentsRouter.get("/", async (request, response) => {
  const patientId = request.query.patientId ? Number(request.query.patientId) : undefined;
  const doctorId = request.query.doctorId ? Number(request.query.doctorId) : undefined;
  const status = request.query.status as AppointmentStatus | undefined;

  if (patientId !== undefined && (!Number.isInteger(patientId) || patientId <= 0)) {
    return response.status(400).json({ message: "patientId must be a positive integer" });
  }

  if (doctorId !== undefined && (!Number.isInteger(doctorId) || doctorId <= 0)) {
    return response.status(400).json({ message: "doctorId must be a positive integer" });
  }

  if (status !== undefined && !Object.values(AppointmentStatus).includes(status)) {
    return response.status(400).json({ message: "status is invalid" });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(patientId ? { patientId } : {}),
      ...(doctorId ? { doctorId } : {}),
      ...(status ? { status } : {})
    },
    include: {
      patient: {
        select: {
          fullName: true
        }
      },
      doctor: {
        select: {
          fullName: true,
          specialization: true
        }
      }
    },
    orderBy: { scheduledAt: "asc" }
  });

  const payload: AppointmentsResponse = {
    appointments: appointments.map(mapAppointment)
  };

  return response.status(200).json(payload);
});

appointmentsRouter.post("/", async (request, response) => {
  const parsed = appointmentInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({ where: { id: parsed.data.patientId } }),
    prisma.doctor.findUnique({ where: { id: parsed.data.doctorId } })
  ]);

  if (!patient || patient.isDeleted) {
    return response.status(404).json({ message: "Patient not found" });
  }

  if (!doctor) {
    return response.status(404).json({ message: "Doctor not found" });
  }

  const scheduledAtDate = new Date(parsed.data.scheduledAt);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: parsed.data.doctorId,
      scheduledAt: scheduledAtDate,
      status: { in: activeStatuses }
    }
  });

  if (conflict) {
    return response.status(409).json({ message: "Doctor already has an appointment at this time" });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: parsed.data.patientId,
      doctorId: parsed.data.doctorId,
      scheduledAt: scheduledAtDate,
      reason: parsed.data.reason
    },
    include: {
      patient: {
        select: {
          fullName: true
        }
      },
      doctor: {
        select: {
          fullName: true,
          specialization: true
        }
      }
    }
  });

  const payload: AppointmentResponse = {
    appointment: mapAppointment(appointment)
  };

  return response.status(201).json(payload);
});

appointmentsRouter.patch("/:id/cancel", async (request, response) => {
  const appointmentId = parseEntityId(request.params.id);

  if (!appointmentId) {
    return response.status(400).json({ message: "Appointment id must be a positive integer" });
  }

  const parsed = cancelAppointmentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Appointment not found" });
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancelReason: parsed.data.reason ?? existing.cancelReason
    },
    include: {
      patient: {
        select: {
          fullName: true
        }
      },
      doctor: {
        select: {
          fullName: true,
          specialization: true
        }
      }
    }
  });

  const payload: AppointmentResponse = {
    appointment: mapAppointment(appointment)
  };

  return response.status(200).json(payload);
});

appointmentsRouter.patch("/:id/reschedule", async (request, response) => {
  const appointmentId = parseEntityId(request.params.id);

  if (!appointmentId) {
    return response.status(400).json({ message: "Appointment id must be a positive integer" });
  }

  const parsed = rescheduleAppointmentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Appointment not found" });
  }

  const rescheduledAt = new Date(parsed.data.scheduledAt);

  const conflict = await prisma.appointment.findFirst({
    where: {
      id: { not: appointmentId },
      doctorId: existing.doctorId,
      scheduledAt: rescheduledAt,
      status: { in: activeStatuses }
    }
  });

  if (conflict) {
    return response.status(409).json({ message: "Doctor already has an appointment at this time" });
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.RESCHEDULED,
      scheduledAt: rescheduledAt,
      rescheduleReason: parsed.data.reason ?? existing.rescheduleReason
    },
    include: {
      patient: {
        select: {
          fullName: true
        }
      },
      doctor: {
        select: {
          fullName: true,
          specialization: true
        }
      }
    }
  });

  const payload: AppointmentResponse = {
    appointment: mapAppointment(appointment)
  };

  return response.status(200).json(payload);
});

export { appointmentsRouter };
