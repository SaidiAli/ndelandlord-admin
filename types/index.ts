// Shared types with backend
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'landlord' | 'tenant';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description?: string;
  landlordId: string;
  createdAt: string;
  updatedAt: string;
  landlord?: User;
  units?: Unit[];
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  monthlyRent: number;
  deposit: number;
  isAvailable: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  leases?: Lease[];
}

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  terms?: string;
  createdAt: string;
  updatedAt: string;
  unit?: Unit;
  tenant?: User;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lease?: Lease;
}

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  tenantId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'in_progress' | 'completed' | 'cancelled';
  submittedAt: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  unit?: Unit;
  tenant?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'landlord' | 'tenant';
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  totalRevenue: number;
  pendingMaintenance: number;
  recentPayments: Payment[];
  recentMaintenanceRequests: MaintenanceRequest[];
}