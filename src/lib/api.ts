import { getApiUrl, getAuthHeaders } from '../app/context/AuthContext';
import { handleApiError } from './error-handler';

const API_URL = getApiUrl();

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      data?.error || data?.message || `Lỗi máy chủ (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export const api = {
  get<T = any>(endpoint: string) {
    return request<T>(endpoint, { method: 'GET' });
  },

  post<T = any>(endpoint: string, body?: any) {
    return request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put<T = any>(endpoint: string, body?: any) {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patch<T = any>(endpoint: string, body?: any) {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete<T = any>(endpoint: string) {
    return request<T>(endpoint, { method: 'DELETE' });
  },

  upload<T = any>(endpoint: string, formData: FormData) {
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  },
};

export async function apiWithError<T>(
  endpoint: string,
  options?: { method?: string; body?: any; headers?: Record<string, string> }
): Promise<T | null> {
  try {
    return await api.post<T>(endpoint, options?.body);
  } catch (error) {
    handleApiError(error);
    return null;
  }
}
