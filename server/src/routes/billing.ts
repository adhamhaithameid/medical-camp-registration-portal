import { Router } from "express";
import type {
  BillingTotalResponse,
  InvoiceResponse,
  InvoicesResponse
} from "@medical-camp/shared";
import { InvoiceStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middleware/auth";
import { mapInvoice } from "../utils/mappers";
import {
  billingCalculateSchema,
  generateInvoiceSchema,
  processPaymentSchema
} from "../validation/billing";

const billingRouter = Router();

billingRouter.use(requireAuth);

const parseEntityId = (rawId: string) => {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const calculateTotal = (
  items: Array<{ quantity: number; unitPrice: number }>
) => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

billingRouter.post("/calculate", async (request, response) => {
  const parsed = billingCalculateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const totalCost = calculateTotal(parsed.data.items);

  const payload: BillingTotalResponse = { totalCost };
  return response.status(200).json(payload);
});

billingRouter.post("/invoices", async (request, response) => {
  const parsed = generateInvoiceSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const patient = await prisma.patient.findUnique({
    where: { id: parsed.data.patientId }
  });

  if (!patient || patient.isDeleted) {
    return response.status(404).json({ message: "Patient not found" });
  }

  if (parsed.data.appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parsed.data.appointmentId }
    });

    if (!appointment) {
      return response.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.patientId !== parsed.data.patientId) {
      return response.status(400).json({
        message: "Appointment does not belong to this patient"
      });
    }
  }

  const existingInvoiceForAppointment = parsed.data.appointmentId
    ? await prisma.invoice.findUnique({
        where: { appointmentId: parsed.data.appointmentId }
      })
    : null;

  if (existingInvoiceForAppointment) {
    return response.status(409).json({
      message: "An invoice already exists for this appointment"
    });
  }

  const totalCost = calculateTotal(parsed.data.items);

  const invoice = await prisma.invoice.create({
    data: {
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId,
      totalCost,
      status: InvoiceStatus.UNPAID,
      items: {
        create: parsed.data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice
        }))
      }
    },
    include: {
      items: true,
      patient: {
        select: {
          fullName: true
        }
      },
      appointment: {
        select: {
          scheduledAt: true
        }
      }
    }
  });

  const payload: InvoiceResponse = {
    invoice: mapInvoice(invoice)
  };

  return response.status(201).json(payload);
});

billingRouter.post("/invoices/:id/pay", async (request, response) => {
  const invoiceId = parseEntityId(request.params.id);

  if (!invoiceId) {
    return response.status(400).json({ message: "Invoice id must be a positive integer" });
  }

  const parsed = processPaymentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      patient: {
        select: {
          fullName: true
        }
      },
      appointment: {
        select: {
          scheduledAt: true
        }
      }
    }
  });

  if (!invoice) {
    return response.status(404).json({ message: "Invoice not found" });
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.PAID,
      paymentMethod: parsed.data.paymentMethod,
      paidAt: new Date()
    },
    include: {
      items: true,
      patient: {
        select: {
          fullName: true
        }
      },
      appointment: {
        select: {
          scheduledAt: true
        }
      }
    }
  });

  const payload: InvoiceResponse = {
    invoice: mapInvoice(updated)
  };

  return response.status(200).json(payload);
});

billingRouter.get("/history", async (request, response) => {
  const patientId = request.query.patientId ? Number(request.query.patientId) : undefined;

  if (patientId !== undefined && (!Number.isInteger(patientId) || patientId <= 0)) {
    return response.status(400).json({ message: "patientId must be a positive integer" });
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(patientId ? { patientId } : {})
    },
    include: {
      items: true,
      patient: {
        select: {
          fullName: true
        }
      },
      appointment: {
        select: {
          scheduledAt: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const payload: InvoicesResponse = {
    invoices: invoices.map(mapInvoice)
  };

  return response.status(200).json(payload);
});

export { billingRouter };
