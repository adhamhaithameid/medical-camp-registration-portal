import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(2).max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive()
});

export const billingCalculateSchema = z.object({
  items: z.array(invoiceItemSchema).min(1)
});

export const generateInvoiceSchema = z.object({
  patientId: z.number().int().positive(),
  appointmentId: z.number().int().positive().optional(),
  items: z.array(invoiceItemSchema).min(1)
});

export const processPaymentSchema = z.object({
  paymentMethod: z.string().trim().min(2).max(100)
});
