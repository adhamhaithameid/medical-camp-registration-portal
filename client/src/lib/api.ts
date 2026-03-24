import type {
  AdminRegistrationsResponse,
  AuthResult,
  AuthStatusResponse,
  CampInput,
  CampResponse,
  CampsResponse,
  CreateAdminUserInput,
  LoginInput,
  RegistrationInput,
  RegistrationLookupResponse,
  RegistrationResponse,
  RegistrationUpdateInput,
  UpdateAdminUserInput
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

const requestText = async (path: string, init: RequestInit = {}): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
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

  getAdminUsers: () => request<{ users: Array<Record<string, unknown>> }>("/admin/users"),
  createAdminUser: (payload: CreateAdminUserInput) =>
    request<{ user: Record<string, unknown> }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateAdminUser: (id: number, payload: UpdateAdminUserInput) =>
    request<{ user: Record<string, unknown> }>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    })
};
