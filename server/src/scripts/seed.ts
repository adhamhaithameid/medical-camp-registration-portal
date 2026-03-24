import { prisma } from "../config/prisma";
import { getEnv } from "../config/env";
import { hashPassword } from "../utils/auth";

const sampleCamps = [
  {
    name: "City General Health Camp",
    date: new Date("2026-04-12T09:00:00.000Z"),
    location: "Cairo Community Clinic",
    description: "General screening camp focused on preventive health and doctor consultations.",
    capacity: 60,
    isActive: true
  },
  {
    name: "Women Wellness Camp",
    date: new Date("2026-05-08T08:30:00.000Z"),
    location: "Nasr City Medical Center",
    description: "Specialized support for women wellness, maternal health, and nutrition guidance.",
    capacity: 45,
    isActive: true
  },
  {
    name: "Senior Care Camp",
    date: new Date("2026-06-21T10:00:00.000Z"),
    location: "Heliopolis Outreach Hospital",
    description: "Dedicated camp for geriatric checkups and long-term care planning.",
    capacity: 40,
    isActive: true
  }
];

export const seedDatabase = async () => {
  const env = getEnv();
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  await prisma.adminUser.upsert({
    where: { username: env.ADMIN_USERNAME },
    update: { passwordHash },
    create: {
      username: env.ADMIN_USERNAME,
      passwordHash
    }
  });

  for (const camp of sampleCamps) {
    const existing = await prisma.camp.findFirst({
      where: {
        name: camp.name,
        location: camp.location,
        date: camp.date
      }
    });

    if (!existing) {
      await prisma.camp.create({ data: camp });
    }
  }
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
