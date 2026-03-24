import { Router } from "express";
import type { RegistrationResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { registrationInputSchema } from "../validation/registration";

const registrationsRouter = Router();

registrationsRouter.post("/", async (request, response) => {
  const parsed = registrationInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const camp = await prisma.camp.findFirst({
    where: {
      id: parsed.data.campId,
      isActive: true
    }
  });

  if (!camp) {
    return response.status(404).json({ message: "Camp not found" });
  }

  const currentCount = await prisma.registration.count({
    where: { campId: camp.id }
  });

  if (currentCount >= camp.capacity) {
    return response.status(409).json({
      message: "Camp capacity has been reached"
    });
  }

  const registration = await prisma.registration.create({
    data: parsed.data
  });

  const payload: RegistrationResponse = {
    message: "Registration submitted successfully",
    registration: {
      id: registration.id,
      fullName: registration.fullName,
      age: registration.age,
      contactNumber: registration.contactNumber,
      campId: registration.campId,
      createdAt: registration.createdAt.toISOString()
    }
  };

  return response.status(201).json(payload);
});

export { registrationsRouter };
