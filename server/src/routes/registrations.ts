import { randomBytes } from "node:crypto";
import { Router } from "express";
import type {
  AdminRegistrationsResponse,
  RegistrationLookupResponse,
  RegistrationResponse
} from "@medical-camp/shared";
import { RegistrationStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth, requireRoles } from "../middleware/auth";
import { recordAudit } from "../services/audit";
import { notifyRegistrationEvent } from "../services/notifications";
import { sendError, sendValidationError } from "../utils/http";
import { mapCamp, mapNotificationLog, mapRegistration } from "../utils/mappers";
import {
  adminRegistrationsQuerySchema,
  confirmationCodeSchema,
  registrationInputSchema,
  registrationUpdateSchema
} from "../validation/registration";
import { getCampCounts } from "./camps";

const parseId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const registrationsRouter = Router();

const hasActiveDuplicate = async (
  campId: number,
  contactNumber: string,
  excludeRegistrationId?: number
) => {
  const duplicate = await prisma.registration.findFirst({
    where: {
      campId,
      contactNumber,
      isActive: true,
      status: {
        in: [RegistrationStatus.CONFIRMED, RegistrationStatus.WAITLISTED]
      },
      ...(excludeRegistrationId ? { id: { not: excludeRegistrationId } } : {})
    }
  });

  return Boolean(duplicate);
};

const generateConfirmationCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = randomBytes(6).toString("hex").toUpperCase();
    const existing = await prisma.registration.findUnique({
      where: { confirmationCode: candidate }
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`.toUpperCase();
};

const resolveWaitlistStatus = async (campId: number, capacity: number) => {
  const confirmedCount = await prisma.registration.count({
    where: {
      campId,
      status: RegistrationStatus.CONFIRMED,
      isActive: true
    }
  });

  return confirmedCount >= capacity ? RegistrationStatus.WAITLISTED : RegistrationStatus.CONFIRMED;
};

registrationsRouter.post("/", async (request, response) => {
  const parsed = registrationInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return sendValidationError(request, response, parsed.error);
  }

  const camp = await prisma.camp.findUnique({
    where: { id: parsed.data.campId }
  });

  if (!camp || !camp.isActive) {
    return sendError(request, response, 404, "Camp not found or inactive");
  }

  const duplicate = await hasActiveDuplicate(parsed.data.campId, parsed.data.contactNumber);

  if (duplicate) {
    return sendError(
      request,
      response,
      409,
      "Duplicate registration detected for this contact number and camp"
    );
  }

  const status = await resolveWaitlistStatus(parsed.data.campId, camp.capacity);
  const confirmationCode = await generateConfirmationCode();

  const registration = await prisma.registration.create({
    data: {
      fullName: parsed.data.fullName,
      age: parsed.data.age,
      contactNumber: parsed.data.contactNumber,
      email: parsed.data.email,
      campId: parsed.data.campId,
      status,
      confirmationCode,
      isActive: true
    },
    include: {
      camp: {
        select: {
          name: true,
          date: true,
          location: true
        }
      }
    }
  });

  await notifyRegistrationEvent(
    {
      id: registration.id,
      fullName: registration.fullName,
      contactNumber: registration.contactNumber,
      email: registration.email,
      status: registration.status,
      confirmationCode: registration.confirmationCode,
      camp: registration.camp
    },
    status === RegistrationStatus.WAITLISTED ? "WAITLISTED" : "REGISTERED"
  );

  const payload: RegistrationResponse = {
    registration: mapRegistration(registration)
  };

  return response.status(201).json(payload);
});

registrationsRouter.post("/lookup", async (request, response) => {
  const parsed = confirmationCodeSchema.safeParse(request.body);

  if (!parsed.success) {
    return sendValidationError(request, response, parsed.error);
  }

  const registration = await prisma.registration.findUnique({
    where: { confirmationCode: parsed.data.confirmationCode },
    include: {
      camp: true
    }
  });

  if (!registration) {
    return sendError(request, response, 404, "Registration not found");
  }

  const countsByCamp = await getCampCounts([registration.campId]);
  const payload: RegistrationLookupResponse = {
    registration: mapRegistration(registration),
    camp: mapCamp(registration.camp, countsByCamp.get(registration.campId))
  };

  return response.status(200).json(payload);
});

registrationsRouter.get("/:confirmationCode", async (request, response) => {
  const code = request.params.confirmationCode.trim();
  const registration = await prisma.registration.findUnique({
    where: { confirmationCode: code },
    include: { camp: true }
  });

  if (!registration) {
    return sendError(request, response, 404, "Registration not found");
  }

  const countsByCamp = await getCampCounts([registration.campId]);
  const payload: RegistrationLookupResponse = {
    registration: mapRegistration(registration),
    camp: mapCamp(registration.camp, countsByCamp.get(registration.campId))
  };

  return response.status(200).json(payload);
});

registrationsRouter.patch("/:confirmationCode", async (request, response) => {
  const code = request.params.confirmationCode.trim();
  const parsed = registrationUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return sendValidationError(request, response, parsed.error);
  }

  const existing = await prisma.registration.findUnique({
    where: { confirmationCode: code },
    include: {
      camp: {
        select: {
          name: true,
          date: true,
          location: true
        }
      }
    }
  });

  if (!existing) {
    return sendError(request, response, 404, "Registration not found");
  }

  if (!existing.isActive || existing.status === RegistrationStatus.CANCELLED) {
    return sendError(request, response, 409, "Cancelled registrations cannot be edited");
  }

  if (parsed.data.contactNumber) {
    const duplicate = await hasActiveDuplicate(existing.campId, parsed.data.contactNumber, existing.id);

    if (duplicate) {
      return sendError(
        request,
        response,
        409,
        "Duplicate registration detected for this contact number and camp"
      );
    }
  }

  const updated = await prisma.registration.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.fullName ? { fullName: parsed.data.fullName } : {}),
      ...(parsed.data.age ? { age: parsed.data.age } : {}),
      ...(parsed.data.contactNumber ? { contactNumber: parsed.data.contactNumber } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {})
    },
    include: {
      camp: {
        select: {
          name: true,
          date: true,
          location: true
        }
      }
    }
  });

  await notifyRegistrationEvent(
    {
      id: updated.id,
      fullName: updated.fullName,
      contactNumber: updated.contactNumber,
      email: updated.email,
      status: updated.status,
      confirmationCode: updated.confirmationCode,
      camp: updated.camp
    },
    "UPDATED"
  );

  const payload: RegistrationResponse = {
    registration: mapRegistration(updated)
  };

  return response.status(200).json(payload);
});

registrationsRouter.delete("/:confirmationCode", async (request, response) => {
  const code = request.params.confirmationCode.trim();

  const existing = await prisma.registration.findUnique({
    where: { confirmationCode: code },
    include: {
      camp: {
        select: {
          name: true,
          date: true,
          location: true
        }
      }
    }
  });

  if (!existing) {
    return sendError(request, response, 404, "Registration not found");
  }

  if (!existing.isActive || existing.status === RegistrationStatus.CANCELLED) {
    return sendError(request, response, 409, "Registration already cancelled");
  }

  const cancelled = await prisma.registration.update({
    where: { id: existing.id },
    data: {
      status: RegistrationStatus.CANCELLED,
      isActive: false,
      cancelledAt: new Date()
    },
    include: {
      camp: {
        select: {
          name: true,
          date: true,
          location: true
        }
      }
    }
  });

  await notifyRegistrationEvent(
    {
      id: cancelled.id,
      fullName: cancelled.fullName,
      contactNumber: cancelled.contactNumber,
      email: cancelled.email,
      status: cancelled.status,
      confirmationCode: cancelled.confirmationCode,
      camp: cancelled.camp
    },
    "CANCELLED"
  );

  const payload: RegistrationResponse = {
    registration: mapRegistration(cancelled)
  };

  return response.status(200).json(payload);
});

const toCsv = (rows: string[][]) =>
  rows
    .map((row) =>
      row
        .map((field) => `"${field.replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

const adminRegistrationsRouter = Router();
adminRegistrationsRouter.use(requireAuth, requireRoles("SUPER_ADMIN", "STAFF"));

adminRegistrationsRouter.get("/", async (request, response) => {
  const parsed = adminRegistrationsQuerySchema.safeParse(request.query);

  if (!parsed.success) {
    return sendValidationError(request, response, parsed.error);
  }

  const page = Math.max(1, Math.trunc(parsed.data.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(parsed.data.pageSize ?? 20)));

  if (parsed.data.campId !== undefined && (!Number.isInteger(parsed.data.campId) || parsed.data.campId <= 0)) {
    return sendError(request, response, 400, "campId must be a positive integer");
  }

  const where = {
    ...(parsed.data.campId ? { campId: parsed.data.campId } : {}),
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.search
      ? {
          OR: [
            { fullName: { contains: parsed.data.search } },
            { contactNumber: { contains: parsed.data.search } },
            { confirmationCode: { contains: parsed.data.search } },
            { email: { contains: parsed.data.search } }
          ]
        }
      : {}),
    ...(parsed.data.dateFrom || parsed.data.dateTo
      ? {
          camp: {
            date: {
              ...(parsed.data.dateFrom ? { gte: new Date(parsed.data.dateFrom) } : {}),
              ...(parsed.data.dateTo ? { lte: new Date(parsed.data.dateTo) } : {})
            }
          }
        }
      : {})
  };

  const sortOrder = parsed.data.sortOrder ?? "desc";
  const orderBy =
    parsed.data.sortBy === "campDate"
      ? { camp: { date: sortOrder } }
      : parsed.data.sortBy === "status"
        ? { status: sortOrder }
        : parsed.data.sortBy === "fullName"
          ? { fullName: sortOrder }
          : { createdAt: sortOrder };

  const [total, rows] = await Promise.all([
    prisma.registration.count({ where }),
    prisma.registration.findMany({
      where,
      include: {
        camp: {
          select: {
            name: true,
            date: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  const payload: AdminRegistrationsResponse = {
    registrations: rows.map(mapRegistration),
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };

  return response.status(200).json(payload);
});

adminRegistrationsRouter.get("/export.csv", async (request, response) => {
  const parsed = adminRegistrationsQuerySchema.safeParse({
    ...request.query,
    page: "1",
    pageSize: "100000"
  });

  if (!parsed.success) {
    return sendValidationError(request, response, parsed.error);
  }

  const where = {
    ...(parsed.data.campId ? { campId: parsed.data.campId } : {}),
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.search
      ? {
          OR: [
            { fullName: { contains: parsed.data.search } },
            { contactNumber: { contains: parsed.data.search } },
            { confirmationCode: { contains: parsed.data.search } },
            { email: { contains: parsed.data.search } }
          ]
        }
      : {}),
    ...(parsed.data.dateFrom || parsed.data.dateTo
      ? {
          camp: {
            date: {
              ...(parsed.data.dateFrom ? { gte: new Date(parsed.data.dateFrom) } : {}),
              ...(parsed.data.dateTo ? { lte: new Date(parsed.data.dateTo) } : {})
            }
          }
        }
      : {})
  };

  const rows = await prisma.registration.findMany({
    where,
    include: {
      camp: {
        select: {
          name: true,
          date: true,
          location: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const csvRows: string[][] = [
    [
      "Registration ID",
      "Full Name",
      "Contact Number",
      "Email",
      "Camp",
      "Camp Date",
      "Camp Location",
      "Status",
      "Confirmation Code",
      "Created At"
    ],
    ...rows.map((row) => [
      String(row.id),
      row.fullName,
      row.contactNumber,
      row.email ?? "",
      row.camp.name,
      row.camp.date.toISOString(),
      row.camp.location,
      row.status,
      row.confirmationCode,
      row.createdAt.toISOString()
    ])
  ];

  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="registrations-${new Date().toISOString().slice(0, 10)}.csv"`
  );

  return response.status(200).send(toCsv(csvRows));
});

adminRegistrationsRouter.patch("/:id/promote", async (request, response) => {
  const registrationId = parseId(request.params.id);

  if (!registrationId) {
    return sendError(request, response, 400, "Registration id must be a positive integer");
  }

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      camp: {
        select: {
          name: true,
          date: true,
          location: true,
          capacity: true
        }
      }
    }
  });

  if (!registration) {
    return sendError(request, response, 404, "Registration not found");
  }

  if (registration.status !== RegistrationStatus.WAITLISTED || !registration.isActive) {
    return sendError(
      request,
      response,
      409,
      "Only active waitlisted registrations can be promoted"
    );
  }

  const confirmedCount = await prisma.registration.count({
    where: {
      campId: registration.campId,
      status: RegistrationStatus.CONFIRMED,
      isActive: true
    }
  });

  if (confirmedCount >= registration.camp.capacity) {
    return sendError(
      request,
      response,
      409,
      "No seats are currently available to promote this registration"
    );
  }

  const promoted = await prisma.registration.update({
    where: { id: registration.id },
    data: {
      status: RegistrationStatus.CONFIRMED
    },
    include: {
      camp: {
        select: {
          name: true,
          date: true,
          location: true
        }
      }
    }
  });

  await notifyRegistrationEvent(
    {
      id: promoted.id,
      fullName: promoted.fullName,
      contactNumber: promoted.contactNumber,
      email: promoted.email,
      status: promoted.status,
      confirmationCode: promoted.confirmationCode,
      camp: promoted.camp
    },
    "PROMOTED"
  );

  await recordAudit({
    request,
    action: "REGISTRATION_PROMOTE",
    entityType: "Registration",
    entityId: String(promoted.id),
    details: {
      from: registration.status,
      to: promoted.status
    }
  });

  return response.status(200).json({ registration: mapRegistration(promoted) });
});

adminRegistrationsRouter.get("/:id/notifications", async (request, response) => {
  const registrationId = parseId(request.params.id);

  if (!registrationId) {
    return sendError(request, response, 400, "Registration id must be a positive integer");
  }

  const notifications = await prisma.notificationLog.findMany({
    where: { registrationId },
    orderBy: { createdAt: "desc" }
  });

  return response.status(200).json({
    notifications: notifications.map(mapNotificationLog)
  });
});

export { registrationsRouter, adminRegistrationsRouter };
