import { Router } from "express";
import type { CampResponse, CampsResponse } from "@medical-camp/shared";
import type { RegistrationStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth, requireRoles } from "../middleware/auth";
import { recordAudit } from "../services/audit";
import { mapCamp } from "../utils/mappers";
import { campInputSchema, campUpdateSchema } from "../validation/camp";

const campStatuses: RegistrationStatus[] = ["CONFIRMED", "WAITLISTED"];

const parseCampId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const getCampCounts = async (campIds: number[]) => {
  if (campIds.length === 0) {
    return new Map<number, { confirmedCount: number; waitlistCount: number }>();
  }

  const [confirmedRows, waitlistRows] = await Promise.all([
    prisma.registration.groupBy({
      by: ["campId"],
      where: { campId: { in: campIds }, status: "CONFIRMED", isActive: true },
      _count: { _all: true }
    }),
    prisma.registration.groupBy({
      by: ["campId"],
      where: { campId: { in: campIds }, status: "WAITLISTED", isActive: true },
      _count: { _all: true }
    })
  ]);

  const map = new Map<number, { confirmedCount: number; waitlistCount: number }>();

  for (const campId of campIds) {
    const confirmed = confirmedRows.find((row) => row.campId === campId)?._count._all ?? 0;
    const waitlisted = waitlistRows.find((row) => row.campId === campId)?._count._all ?? 0;
    map.set(campId, { confirmedCount: confirmed, waitlistCount: waitlisted });
  }

  return map;
};

const publicCampsRouter = Router();

publicCampsRouter.get("/", async (_request, response) => {
  const camps = await prisma.camp.findMany({
    where: { isActive: true },
    orderBy: [{ date: "asc" }, { id: "asc" }]
  });

  const countsByCamp = await getCampCounts(camps.map((camp) => camp.id));

  const payload: CampsResponse = {
    camps: camps.map((camp) => mapCamp(camp, countsByCamp.get(camp.id)))
  };

  return response.status(200).json(payload);
});

publicCampsRouter.get("/:id", async (request, response) => {
  const campId = parseCampId(request.params.id);

  if (!campId) {
    return response.status(400).json({ message: "Camp id must be a positive integer" });
  }

  const camp = await prisma.camp.findUnique({
    where: { id: campId }
  });

  if (!camp || !camp.isActive) {
    return response.status(404).json({ message: "Camp not found" });
  }

  const countsByCamp = await getCampCounts([camp.id]);
  const payload: CampResponse = {
    camp: mapCamp(camp, countsByCamp.get(camp.id))
  };

  return response.status(200).json(payload);
});

const adminCampsRouter = Router();

adminCampsRouter.use(requireAuth);

adminCampsRouter.get("/", async (_request, response) => {
  const camps = await prisma.camp.findMany({
    orderBy: [{ date: "asc" }, { id: "asc" }]
  });

  const countsByCamp = await getCampCounts(camps.map((camp) => camp.id));
  const payload: CampsResponse = {
    camps: camps.map((camp) => mapCamp(camp, countsByCamp.get(camp.id)))
  };

  return response.status(200).json(payload);
});

adminCampsRouter.post("/", requireRoles("SUPER_ADMIN"), async (request, response) => {
  const parsed = campInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const camp = await prisma.camp.create({
    data: {
      name: parsed.data.name,
      date: new Date(parsed.data.date),
      location: parsed.data.location,
      description: parsed.data.description,
      capacity: parsed.data.capacity,
      isActive: parsed.data.isActive ?? true
    }
  });

  await recordAudit({
    request,
    action: "CAMP_CREATE",
    entityType: "Camp",
    entityId: String(camp.id),
    details: {
      name: camp.name,
      date: camp.date.toISOString(),
      capacity: camp.capacity
    }
  });

  const payload: CampResponse = {
    camp: mapCamp(camp, { confirmedCount: 0, waitlistCount: 0 })
  };

  return response.status(201).json(payload);
});

adminCampsRouter.patch("/:id", requireRoles("SUPER_ADMIN"), async (request, response) => {
  const campId = parseCampId(request.params.id);

  if (!campId) {
    return response.status(400).json({ message: "Camp id must be a positive integer" });
  }

  const parsed = campUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.camp.findUnique({
    where: { id: campId }
  });

  if (!existing) {
    return response.status(404).json({ message: "Camp not found" });
  }

  const updated = await prisma.camp.update({
    where: { id: campId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.date ? { date: new Date(parsed.data.date) } : {}),
      ...(parsed.data.location ? { location: parsed.data.location } : {}),
      ...(parsed.data.description ? { description: parsed.data.description } : {}),
      ...(parsed.data.capacity ? { capacity: parsed.data.capacity } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {})
    }
  });

  await recordAudit({
    request,
    action: "CAMP_UPDATE",
    entityType: "Camp",
    entityId: String(updated.id),
    details: parsed.data
  });

  const countsByCamp = await getCampCounts([updated.id]);
  const payload: CampResponse = {
    camp: mapCamp(updated, countsByCamp.get(updated.id))
  };

  return response.status(200).json(payload);
});

adminCampsRouter.post("/:id/deactivate", requireRoles("SUPER_ADMIN"), async (request, response) => {
  const campId = parseCampId(request.params.id);

  if (!campId) {
    return response.status(400).json({ message: "Camp id must be a positive integer" });
  }

  const camp = await prisma.camp.findUnique({
    where: { id: campId }
  });

  if (!camp) {
    return response.status(404).json({ message: "Camp not found" });
  }

  const updated = await prisma.camp.update({
    where: { id: campId },
    data: {
      isActive: false
    }
  });

  await recordAudit({
    request,
    action: "CAMP_DEACTIVATE",
    entityType: "Camp",
    entityId: String(updated.id),
    details: {
      previousActiveState: camp.isActive
    }
  });

  const countsByCamp = await getCampCounts([updated.id]);
  const payload: CampResponse = {
    camp: mapCamp(updated, countsByCamp.get(updated.id))
  };

  return response.status(200).json(payload);
});

export { publicCampsRouter, adminCampsRouter, campStatuses, getCampCounts };
