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

// Backend API Response Types (raw response structure from server)
export interface LeaseApiResponse {
  lease: {
    id: string;
    startDate: Date | string;
    endDate: Date | string;
    monthlyRent: string; // Backend stores as decimal string
    deposit: string; // Backend stores as decimal string
    status: 'draft' | 'active' | 'expired' | 'terminated';
    terms?: string;
    createdAt: Date | string;
    updatedAt?: Date | string;
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    userName?: string;
    isActive?: boolean;
  };
  unit?: {
    id: string;
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet?: number;
    monthlyRent?: string;
    deposit?: string;
    isAvailable?: boolean;
    description?: string;
  };
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode?: string;
    description?: string;
  };
  landlord?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
  };
}

// Transformation utility to convert backend response to frontend Lease type
export function transformLeaseResponse(response: LeaseApiResponse): Lease {
  const { lease, tenant, unit, property, landlord } = response;
  
  return {
    id: lease.id,
    unitId: unit?.id || '',
    tenantId: tenant?.id || '',
    startDate: typeof lease.startDate === 'string' ? lease.startDate : lease.startDate.toISOString(),
    endDate: typeof lease.endDate === 'string' ? lease.endDate : lease.endDate.toISOString(),
    monthlyRent: parseFloat(lease.monthlyRent),
    deposit: parseFloat(lease.deposit),
    status: lease.status,
    terms: lease.terms,
    createdAt: typeof lease.createdAt === 'string' ? lease.createdAt : lease.createdAt.toISOString(),
    updatedAt: lease.updatedAt ? 
      (typeof lease.updatedAt === 'string' ? lease.updatedAt : lease.updatedAt.toISOString()) : 
      (typeof lease.createdAt === 'string' ? lease.createdAt : lease.createdAt.toISOString()),
    unit: unit ? {
      id: unit.id,
      propertyId: property?.id || '',
      unitNumber: unit.unitNumber,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      squareFeet: unit.squareFeet,
      monthlyRent: unit.monthlyRent ? parseFloat(unit.monthlyRent) : 0,
      deposit: unit.deposit ? parseFloat(unit.deposit) : 0,
      isAvailable: unit.isAvailable || false,
      description: unit.description,
      createdAt: '',
      updatedAt: '',
      property: property ? {
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.postalCode || '',
        description: property.description,
        landlordId: landlord?.id || '',
        createdAt: '',
        updatedAt: '',
      } : undefined,
    } : undefined,
    tenant: tenant ? {
      id: tenant.id,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
      role: 'tenant' as const,
      userName: tenant.userName || tenant.email,
      isActive: tenant.isActive ?? true,
      createdAt: '',
      updatedAt: '',
    } : undefined,
  };
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