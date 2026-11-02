export type PlatformRole = 'SUPER_ADMIN' | 'USER';
export type StaffRole = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'TRAINER';
export type GymStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type MembershipStatus =
  | 'REQUESTED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'SUSPENDED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'CANCELLED'
  | 'CORRECTED';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: PlatformRole;
  staffAssignments: Array<{
    gymId: string;
    role: StaffRole;
    gymSlug?: string;
    gymName?: string;
  }>;
}

export interface JwtPayload {
  sub: string;
  email: string;
  platformRole: PlatformRole;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface HealthResponse {
  status: 'ok';
  service: 'gymverse-api';
  timestamp: string;
}

export interface DashboardKpis {
  activeMembers: number;
  checkInsToday: number;
  revenueThisMonth: number;
  expiringSoon: number;
  outstandingDues: number;
}

export const STAFF_ROLES: StaffRole[] = [
  'OWNER',
  'MANAGER',
  'RECEPTIONIST',
  'TRAINER',
];

export const MANAGER_PLUS: StaffRole[] = ['OWNER', 'MANAGER'];
export const DESK_ROLES: StaffRole[] = [
  'OWNER',
  'MANAGER',
  'RECEPTIONIST',
];
