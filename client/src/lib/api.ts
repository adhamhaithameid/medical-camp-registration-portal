import type {
  AppointmentInput,
  AppointmentResponse,
  AppointmentsResponse,
  AuthResult,
  AuthStatusResponse,
  BillingCalculateInput,
  BillingTotalResponse,
  CancelAppointmentInput,
  DoctorInput,
  DoctorResponse,
  DoctorsResponse,
  GenerateInvoiceInput,
  InvoiceResponse,
  InvoicesResponse,
  LoginInput,
  PatientHistoryResponse,
  PatientInput,
  PatientResponse,
  PatientsResponse,
  ProcessPaymentInput,
  RegisterInput,
  RescheduleAppointmentInput
} from "@medical-camp/shared";

const API_BASE_URL = "/api";

const getErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    return payload.message ?? "Request failed";
  } catch {
    return "Request failed";
  }
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers ?? {});

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as T;
};

export const api = {
  register: (payload: RegisterInput) =>
    request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload: LoginInput) =>
    request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () =>
    request<AuthResult>("/auth/logout", {
      method: "POST"
    }),
  getAuthStatus: async () => {
    const payload = await request<AuthStatusResponse>("/auth/status");
    return payload.auth;
  },

  getPatients: (includeDeleted = false) =>
    request<PatientsResponse>(`/patients${includeDeleted ? "?includeDeleted=true" : ""}`),
  createPatient: (payload: PatientInput) =>
    request<PatientResponse>("/patients", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updatePatient: (id: number, payload: Partial<PatientInput>) =>
    request<PatientResponse>(`/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deletePatient: (id: number) =>
    request<PatientResponse>(`/patients/${id}`, {
      method: "DELETE"
    }),
  getPatientHistory: (id: number) => request<PatientHistoryResponse>(`/patients/${id}/history`),

  getDoctors: () => request<DoctorsResponse>("/doctors"),
  createDoctor: (payload: DoctorInput) =>
    request<DoctorResponse>("/doctors", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getDoctorById: (id: number) => request<DoctorResponse>(`/doctors/${id}`),
  updateDoctorSpecialization: (id: number, specialization: string) =>
    request<DoctorResponse>(`/doctors/${id}/specialization`, {
      method: "PATCH",
      body: JSON.stringify({ specialization })
    }),
  updateDoctorSchedule: (id: number, schedule: string) =>
    request<DoctorResponse>(`/doctors/${id}/schedule`, {
      method: "PATCH",
      body: JSON.stringify({ schedule })
    }),

  getAppointments: (params?: { patientId?: number; doctorId?: number; status?: string }) => {
    const query = new URLSearchParams();

    if (params?.patientId) {
      query.set("patientId", String(params.patientId));
    }

    if (params?.doctorId) {
      query.set("doctorId", String(params.doctorId));
    }

    if (params?.status) {
      query.set("status", params.status);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<AppointmentsResponse>(`/appointments${suffix}`);
  },
  bookAppointment: (payload: AppointmentInput) =>
    request<AppointmentResponse>("/appointments", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  cancelAppointment: (id: number, payload: CancelAppointmentInput) =>
    request<AppointmentResponse>(`/appointments/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  rescheduleAppointment: (id: number, payload: RescheduleAppointmentInput) =>
    request<AppointmentResponse>(`/appointments/${id}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),

  calculateBilling: (payload: BillingCalculateInput) =>
    request<BillingTotalResponse>("/billing/calculate", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  generateInvoice: (payload: GenerateInvoiceInput) =>
    request<InvoiceResponse>("/billing/invoices", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  processPayment: (id: number, payload: ProcessPaymentInput) =>
    request<InvoiceResponse>(`/billing/invoices/${id}/pay`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getBillingHistory: (patientId?: number) =>
    request<InvoicesResponse>(`/billing/history${patientId ? `?patientId=${patientId}` : ""}`)
};
