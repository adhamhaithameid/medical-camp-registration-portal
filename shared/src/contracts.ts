export type UserRole = "ADMIN" | "STAFF" | "RECEPTIONIST";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthUser;
}

export interface AuthStatusResponse {
  auth: AuthResult;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Patient {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string;
  medicalHistory?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientInput {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string;
  medicalHistory?: string;
}

export interface Doctor {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  schedule: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorInput {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  schedule: string;
}

export type AppointmentStatus = "BOOKED" | "CANCELLED" | "RESCHEDULED" | "COMPLETED";

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  scheduledAt: string;
  status: AppointmentStatus;
  reason?: string | null;
  cancelReason?: string | null;
  rescheduleReason?: string | null;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  doctorName?: string;
  doctorSpecialization?: string;
}

export interface AppointmentInput {
  patientId: number;
  doctorId: number;
  scheduledAt: string;
  reason?: string;
}

export interface RescheduleAppointmentInput {
  scheduledAt: string;
  reason?: string;
}

export interface CancelAppointmentInput {
  reason?: string;
}

export type InvoiceStatus = "UNPAID" | "PAID";

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: number;
  patientId: number;
  appointmentId?: number | null;
  status: InvoiceStatus;
  totalCost: number;
  paymentMethod?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  appointmentScheduledAt?: string | null;
  items: InvoiceItem[];
}

export interface GenerateInvoiceInput {
  patientId: number;
  appointmentId?: number;
  items: InvoiceItemInput[];
}

export interface BillingCalculateInput {
  items: InvoiceItemInput[];
}

export interface ProcessPaymentInput {
  paymentMethod: string;
}

export interface PatientsResponse {
  patients: Patient[];
}

export interface PatientResponse {
  patient: Patient;
}

export interface PatientHistoryResponse {
  patient: Patient;
  appointments: Appointment[];
  invoices: Invoice[];
}

export interface DoctorsResponse {
  doctors: Doctor[];
}

export interface DoctorResponse {
  doctor: Doctor;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
}

export interface AppointmentResponse {
  appointment: Appointment;
}

export interface InvoicesResponse {
  invoices: Invoice[];
}

export interface InvoiceResponse {
  invoice: Invoice;
}

export interface BillingTotalResponse {
  totalCost: number;
}

export interface ApiErrorResponse {
  message: string;
  details?: string[];
}
