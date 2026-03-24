export interface Camp {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  capacity: number;
  isActive: boolean;
}

export interface CampsResponse {
  camps: Camp[];
}

export interface CampResponse {
  camp: Camp;
}

export interface RegistrationInput {
  fullName: string;
  age: number;
  contactNumber: string;
  campId: number;
}

export interface RegistrationRecord {
  id: number;
  fullName: string;
  age: number;
  contactNumber: string;
  campId: number;
  createdAt: string;
}

export interface RegistrationResponse {
  message: string;
  registration: RegistrationRecord;
}

export interface AuthResult {
  authenticated: boolean;
  adminUsername?: string;
}

export interface AuthStatusResponse {
  auth: AuthResult;
}

export interface AdminRegistrationRecord extends RegistrationRecord {
  campName: string;
  campDate: string;
  campLocation: string;
}

export interface AdminRegistrationsResponse {
  registrations: AdminRegistrationRecord[];
}

export interface ApiErrorResponse {
  message: string;
  details?: string[];
}
