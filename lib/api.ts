import axios, { AxiosError, AxiosResponse } from 'axios';
import { authStorage } from './auth';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      authStorage.clear();
      // Only redirect if not already on login page to prevent refresh during login attempts
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const usersApi = {
  createWithLease: async (data: any) => {
    // Use landlord-specific tenant creation endpoint
    const response = await api.post('/landlords/tenants/create-with-lease', data);
    return response.data;
  },
};

// Tenants API functions  
export const tenantsApi = {
  getAll: async () => {
    // Get all tenants for the current landlord
    const response = await api.get('/landlords/tenants');
    return response.data;
  },
};

// Auth API functions
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data!;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    return response.data.data!;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },
  
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/users/profile', data);
    return response.data.data!;
  },
};

// Properties API functions
export const propertiesApi = {
  getAll: async () => {
    // Add timestamp to prevent caching issues between different users
    const response = await api.get(`/properties?_t=${Date.now()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/properties', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/properties/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },
};

// Units API functions
export const unitsApi = {
  getAll: async () => {
    // Use landlord-specific endpoint to ensure ownership filtering
    const response = await api.get('/landlords/units');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/units/${id}`);
    return response.data;
  },

  getAvailable: async () => {
    // Use landlord-specific endpoint for available units
    const response = await api.get('/landlords/units/available');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/units', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/units/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/units/${id}`);
    return response.data;
  },
};

// Leases API functions
export const leasesApi = {
  getAll: async () => {
    // Use landlord-specific endpoint to ensure ownership filtering
    const response = await api.get('/landlords/leases');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/leases/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/leases', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/leases/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/leases/${id}`);
    return response.data;
  },
};

// Payments API functions
export const paymentsApi = {
  getAll: async () => {
    // Use landlord-specific endpoint to ensure ownership filtering
    const response = await api.get('/landlords/payments');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  },

  initiate: async (data: { leaseId: string; amount: number; phoneNumber: string; provider: string }) => {
    const response = await api.post('/payments/initiate', data);
    return response.data;
  },

  getStatus: async (paymentId: string) => {
    const response = await api.get(`/payments/status/${paymentId}`);
    return response.data;
  },

  getLeaseBalance: async (leaseId: string) => {
    const response = await api.get(`/payments/lease/${leaseId}/balance`);
    return response.data;
  },

  getReceipt: async (paymentId: string) => {
    const response = await api.get(`/payments/${paymentId}/receipt`);
    return response.data;
  },

  getByLease: async (leaseId: string) => {
    const response = await api.get(`/payments?leaseId=${leaseId}`);
    return response.data;
  },

  getAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    // Use landlord-specific endpoint for payment analytics
    const response = await api.get(`/landlords/payments/analytics?${params.toString()}`);
    return response.data;
  },
};

// Maintenance API functions
export const maintenanceApi = {
  getAll: async () => {
    const response = await api.get('/maintenance');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/maintenance/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/maintenance/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/maintenance/${id}`);
    return response.data;
  },
};

export const landlordApi = {
  getDashboardData: async () => {
    const response = await api.get('/landlords/dashboard/complete');
    return response.data;
  },
};

export default api;