import { Router } from "express";
import type { CampResponse, CampsResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";

const campsRouter = Router();

campsRouter.get("/", async (_request, response) => {
  const camps = await prisma.camp.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" }
  });

  const payload: CampsResponse = {
    camps: camps.map((camp) => ({
      id: camp.id,
      name: camp.name,
      date: camp.date.toISOString(),
      location: camp.location,
      description: camp.description,
      capacity: camp.capacity,
      isActive: camp.isActive
    }))
  };

  return response.status(200).json(payload);
});

campsRouter.get("/:id", async (request, response) => {
  const campId = Number(request.params.id);

  if (Number.isNaN(campId)) {
    return response.status(400).json({ message: "Camp id must be a number" });
  }

  const camp = await prisma.camp.findFirst({
    where: {
      id: campId,
      isActive: true
    }
  });

  if (!camp) {
    return response.status(404).json({ message: "Camp not found" });
  }

  const payload: CampResponse = {
    camp: {
      id: camp.id,
      name: camp.name,
      date: camp.date.toISOString(),
      location: camp.location,
      description: camp.description,
      capacity: camp.capacity,
      isActive: camp.isActive
    }
  };

  return response.status(200).json(payload);
});

export { campsRouter };
