import { Router } from "express";
import type { AdminRegistrationsResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { requireAdminAuth } from "../middleware/auth";

const adminRouter = Router();

adminRouter.get("/registrations", requireAdminAuth, async (_request, response) => {
  const registrations = await prisma.registration.findMany({
    include: { camp: true },
    orderBy: { createdAt: "desc" }
  });

  const payload: AdminRegistrationsResponse = {
    registrations: registrations.map((registration) => ({
      id: registration.id,
      fullName: registration.fullName,
      age: registration.age,
      contactNumber: registration.contactNumber,
      campId: registration.campId,
      createdAt: registration.createdAt.toISOString(),
      campName: registration.camp.name,
      campDate: registration.camp.date.toISOString(),
      campLocation: registration.camp.location
    }))
  };

  return response.status(200).json(payload);
});

export { adminRouter };
