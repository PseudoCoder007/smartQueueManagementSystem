export type UserRole = 'USER' | 'ADMIN';
export type ServiceStatus = 'ACTIVE' | 'INACTIVE';
export type TokenStatus = 'WAITING' | 'CALLED' | 'SERVING' | 'SKIPPED' | 'COMPLETED' | 'CANCELLED';
export type PriorityType = 'NORMAL' | 'SENIOR_CITIZEN' | 'EMERGENCY' | 'VIP' | 'ADMIN_MARKED';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface AuthResponse extends UserProfile {
  appToken: string;
}

export interface AdminLoginResponse {
  token: string;
  role: 'ADMIN';
  user: UserProfile;
}

export interface ServiceQueue {
  id: string;
  name: string;
  description?: string;
  averageServiceMinutes: number;
  status: ServiceStatus;
  queueOpen: boolean;
  currentToken?: number;
  queueLength: number;
  estimatedWaitMinutes: number;
}

export interface Token {
  id: string;
  tokenNumber: number;
  serviceId: string;
  serviceName: string;
  status: TokenStatus;
  priorityType: PriorityType;
  position?: number;
  estimatedWaitMinutes?: number;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface QueueState {
  serviceId: string;
  serviceName: string;
  open: boolean;
  currentServingToken?: number;
  queueLength: number;
  waiting: Token[];
  serving: Token[];
  skipped: Token[];
  completed: Token[];
  cancelled: Token[];
}

export interface OverviewStats {
  totalTokens: number;
  activeQueues: number;
  completedTokens: number;
  skippedTokens: number;
  cancelledTokens: number;
  averageWaitMinutes: number;
}

export interface DailyStats {
  services: Array<{ serviceId: string; serviceName: string; tokenCount: number; queueOpen: boolean }>;
}
