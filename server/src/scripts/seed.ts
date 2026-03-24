import { prisma } from "../config/prisma";
import { getEnv } from "../config/env";
import { hashPassword } from "../utils/auth";

const samplePatients = [
  {
    fullName: "Nour Hassan",
    dateOfBirth: new Date("1992-09-20T00:00:00.000Z"),
    gender: "Female",
    phone: "+20 101 111 2233",
    address: "Nasr City, Cairo",
    medicalHistory: "Hypertension, annual follow-up needed"
  },
  {
    fullName: "Omar Adel",
    dateOfBirth: new Date("1988-03-05T00:00:00.000Z"),
    gender: "Male",
    phone: "+20 102 333 4455",
    address: "Heliopolis, Cairo",
    medicalHistory: "Diabetes Type 2"
  }
];

const sampleDoctors = [
  {
    fullName: "Dr. Salma Reda",
    email: "salma.reda@hms.local",
    phone: "+20 110 000 1001",
    specialization: "Cardiology",
    schedule: "Sun-Wed 10:00-16:00"
  },
  {
    fullName: "Dr. Karim Mostafa",
    email: "karim.mostafa@hms.local",
    phone: "+20 110 000 1002",
    specialization: "Endocrinology",
    schedule: "Mon-Thu 12:00-18:00"
  }
];

export const seedDatabase = async () => {
  const env = getEnv();
  const passwordHash = await hashPassword(env.DEFAULT_USER_PASSWORD);

  await prisma.user.upsert({
    where: { email: env.DEFAULT_USER_EMAIL },
    update: {
      fullName: env.DEFAULT_USER_FULL_NAME,
      passwordHash,
      role: "ADMIN"
    },
    create: {
      fullName: env.DEFAULT_USER_FULL_NAME,
      email: env.DEFAULT_USER_EMAIL,
      passwordHash,
      role: "ADMIN"
    }
  });

  for (const patient of samplePatients) {
    const existing = await prisma.patient.findFirst({
      where: {
        fullName: patient.fullName,
        phone: patient.phone,
        isDeleted: false
      }
    });

    if (!existing) {
      await prisma.patient.create({ data: patient });
    }
  }

  for (const doctor of sampleDoctors) {
    await prisma.doctor.upsert({
      where: { email: doctor.email },
      update: {
        fullName: doctor.fullName,
        phone: doctor.phone,
        specialization: doctor.specialization,
        schedule: doctor.schedule
      },
      create: doctor
    });
  }

  const patient = await prisma.patient.findFirst({
    where: { isDeleted: false },
    orderBy: { id: "asc" }
  });

  const doctor = await prisma.doctor.findFirst({
    orderBy: { id: "asc" }
  });

  if (patient && doctor) {
    const scheduledAt = new Date("2026-04-15T10:30:00.000Z");

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt
      }
    });

    if (!existingAppointment) {
      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          scheduledAt,
          reason: "Routine checkup"
        }
      });

      await prisma.invoice.create({
        data: {
          patientId: patient.id,
          appointmentId: appointment.id,
          totalCost: 550,
          items: {
            create: [
              {
                description: "Consultation",
                quantity: 1,
                unitPrice: 400,
                lineTotal: 400
              },
              {
                description: "Lab tests",
                quantity: 1,
                unitPrice: 150,
                lineTotal: 150
              }
            ]
          }
        }
      });
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
