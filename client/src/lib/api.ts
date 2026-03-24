import type {
  AdminRegistrationsResponse,
  AdminUser,
  AdminUserResponse,
  AdminUsersResponse,
  AuthResult,
  AuthStatusResponse,
  CampInput,
  CampResponse,
  CampsResponse,
  CreateAdminUserInput,
  DoctorInput,
  DoctorResponse,
  DoctorsResponse,
  LoginInput,
  PatientInput,
  PatientResponse,
  PatientsResponse,
  RegistrationInput,
  RegistrationLookupResponse,
  RegistrationResponse,
  RegistrationUpdateInput,
  UpdateAdminUserInput
} from "@medical-camp/shared";

const API_BASE_URL = "/api";

interface ApiErrorPayload {
  message?: unknown;
  details?: unknown;
}

class ApiError extends Error {
  readonly status?: number;
  readonly method: string;
  readonly path: string;
  readonly category: "http" | "network" | "unknown";

  constructor(params: {
    message: string;
    method: string;
    path: string;
    status?: number;
    category?: "http" | "network" | "unknown";
  }) {
    super(params.message);
    this.name = "ApiError";
    this.method = params.method;
    this.path = params.path;
    this.status = params.status;
    this.category = params.category ?? "unknown";
  }
}

const toTitle = (value: string) =>
  value
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toDetails = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const getStatusHint = (status: number) => {
  switch (status) {
    case 400:
      return "Invalid request payload. Check the highlighted form fields.";
    case 401:
      return "Authentication failed or session expired. Login again and retry.";
    case 403:
      return "Your account does not have permission for this operation.";
    case 404:
      return "Requested resource was not found.";
    case 409:
      return "Operation conflicts with current data state (duplicate or rule violation).";
    case 429:
      return "Too many requests. Wait a moment before retrying.";
    default:
      if (status >= 500) {
        return "Server-side error. Check backend logs and API health endpoint.";
      }
      return null;
  }
};

const buildHttpError = async (response: Response, method: string, path: string) => {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  const baseMessage =
    typeof payload?.message === "string" && payload.message.trim()
      ? payload.message.trim()
      : "Request failed";
  const details = toDetails(payload?.details);
  const hint = getStatusHint(response.status);
  const context = `${method.toUpperCase()} ${API_BASE_URL}${path}`;
  const statusLabel = `${response.status} ${toTitle(response.statusText || "Error")}`;
  const detailSuffix = details.length > 0 ? ` Details: ${details.join(" | ")}.` : "";
  const hintSuffix = hint ? ` Hint: ${hint}` : "";

  return new ApiError({
    message: `${baseMessage} (${statusLabel}, ${context}).${detailSuffix}${hintSuffix}`,
    method,
    path,
    status: response.status,
    category: "http"
  });
};

const buildNetworkError = (error: unknown, method: string, path: string) => {
  const context = `${method.toUpperCase()} ${API_BASE_URL}${path}`;
  const rawMessage =
    error instanceof Error && error.message.trim() ? error.message.trim() : "Network failure";
  const hint =
    "Verify backend is running on http://localhost:4000, frontend on http://localhost:5173, and CORS_ORIGIN includes your host.";

  return new ApiError({
    message: `${rawMessage} (${context}). Hint: ${hint}`,
    method,
    path,
    category: "network"
  });
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers ?? {});
  const method = String(init.method ?? "GET").toUpperCase();

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include"
    });
  } catch (error) {
    throw buildNetworkError(error, method, path);
  }

  if (!response.ok) {
    throw await buildHttpError(response, method, path);
  }

  return (await response.json()) as T;
};

const requestText = async (path: string, init: RequestInit = {}): Promise<string> => {
  const method = String(init.method ?? "GET").toUpperCase();
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include"
    });
  } catch (error) {
    throw buildNetworkError(error, method, path);
  }

  if (!response.ok) {
    throw await buildHttpError(response, method, path);
  }

  return response.text();
};

export interface AdminRegistrationsQuery {
  search?: string;
  campId?: number;
  status?: "CONFIRMED" | "WAITLISTED" | "CANCELLED";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "campDate" | "status" | "fullName";
  sortOrder?: "asc" | "desc";
}

const toQueryString = (query: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString();
  return suffix ? `?${suffix}` : "";
};

export const api = {
  getCamps: () => request<CampsResponse>("/camps"),
  getCampById: (id: number) => request<CampResponse>(`/camps/${id}`),

  createRegistration: (payload: RegistrationInput) =>
    request<RegistrationResponse>("/registrations", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  lookupRegistration: (confirmationCode: string) =>
    request<RegistrationLookupResponse>("/registrations/lookup", {
      method: "POST",
      body: JSON.stringify({ confirmationCode })
    }),
  getRegistrationByCode: (confirmationCode: string) =>
    request<RegistrationLookupResponse>(`/registrations/${encodeURIComponent(confirmationCode)}`),
  updateRegistration: (confirmationCode: string, payload: RegistrationUpdateInput) =>
    request<RegistrationResponse>(`/registrations/${encodeURIComponent(confirmationCode)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  cancelRegistration: (confirmationCode: string) =>
    request<RegistrationResponse>(`/registrations/${encodeURIComponent(confirmationCode)}`, {
      method: "DELETE"
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

  getAdminCamps: () => request<CampsResponse>("/admin/camps"),
  createCamp: (payload: CampInput) =>
    request<CampResponse>("/admin/camps", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateCamp: (id: number, payload: Partial<CampInput>) =>
    request<CampResponse>(`/admin/camps/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deactivateCamp: (id: number) =>
    request<CampResponse>(`/admin/camps/${id}/deactivate`, {
      method: "POST"
    }),

  getAdminRegistrations: (query: AdminRegistrationsQuery = {}) =>
    request<AdminRegistrationsResponse>(
      `/admin/registrations${toQueryString({
        search: query.search,
        campId: query.campId,
        status: query.status,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        page: query.page,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      })}`
    ),
  exportAdminRegistrationsCsv: (query: AdminRegistrationsQuery = {}) =>
    requestText(
      `/admin/registrations/export.csv${toQueryString({
        search: query.search,
        campId: query.campId,
        status: query.status,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo
      })}`
    ),
  promoteRegistration: (id: number) =>
    request<RegistrationResponse>(`/admin/registrations/${id}/promote`, {
      method: "PATCH"
    }),
  getRegistrationNotifications: (id: number) =>
    request<{ notifications: Array<Record<string, unknown>> }>(
      `/admin/registrations/${id}/notifications`
    ),

  getAdminUsers: () => request<AdminUsersResponse>("/admin/users"),
  getAdminUserById: (id: number) => request<AdminUserResponse>(`/admin/users/${id}`),
  createAdminUser: (payload: CreateAdminUserInput) =>
    request<AdminUserResponse>("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateAdminUser: (id: number, payload: UpdateAdminUserInput) =>
    request<AdminUserResponse>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deleteAdminUser: (id: number) =>
    request<AdminUserResponse>(`/admin/users/${id}`, {
      method: "DELETE"
    }),

  getPatients: (search?: string) =>
    request<PatientsResponse>(
      `/admin/patients${search ? toQueryString({ search }) : ""}`
    ),
  getPatientById: (id: number) => request<PatientResponse>(`/admin/patients/${id}`),
  createPatient: (payload: PatientInput) =>
    request<PatientResponse>("/admin/patients", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updatePatient: (id: number, payload: Partial<PatientInput>) =>
    request<PatientResponse>(`/admin/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deletePatient: (id: number) =>
    request<PatientResponse>(`/admin/patients/${id}`, {
      method: "DELETE"
    }),

  getDoctors: (search?: string) =>
    request<DoctorsResponse>(
      `/admin/doctors${search ? toQueryString({ search }) : ""}`
    ),
  getDoctorById: (id: number) => request<DoctorResponse>(`/admin/doctors/${id}`),
  createDoctor: (payload: DoctorInput) =>
    request<DoctorResponse>("/admin/doctors", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateDoctor: (id: number, payload: Partial<DoctorInput>) =>
    request<DoctorResponse>(`/admin/doctors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deleteDoctor: (id: number) =>
    request<DoctorResponse>(`/admin/doctors/${id}`, {
      method: "DELETE"
    })
};
