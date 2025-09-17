// Shared types with backend
export interface User {
  id: string;
  userName: string;
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
  currentLease?: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  currentTenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
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
  dueDate?: string;
  paidDate?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  mobileMoneyProvider?: 'mtn' | 'airtel' | 'm-sente';
  phoneNumber?: string;
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

// Payment specific types
export interface PaymentInitiateRequest {
  leaseId: string;
  amount: number;
  phoneNumber: string;
  provider: string;
}

export interface PaymentBalance {
  leaseId: string;
  outstandingAmount: number;
  monthlyRent: number;
  totalPaid: number;
  lastPaymentDate?: string;
}

export interface PaymentReceipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  amount: number;
  paidDate: string;
  tenant: {
    name: string;
    email: string;
  };
  property: {
    name: string;
    address: string;
  };
  unit: {
    unitNumber: string;
  };
  transactionId: string;
  paymentMethod: string;
}

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  averagePaymentTime: number;
  paymentsByStatus: {
    status: string;
    count: number;
    amount: number;
  }[];
  paymentsByProvider: {
    provider: string;
    count: number;
    amount: number;
  }[];
  monthlyTrends: {
    month: string;
    totalPayments: number;
    totalAmount: number;
  }[];
}