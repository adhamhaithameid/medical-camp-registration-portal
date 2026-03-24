import type {
  AdminRegistrationsResponse,
  AuthResult,
  AuthStatusResponse,
  CampResponse,
  CampsResponse,
  RegistrationInput,
  RegistrationResponse
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
  getCamps: () => request<CampsResponse>("/camps"),
  getCampById: (campId: number) => request<CampResponse>(`/camps/${campId}`),
  submitRegistration: (payload: RegistrationInput) =>
    request<RegistrationResponse>("/registrations", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (username: string, password: string) =>
    request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    }),
  logout: () =>
    request<AuthResult>("/auth/logout", {
      method: "POST"
    }),
  getAuthStatus: async () => {
    const payload = await request<AuthStatusResponse>("/auth/status");
    return payload.auth;
  },
  getAdminRegistrations: () =>
    request<AdminRegistrationsResponse>("/admin/registrations")
};
