import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  name: string;
  phone?: string;
  status: string;
  verify: boolean;
  mode: string;
  referral: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  status: boolean;
  message: string;
  data: ApiUser[];
}

export interface UserByIdResponse {
  status: boolean;
  message: string;
  data: ApiUser;
}

// ── Existing routes (keep for presentation) ───────────────

export const getAllUsers = async (): Promise<ApiUser[]> => {
  const { data } = await axiosInstance.get<UsersListResponse>("/admin/users");
  return data.data ?? []; // guard against null
};

// GET /api/admin/users/{type}/{id} — needs type (mode)
// Falls back to old route if type not provided
export const getUserById = async (id: string, type?: string): Promise<ApiUser> => {
  if (type) {
    const { data } = await axiosInstance.get<UserByIdResponse>(`/admin/users/${type}/${id}`);
    return data.data;
  }
  // fallback for when we only have id (e.g. from list click before type is known)
  const { data } = await axiosInstance.get<UserByIdResponse>(`/users/me/${id}`);
  return data.data;
};

export interface RegisterUserPayload {
  email: string;
  username: string;
  name: string;
  phone: string;
  password: string;
  referral?: string;
  mode: "client" | "expert" | "tas";
}

export interface RegisterUserResponse {
  status: boolean;
  message: string;
  data: ApiUser;
}

export const registerUser = async (payload: RegisterUserPayload): Promise<ApiUser> => {
  const { data } = await axiosInstance.post<RegisterUserResponse>("/users/register", payload);
  return data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/users/${id}`);
};

// ── New admin routes ──────────────────────────────────────

// GET /api/admin/users — all users 
export const adminGetAllUsers = async (): Promise<ApiUser[]> => {
  const { data } = await axiosInstance.get<UsersListResponse>("/admin/users");
  return data.data;
};

// GET /api/admin/users/{type}/{id} — get user by type and id
export const adminGetUserByType = async (type: string, id: string): Promise<ApiUser> => {
  const { data } = await axiosInstance.get<UserByIdResponse>(`/admin/users/${type}/${id}`);
  return data.data;
};

// DELETE /api/admin/users/{type}/{id}
export const adminDeleteUser = async (type: string, id: string): Promise<void> => {
  await axiosInstance.delete(`/admin/users/${type}/${id}`);
};

// PUT /api/admin/users/suspend/{type}/{id}
export const suspendUser = async (type: string, id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/suspend/${type}/${id}`);
};

// ── Admin stats ───────────────────────────────────────────

export interface AdminStats {
  [key: string]: unknown; // flexible until we see real response shape
}

export interface AdminStatsResponse {
  status: boolean;
  message: string;
  data: AdminStats;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await axiosInstance.get<AdminStatsResponse>("/admin/stats");
  console.log("📊 Admin stats response:", data.data); // log shape for now
  return data.data;
};