import type {
  AdminUser,
  Camp,
  NotificationLogRecord,
  RegistrationRecord
} from "@medical-camp/shared";
import type {
  AdminUser as PrismaAdminUser,
  Camp as PrismaCamp,
  NotificationLog as PrismaNotificationLog,
  Registration as PrismaRegistration
} from "@prisma/client";

export const mapCamp = (
  camp: PrismaCamp,
  counts?: {
    confirmedCount: number;
    waitlistCount: number;
  }
): Camp => {
  const confirmedCount = counts?.confirmedCount ?? 0;
  const waitlistCount = counts?.waitlistCount ?? 0;

  return {
    id: camp.id,
    name: camp.name,
    date: camp.date.toISOString(),
    location: camp.location,
    description: camp.description,
    capacity: camp.capacity,
    isActive: camp.isActive,
    confirmedCount,
    waitlistCount,
    remainingSeats: Math.max(camp.capacity - confirmedCount, 0),
    createdAt: camp.createdAt.toISOString(),
    updatedAt: camp.updatedAt.toISOString()
  };
};

interface RegistrationWithCamp extends PrismaRegistration {
  camp?: Pick<PrismaCamp, "name" | "date">;
}

export const mapRegistration = (
  registration: RegistrationWithCamp
): RegistrationRecord => ({
  id: registration.id,
  fullName: registration.fullName,
  age: registration.age,
  contactNumber: registration.contactNumber,
  email: registration.email,
  campId: registration.campId,
  campName: registration.camp?.name,
  campDate: registration.camp?.date?.toISOString(),
  status: registration.status,
  confirmationCode: registration.confirmationCode,
  isActive: registration.isActive,
  createdAt: registration.createdAt.toISOString(),
  updatedAt: registration.updatedAt.toISOString(),
  cancelledAt: registration.cancelledAt ? registration.cancelledAt.toISOString() : null
});

export const mapAdminUser = (user: PrismaAdminUser): AdminUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
});

export const mapNotificationLog = (
  notification: PrismaNotificationLog
): NotificationLogRecord => ({
  id: notification.id,
  registrationId: notification.registrationId,
  channel: notification.channel,
  event: notification.event,
  destination: notification.destination,
  status: notification.status,
  message: notification.message,
  errorMessage: notification.errorMessage,
  createdAt: notification.createdAt.toISOString()
});
