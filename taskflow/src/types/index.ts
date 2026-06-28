// ===== User =====
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'organizer' | 'admin';
  avatar_url: string | null;
  created_at: string;
}

// ===== Auth =====
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// ===== Event =====
export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_participants: number;
  cover_image: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  category: Category;
  organizer: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'>;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  category_id: number;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
}

// ===== Booking =====
export interface Booking {
  id: number;
  user_id: number;
  event_id: number;
  status: 'confirmed' | 'cancelled';
  booked_at: string;
  cancelled_at: string | null;
  event: Event;
}

// ===== Notification =====
export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ===== Pagination =====
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ===== Theme =====
export type Theme = 'light' | 'dark' | 'system';
