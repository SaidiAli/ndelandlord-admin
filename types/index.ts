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

// Simplified property types - just residential or commercial
export const propertyTypes = ['residential', 'commercial'] as const;
export type PropertyType = typeof propertyTypes[number];

// Unit type enums for residential and commercial
export const residentialUnitTypes = ['apartment', 'studio', 'house', 'condo', 'townhouse', 'duplex', 'room', 'other'] as const;
export type ResidentialUnitType = typeof residentialUnitTypes[number];

export const commercialUnitTypes = ['office', 'retail', 'warehouse', 'restaurant', 'medical', 'industrial', 'flex_space', 'coworking', 'other'] as const;
export type CommercialUnitType = typeof commercialUnitTypes[number];

// Amenity types
export type AmenityType = 'residential' | 'commercial' | 'common';

export interface Amenity {
  id: string;
  name: string;
  type?: AmenityType;
}

// Unit detail interfaces
export interface ResidentialUnitDetails {
  id: string;
  unitId: string;
  unitType: ResidentialUnitType;
  bedrooms: number;
  bathrooms: number;
  hasBalcony?: boolean;
  floorNumber?: number;
  isFurnished?: boolean;
}

export interface CommercialUnitDetails {
  id: string;
  unitId: string;
  unitType: CommercialUnitType;
  floorNumber?: number;
  suiteNumber?: string;
  ceilingHeight?: number;
  maxOccupancy?: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  type: typeof propertyTypes[number];
  numberOfUnits: number;
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
  propertyType?: PropertyType;
  squareFeet?: number;
  monthlyRent: number;
  deposit: number;
  isAvailable: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  leases?: Lease[];
  amenities?: Amenity[];
  details?: ResidentialUnitDetails | CommercialUnitDetails;
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

const leaseStatuses = ['draft', 'active', 'expiring', 'expired', 'terminated'] as const;
export type LeaseStatus = typeof leaseStatuses[number];

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  deposit: number;
  paymentDay: number;
  status: LeaseStatus;
  terms?: string;
  previousLeaseId?: string; // For lease renewals
  balance?: number; // Current outstanding balance
  createdAt: string;
  updatedAt: string;
  unit?: Unit;
  tenant?: User;
  payments?: Payment[];
  paymentSchedules?: PaymentSchedule[];
}

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
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
  appliedSchedules?: Array<{
    scheduleId: string;
    paymentNumber: number;
    amountApplied: number;
    scheduledAmount: number;
    period: string;
  }>;
  paymentNumber?: number | null;
  periodCovered?: string | null;
}

export interface PaymentSchedule {
  id: string;
  leaseId: string;
  paymentNumber: number;
  dueDate: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  lease?: Lease;
  // Many-to-many: schedule can have multiple payments
  payments?: Payment[];
  status?: 'paid' | 'pending' | 'overdue' | 'upcoming' | 'partial';
  paidAmount?: number; // Calculated from junction table
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
    endDate: Date | string | null;
    monthlyRent: string;
    deposit: string;
    paymentDay: number;
    status: 'draft' | 'active' | 'expiring' | 'expired' | 'terminated';
    terms?: string;
    previousLeaseId?: string;
    balance?: number;
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
    propertyType?: PropertyType;
    squareFeet?: number;
    monthlyRent?: string;
    deposit?: string;
    isAvailable?: boolean;
    description?: string;
    details?: ResidentialUnitDetails | CommercialUnitDetails;
  };
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    postalCode?: string;
    type: typeof propertyTypes[number];
    numberOfUnits: number;
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
    endDate: lease.endDate ? (typeof lease.endDate === 'string' ? lease.endDate : lease.endDate.toISOString()) : null,
    monthlyRent: parseFloat(lease.monthlyRent),
    deposit: parseFloat(lease.deposit),
    paymentDay: lease.paymentDay,
    status: lease.status,
    terms: lease.terms,
    previousLeaseId: lease.previousLeaseId,
    balance: lease.balance,
    createdAt: typeof lease.createdAt === 'string' ? lease.createdAt : lease.createdAt.toISOString(),
    updatedAt: lease.updatedAt ?
      (typeof lease.updatedAt === 'string' ? lease.updatedAt : lease.updatedAt.toISOString()) :
      (typeof lease.createdAt === 'string' ? lease.createdAt : lease.createdAt.toISOString()),
    unit: unit ? {
      id: unit.id,
      propertyId: property?.id || '',
      unitNumber: unit.unitNumber,
      propertyType: unit.propertyType,
      squareFeet: unit.squareFeet,
      monthlyRent: unit.monthlyRent ? parseFloat(unit.monthlyRent) : 0,
      deposit: unit.deposit ? parseFloat(unit.deposit) : 0,
      isAvailable: unit.isAvailable || false,
      description: unit.description,
      details: unit.details,
      createdAt: '',
      updatedAt: '',
      property: property ? {
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        zipCode: property.postalCode || '',
        type: property.type,
        numberOfUnits: property.numberOfUnits,
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

// Lease Management Types
export interface LeaseBalance {
  totalOwed: number;
  totalPaid: number;
  currentBalance: number;
  overdueAmount: number;
  nextPaymentDue?: PaymentSchedule;
}

export interface LeaseRenewalRequest {
  leaseId: string;
  newStartDate: string;
  newEndDate: string;
  newMonthlyRent: number;
  newPaymentDay?: number;
  terms?: string;
}

export interface LeaseActivationRequest {
  leaseId: string;
  paymentDay: number;
}

// Dashboard Analytics Types
export interface LeaseAnalytics {
  totalLeases: number;
  activeLeases: number;
  expiringLeases: number; // Expiring in next 30 days
  draftLeases: number;
  leasesByStatus: Array<{
    status: string;
    count: number;
  }>;
  avgLeaseLength: number; // In months
  renewalRate: number; // Percentage
}

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  averagePaymentTime: number;
  paymentsByStatus: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
  paymentsByProvider: Array<{
    provider: string;
    count: number;
    amount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
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
  monthlyTrends: { month: string; amount: number; count: number; }[];
}

export interface TenantWithFullDetails {
  tenant: {
    id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
    createdAt: string;
  };
  leases: Array<{
    lease: {
      id: string;
      status: string;
      startDate: string;
      endDate: string;
      monthlyRent: string;
    };
    unit: {
      id: string;
      unitNumber: string;
    };
    property: {
      id: string;
      name: string;
    };
  }>;
  paymentSummary: {
    totalPaid: number;
    outstandingBalance: number;
    lastPaymentDate?: string;
    paymentStatus: 'current' | 'overdue' | 'advance';
  };
}

// Property Details API Response Types (from /properties/{id}/details endpoint)
export interface PropertyDashboardData {
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    type: typeof propertyTypes[number];
    numberOfUnits: number;
    postalCode?: string;
    description?: string;
    landlordId: string;
    createdAt: string;
    updatedAt: string;
    units: Array<{
      unit: {
        id: string;
        unitNumber: string;
        propertyType?: PropertyType;
        squareFeet?: number;
        monthlyRent: string;
        deposit: string;
        isAvailable: boolean;
        description?: string;
        details?: ResidentialUnitDetails | CommercialUnitDetails;
      };
      lease?: {
        id: string;
        status: string;
        monthlyRent: string;
        startDate: string;
        endDate: string;
      };
      tenant?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
      };
    }>;
  };
  stats: {
    totalUnits: number;
    occupiedUnits: number;
    availableUnits: number;
    monthlyRevenue: number;
    occupancyRate: number;
  };
  recentActivity: {
    newLeases: number;
    expiredLeases: number;
    maintenanceRequests: number;
  };
}

// Unit Details API Response Type (from /units/:id/details endpoint)
export interface UnitWithDetails {
  unit: {
    id: string;
    unitNumber: string;
    propertyType?: PropertyType;
    squareFeet?: number;
    monthlyRent: string;
    deposit: string;
    isAvailable: boolean;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  details?: ResidentialUnitDetails | CommercialUnitDetails;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode?: string;
    type?: PropertyType;
  };
  currentLease?: {
    id: string;
    startDate: string;
    endDate: string;
    monthlyRent: string;
    deposit: string;
    status: string;
    terms?: string;
  };
  currentTenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    userName?: string;
  };
  amenities?: Amenity[];
  leaseHistory: Array<{
    lease: {
      id: string;
      startDate: string;
      endDate: string;
      monthlyRent: string;
      status: string;
      createdAt: string;
    };
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  analytics: {
    occupancyRate: number;
    totalRevenue: number;
    averageLeaseLength: number;
    daysVacant: number;
  };
}

// Request types for type-specific unit API calls
export interface CreateResidentialUnitRequest {
  propertyId: string;
  unitNumber: string;
  squareFeet?: number;
  description?: string;
  amenityIds?: string[];
  unitType: ResidentialUnitType;
  bedrooms: number;
  bathrooms: number;
  hasBalcony?: boolean;
  floorNumber?: number;
  isFurnished?: boolean;
}

export interface CreateCommercialUnitRequest {
  propertyId: string;
  unitNumber: string;
  squareFeet?: number;
  description?: string;
  amenityIds?: string[];
  unitType: CommercialUnitType;
  floorNumber?: number;
  suiteNumber?: string;
  ceilingHeight?: number;
  maxOccupancy?: number;
}

export interface UpdateResidentialUnitRequest {
  unitNumber?: string;
  squareFeet?: number;
  isAvailable?: boolean;
  description?: string;
  amenityIds?: string[];
  unitType?: ResidentialUnitType;
  bedrooms?: number;
  bathrooms?: number;
  hasBalcony?: boolean;
  floorNumber?: number;
  isFurnished?: boolean;
}

export interface UpdateCommercialUnitRequest {
  unitNumber?: string;
  squareFeet?: number;
  isAvailable?: boolean;
  description?: string;
  amenityIds?: string[];
  unitType?: CommercialUnitType;
  floorNumber?: number;
  suiteNumber?: string;
  ceilingHeight?: number;
  maxOccupancy?: number;
}

export interface BulkCreateResidentialUnitsRequest {
  propertyId: string;
  units: Array<{
    unitNumber: string;
    squareFeet?: number;
    description?: string;
    unitType: ResidentialUnitType;
    bedrooms: number;
    bathrooms: number;
    hasBalcony?: boolean;
    floorNumber?: number;
    isFurnished?: boolean;
  }>;
}

export interface BulkCreateCommercialUnitsRequest {
  propertyId: string;
  units: Array<{
    unitNumber: string;
    squareFeet?: number;
    description?: string;
    unitType: CommercialUnitType;
    floorNumber?: number;
    suiteNumber?: string;
    ceilingHeight?: number;
    maxOccupancy?: number;
  }>;
}

// Wallet Types
export type WalletTransactionType = 'deposit' | 'withdrawal' | 'adjustment';
export type WalletTransactionStatus = 'pending' | 'completed' | 'failed';
export type MobileMoneyProvider = 'mtn' | 'airtel';
export type WithdrawalDestinationType = 'mobile_money' | 'bank_account';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  status: WalletTransactionStatus;
  description: string | null;
  createdAt: string;
  paymentId?: string | null;
  destinationType?: string | null;
  gatewayReference?: string | null;
}

export interface WalletSummary {
  walletId: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  recentTransactions: WalletTransaction[];
}

export interface WalletBalance {
  balance: number;
}

export interface WithdrawalRequest {
  amount: number;
  destinationType: WithdrawalDestinationType;
  provider?: MobileMoneyProvider;
  phoneNumber?: string;
  bankId?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface WithdrawalResponse {
  transactionId: string;
  gatewayReference?: string;
  status: 'pending' | 'completed' | 'failed';
  message: string;
}

export interface WalletTransactionFilters {
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
  limit?: number;
  offset?: number;
}