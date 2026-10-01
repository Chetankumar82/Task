import { getAuthToken } from './supabase';
import { Task, UserProfile, DashboardStats, TaskFormData, ApiResponse, SystemHealth } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (typeof window !== 'undefined') {
      const demoUserJson = localStorage.getItem('active_demo_user');
      if (demoUserJson) {
        try {
          const demoUser = JSON.parse(demoUserJson);
          headers['X-Mock-User-Id'] = demoUser.id;
        } catch {
          // ignore
        }
      }
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders();
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    };

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // non-JSON response
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Health and System Diagnostics
  async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/api/health');
  }

  // Statistics
  async getStats(): Promise<DashboardStats> {
    const res = await this.request<ApiResponse<DashboardStats>>('/api/stats');
    return res.data;
  }

  // Users for Task Assignment
  async getUsers(): Promise<UserProfile[]> {
    const res = await this.request<ApiResponse<UserProfile[]>>('/api/users');
    return res.data;
  }

  async getCurrentProfile(): Promise<UserProfile> {
    const res = await this.request<ApiResponse<UserProfile>>('/api/users/me');
    return res.data;
  }

  async syncUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await this.request<ApiResponse<UserProfile>>('/api/users/sync', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    return res.data;
  }

  // Tasks CRUD
  async getTasks(params?: {
    status?: string;
    priority?: string;
    filter?: string;
    search?: string;
  }): Promise<Task[]> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.priority && params.priority !== 'all') searchParams.set('priority', params.priority);
    if (params?.filter && params.filter !== 'all') searchParams.set('filter', params.filter);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await this.request<ApiResponse<Task[]>>(`/api/tasks${query}`);
    return res.data;
  }

  async getTask(id: string): Promise<Task> {
    const res = await this.request<ApiResponse<Task>>(`/api/tasks/${id}`);
    return res.data;
  }

  async createTask(data: TaskFormData): Promise<Task> {
    const res = await this.request<ApiResponse<Task>>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await this.request<ApiResponse<Task>>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  }

  async deleteTask(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }
}

export const api = new ApiClient();
