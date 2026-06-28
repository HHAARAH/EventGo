// Dev: Vite proxy forwards /api → localhost:8000
// Prod: set VITE_API_BASE to your deployed backend URL
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(`API Error ${status}`);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('eventgo-token');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('eventgo-token');
    localStorage.removeItem('eventgo-user');
    throw new ApiError(401, 'Unauthorized');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data.detail || data);
  }

  return data as T;
}

// ===== Auth API =====
export const authApi = {
  login: (body: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: import('../types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body: { name: string; email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: import('../types').User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<import('../types').User>('/auth/me'),

  updateMe: (body: { name?: string; avatar_url?: string }) =>
    request<import('../types').User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};

// ===== Events API =====
export const eventsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').PaginatedResponse<import('../types').Event>>(`/events${qs}`);
  },

  detail: (id: number) => request<import('../types').Event>(`/events/${id}`),

  create: (body: import('../types').EventInput) =>
    request<import('../types').Event>('/events', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Partial<import('../types').EventInput>) =>
    request<import('../types').Event>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) => request<void>(`/events/${id}`, { method: 'DELETE' }),

  book: (id: number) =>
    request<{ message: string; booking_id: number }>(`/events/${id}/book`, { method: 'POST' }),

  participants: (id: number) =>
    request<Array<{ id: number; user_id: number; booked_at: string; user: { id: number; name: string; email: string } }>>(
      `/events/${id}/participants`,
    ),
};

// ===== Bookings API =====
export const bookingsApi = {
  my: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').Booking[]>(`/bookings/my${qs}`);
  },

  cancel: (id: number) =>
    request<{ message: string; booking_id: number }>(`/bookings/${id}`, { method: 'DELETE' }),
};

// ===== Notifications API =====
export const notificationsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').Notification[]>(`/notifications${qs}`);
  },

  markRead: (id: number) => request<void>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllRead: () => request<void>('/notifications/read-all', { method: 'PUT' }),
};

// ===== Categories API =====
export const categoriesApi = {
  list: () => request<import('../types').Category[]>('/categories'),
};
