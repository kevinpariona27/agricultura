export interface User {
  id: number;
  email: string;
}

export interface Parcel {
  id: number;
  user_id: number;
  name: string;
  area: number;
  location: string;
  soil_type: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}
