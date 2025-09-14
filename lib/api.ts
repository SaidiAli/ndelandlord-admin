import axios, { AxiosError, AxiosResponse } from 'axios';
import { authStorage } from './auth';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
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
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // Transform username to userName for backend compatibility
    const requestData = {
      userName: credentials.username,
      password: credentials.password,
    };
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', requestData);
    return response.data.data!;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    // Transform username to userName for backend compatibility
    const requestData = {
      userName: userData.username,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role,
    };
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', requestData);
    return response.data.data!;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },
};

// Properties API functions
export const propertiesApi = {
  getAll: async () => {
    const response = await api.get('/properties');
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
    const response = await api.get('/units');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/units/${id}`);
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
    const response = await api.get('/leases');
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
    const response = await api.get('/payments');
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
    const response = await api.get(`/payments/analytics?${params.toString()}`);
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

export default api;