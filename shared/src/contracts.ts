export type AdminRole = "SUPER_ADMIN" | "STAFF";
export type RegistrationStatus = "CONFIRMED" | "WAITLISTED" | "CANCELLED";
export type NotificationChannel = "EMAIL" | "SMS";
export type NotificationEvent =
  | "REGISTERED"
  | "UPDATED"
  | "CANCELLED"
  | "PROMOTED"
  | "WAITLISTED";

export interface Camp {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  capacity: number;
  isActive: boolean;
  confirmedCount: number;
  waitlistCount: number;
  remainingSeats: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampInput {
  name: string;
  date: string;
  location: string;
  description: string;
  capacity: number;
  isActive?: boolean;
}

export interface RegistrationInput {
  fullName: string;
  age: number;
  contactNumber: string;
  email?: string;
  campId: number;
}

export interface RegistrationUpdateInput {
  fullName?: string;
  age?: number;
  contactNumber?: string;
  email?: string | null;
}

export interface RegistrationRecord {
  id: number;
  fullName: string;
  age: number;
  contactNumber: string;
  email?: string | null;
  campId: number;
  campName?: string;
  campDate?: string;
  status: RegistrationStatus;
  confirmationCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
}

export interface AuthUser {
  id: number;
  username: string;
  role: AdminRole;
}

export interface AuthResult {
  authenticated: boolean;
  adminUsername?: string;
  role?: AdminRole;
  user?: AuthUser;
}

export interface AuthStatusResponse {
  auth: AuthResult;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AdminUser {
  id: number;
  username: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUserInput {
  username: string;
  password: string;
  role: AdminRole;
}

export interface UpdateAdminUserInput {
  role?: AdminRole;
  isActive?: boolean;
  password?: string;
}

export interface NotificationLogRecord {
  id: number;
  registrationId: number;
  channel: NotificationChannel;
  event: NotificationEvent;
  destination?: string | null;
  status: "SENT" | "FAILED" | "SKIPPED";
  message: string;
  errorMessage?: string | null;
  createdAt: string;
}

export interface CampsResponse {
  camps: Camp[];
}

export interface CampResponse {
  camp: Camp;
}

export interface RegistrationResponse {
  registration: RegistrationRecord;
}

export interface RegistrationLookupResponse {
  registration: RegistrationRecord;
  camp: Camp;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminRegistrationsResponse {
  registrations: RegistrationRecord[];
  meta: PaginatedMeta;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface AdminUserResponse {
  user: AdminUser;
}

export interface NotificationLogsResponse {
  notifications: NotificationLogRecord[];
}

export interface ApiErrorResponse {
  message: string;
  details?: string[];
}
