import type { NotificationEvent, RegistrationStatus } from "@prisma/client";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { prisma } from "../config/prisma";
import { getEnv } from "../config/env";

interface RegistrationForNotification {
  id: number;
  fullName: string;
  contactNumber: string;
  email: string | null;
  status: RegistrationStatus;
  confirmationCode: string;
  camp: {
    name: string;
    date: Date;
    location: string;
  };
}

const eventLabel: Record<NotificationEvent, string> = {
  REGISTERED: "Registration received",
  UPDATED: "Registration updated",
  CANCELLED: "Registration cancelled",
  PROMOTED: "Moved from waitlist to confirmed",
  WAITLISTED: "Placed on waitlist"
};

const buildMessage = (
  registration: RegistrationForNotification,
  event: NotificationEvent
) => {
  const statusPhrase =
    registration.status === "CONFIRMED"
      ? "Confirmed"
      : registration.status === "WAITLISTED"
        ? "Waitlisted"
        : "Cancelled";

  return [
    `${eventLabel[event]} for ${registration.fullName}.`,
    `Camp: ${registration.camp.name} on ${registration.camp.date.toISOString()}.`,
    `Location: ${registration.camp.location}.`,
    `Status: ${statusPhrase}.`,
    `Confirmation Code: ${registration.confirmationCode}.`
  ].join(" ");
};

const logNotification = async (payload: {
  registrationId: number;
  channel: "EMAIL" | "SMS";
  event: NotificationEvent;
  destination?: string;
  status: "SENT" | "FAILED" | "SKIPPED";
  message: string;
  errorMessage?: string;
}) => {
  await prisma.notificationLog.create({
    data: {
      registrationId: payload.registrationId,
      channel: payload.channel,
      event: payload.event,
      destination: payload.destination,
      status: payload.status,
      message: payload.message,
      errorMessage: payload.errorMessage
    }
  });
};

const sendEmail = async (
  registration: RegistrationForNotification,
  event: NotificationEvent,
  message: string
) => {
  const env = getEnv();
  const destination = registration.email ?? undefined;

  if (!destination) {
    await logNotification({
      registrationId: registration.id,
      channel: "EMAIL",
      event,
      status: "SKIPPED",
      message
    });
    return;
  }

  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_FROM) {
    await logNotification({
      registrationId: registration.id,
      channel: "EMAIL",
      event,
      destination,
      status: "SKIPPED",
      message
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS
            }
          : undefined
    });

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: destination,
      subject: `[Medical Camp] ${eventLabel[event]}`,
      text: message
    });

    await logNotification({
      registrationId: registration.id,
      channel: "EMAIL",
      event,
      destination,
      status: "SENT",
      message
    });
  } catch (error) {
    await logNotification({
      registrationId: registration.id,
      channel: "EMAIL",
      event,
      destination,
      status: "FAILED",
      message,
      errorMessage: error instanceof Error ? error.message : "Unknown email error"
    });
  }
};

const sendSms = async (
  registration: RegistrationForNotification,
  event: NotificationEvent,
  message: string
) => {
  const env = getEnv();

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    await logNotification({
      registrationId: registration.id,
      channel: "SMS",
      event,
      destination: registration.contactNumber,
      status: "SKIPPED",
      message
    });
    return;
  }

  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: message,
      from: env.TWILIO_FROM_NUMBER,
      to: registration.contactNumber
    });

    await logNotification({
      registrationId: registration.id,
      channel: "SMS",
      event,
      destination: registration.contactNumber,
      status: "SENT",
      message
    });
  } catch (error) {
    await logNotification({
      registrationId: registration.id,
      channel: "SMS",
      event,
      destination: registration.contactNumber,
      status: "FAILED",
      message,
      errorMessage: error instanceof Error ? error.message : "Unknown SMS error"
    });
  }
};

export const notifyRegistrationEvent = async (
  registration: RegistrationForNotification,
  event: NotificationEvent
) => {
  const message = buildMessage(registration, event);
  await Promise.all([sendEmail(registration, event, message), sendSms(registration, event, message)]);
};
