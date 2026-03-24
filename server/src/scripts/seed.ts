import { RegistrationStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getEnv } from "../config/env";
import { hashPassword } from "../utils/auth";

const sampleCamps = [
  {
    name: "Community Diabetes Screening Camp",
    date: new Date("2026-05-10T08:00:00.000Z"),
    location: "Nasr City Medical Hub",
    description:
      "Free diabetes screening, counseling, and risk-assessment workshop for adults.",
    capacity: 2,
    isActive: true
  },
  {
    name: "Women Wellness Medical Camp",
    date: new Date("2026-05-18T09:00:00.000Z"),
    location: "Maadi Family Health Center",
    description:
      "Preventive screening and awareness sessions focused on women health and nutrition.",
    capacity: 5,
    isActive: true
  },
  {
    name: "Rural Pediatric Outreach Camp",
    date: new Date("2026-06-01T07:30:00.000Z"),
    location: "Beni Suef Community Clinic",
    description: "Pediatric checkups, vaccination follow-up, and parental guidance services.",
    capacity: 3,
    isActive: true
  }
];

const bootstrapAdminUsers = async () => {
  const env = getEnv();

  await prisma.adminUser.upsert({
    where: { username: env.DEFAULT_SUPER_ADMIN_USERNAME },
    update: {
      passwordHash: await hashPassword(env.DEFAULT_SUPER_ADMIN_PASSWORD),
      role: "SUPER_ADMIN",
      isActive: true
    },
    create: {
      username: env.DEFAULT_SUPER_ADMIN_USERNAME,
      passwordHash: await hashPassword(env.DEFAULT_SUPER_ADMIN_PASSWORD),
      role: "SUPER_ADMIN",
      isActive: true
    }
  });

  await prisma.adminUser.upsert({
    where: { username: env.DEFAULT_STAFF_USERNAME },
    update: {
      passwordHash: await hashPassword(env.DEFAULT_STAFF_PASSWORD),
      role: "STAFF",
      isActive: true
    },
    create: {
      username: env.DEFAULT_STAFF_USERNAME,
      passwordHash: await hashPassword(env.DEFAULT_STAFF_PASSWORD),
      role: "STAFF",
      isActive: true
    }
  });
};

const bootstrapCamps = async () => {
  for (const camp of sampleCamps) {
    const existing = await prisma.camp.findFirst({
      where: {
        name: camp.name,
        date: camp.date
      }
    });

    if (!existing) {
      await prisma.camp.create({ data: camp });
      continue;
    }

    await prisma.camp.update({
      where: { id: existing.id },
      data: {
        location: camp.location,
        description: camp.description,
        capacity: camp.capacity,
        isActive: camp.isActive
      }
    });
  }
};

const bootstrapRegistrations = async () => {
  const firstCamp = await prisma.camp.findFirst({
    orderBy: { id: "asc" }
  });

  if (!firstCamp) {
    return;
  }

  const registrations = [
    {
      fullName: "Nour Hassan",
      age: 31,
      contactNumber: "+20 101 111 2233",
      email: "nour.hassan@example.com",
      status: RegistrationStatus.CONFIRMED,
      confirmationCode: "SEEDNOUR01",
      isActive: true
    },
    {
      fullName: "Omar Adel",
      age: 35,
      contactNumber: "+20 102 333 4455",
      email: "omar.adel@example.com",
      status: RegistrationStatus.CONFIRMED,
      confirmationCode: "SEEDOMAR02",
      isActive: true
    },
    {
      fullName: "Mona Khaled",
      age: 28,
      contactNumber: "+20 103 555 6677",
      email: "mona.khaled@example.com",
      status: RegistrationStatus.WAITLISTED,
      confirmationCode: "SEEDMONA03",
      isActive: true
    }
  ];

  for (const registration of registrations) {
    const existing = await prisma.registration.findUnique({
      where: { confirmationCode: registration.confirmationCode }
    });

    if (existing) {
      continue;
    }

    await prisma.registration.create({
      data: {
        ...registration,
        campId: firstCamp.id
      }
    });
  }
};

export const seedDatabase = async () => {
  await bootstrapAdminUsers();
  await bootstrapCamps();
  await bootstrapRegistrations();
};

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
      console.log("Database seeding completed");
    })
    .catch(async (error) => {
      await prisma.$disconnect();
      console.error("Database seeding failed", error);
      process.exit(1);
    });
}
