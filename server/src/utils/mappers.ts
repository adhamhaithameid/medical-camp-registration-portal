import type {
  Appointment,
  Doctor,
  Invoice,
  InvoiceItem,
  Patient
} from "@medical-camp/shared";
import type { Appointment as PrismaAppointment, Doctor as PrismaDoctor, Invoice as PrismaInvoice, InvoiceItem as PrismaInvoiceItem, Patient as PrismaPatient } from "@prisma/client";

export const mapPatient = (patient: PrismaPatient): Patient => ({
  id: patient.id,
  fullName: patient.fullName,
  dateOfBirth: patient.dateOfBirth.toISOString(),
  gender: patient.gender,
  phone: patient.phone,
  address: patient.address,
  medicalHistory: patient.medicalHistory,
  isDeleted: patient.isDeleted,
  deletedAt: patient.deletedAt ? patient.deletedAt.toISOString() : null,
  createdAt: patient.createdAt.toISOString(),
  updatedAt: patient.updatedAt.toISOString()
});

export const mapDoctor = (doctor: PrismaDoctor): Doctor => ({
  id: doctor.id,
  fullName: doctor.fullName,
  email: doctor.email,
  phone: doctor.phone,
  specialization: doctor.specialization,
  schedule: doctor.schedule,
  createdAt: doctor.createdAt.toISOString(),
  updatedAt: doctor.updatedAt.toISOString()
});

interface AppointmentWithRelations extends PrismaAppointment {
  patient?: Pick<PrismaPatient, "fullName">;
  doctor?: Pick<PrismaDoctor, "fullName" | "specialization">;
}

export const mapAppointment = (appointment: AppointmentWithRelations): Appointment => ({
  id: appointment.id,
  patientId: appointment.patientId,
  doctorId: appointment.doctorId,
  scheduledAt: appointment.scheduledAt.toISOString(),
  status: appointment.status,
  reason: appointment.reason,
  cancelReason: appointment.cancelReason,
  rescheduleReason: appointment.rescheduleReason,
  createdAt: appointment.createdAt.toISOString(),
  updatedAt: appointment.updatedAt.toISOString(),
  patientName: appointment.patient?.fullName,
  doctorName: appointment.doctor?.fullName,
  doctorSpecialization: appointment.doctor?.specialization
});

export const mapInvoiceItem = (item: PrismaInvoiceItem): InvoiceItem => ({
  id: item.id,
  invoiceId: item.invoiceId,
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  lineTotal: item.lineTotal
});

interface InvoiceWithRelations extends PrismaInvoice {
  patient?: Pick<PrismaPatient, "fullName">;
  appointment?: Pick<PrismaAppointment, "scheduledAt"> | null;
  items: PrismaInvoiceItem[];
}

export const mapInvoice = (invoice: InvoiceWithRelations): Invoice => ({
  id: invoice.id,
  patientId: invoice.patientId,
  appointmentId: invoice.appointmentId,
  status: invoice.status,
  totalCost: invoice.totalCost,
  paymentMethod: invoice.paymentMethod,
  paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
  createdAt: invoice.createdAt.toISOString(),
  updatedAt: invoice.updatedAt.toISOString(),
  patientName: invoice.patient?.fullName,
  appointmentScheduledAt: invoice.appointment?.scheduledAt
    ? invoice.appointment.scheduledAt.toISOString()
    : null,
  items: invoice.items.map(mapInvoiceItem)
});
