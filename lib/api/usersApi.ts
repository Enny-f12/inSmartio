import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiUser {
  id:           string;
  email:        string;
  name:         string;
  phone?:       string;
  status:       string;
  verify:       boolean;
  role:         string;
  avatar:       string | null;
  createdAt:    string;
  updatedAt:    string;
  // expert fields
  gender?:      string;
  bio?:         string;
  verification?: string;
  category?:    Record<string, unknown>;
  skill?:       Record<string, unknown>;
  services?:    unknown;
  bankDetails?: Record<string, unknown>;
  document?:    Record<string, unknown>;
  paymentModel?: string;
  // tas fields
  dob?:         string;
  referral?:    string | null;
  account?:     {
    bvn?:           string;
    bankName?:      string;
    accountCode?:   string;
    accountName?:   string;
    accountNumber?: string;
  };
  location?:    {
    area?:    string;
    city?:    string;
    state?:   string;
    country?: string;
  };
  // client fields
  username?:    string;
  // legacy
  mode?:        string;
}

// ── New response shape from GET /api/admin/users ──────────
interface AdminUsersData {
  clients:  ApiUser[];
  experts:  ApiUser[];
  tas:      ApiUser[];
  allUsers: ApiUser[];
}

interface AdminUsersResponse {
  status:  boolean;
  message: string;
  data:    AdminUsersData;
}

export interface UsersListResponse {
  status:  boolean;
  message: string;
  data:    ApiUser[];
}

export interface UserByIdResponse {
  status:  boolean;
  message: string;
  data:    ApiUser;
}

export const getAllUsers = async (): Promise<ApiUser[]> => {
  const { data } = await axiosInstance.get<AdminUsersResponse>("/admin/users");
  console.log("📋 Admin users response:", data);
  return data.data?.allUsers ?? [];
};

// GET /api/admin/users/{type}/{id}
// type: "client" | "expert" | "tas" (from user.role)
export const getUserById = async (id: string, type: string = "client"): Promise<ApiUser> => {
  const { data } = await axiosInstance.get<UserByIdResponse>(`/admin/users/${type}/${id}`);
  return data.data;
};

// ── Client registration payload ───────────────────────────
export interface RegisterClientPayload {
  name:      string;
  email:     string;
  username:  string;
  phone:     string;
  password:  string;
  role:      "client" | "tas";
  referral?: string;
}

// ── Expert registration payload (no username, no role sent) ──
export interface RegisterExpertPayload {
  name:     string;
  email:    string;
  phone:    string;
  password: string;
  gender:   "male" | "female" | "other";
  bio:      string;
}

// ── TAS registration payload ──────────────────────────────
export interface RegisterTasPayload {
  name:     string;
  email:    string;
  phone:    string;
  password: string;
  gender:   "male" | "female" | "other";
  dob:      string; // ISO 8601 date string e.g. "1990-01-15"
}

export type RegisterUserPayload =
  | (RegisterClientPayload & { role: "client" })
  | (RegisterExpertPayload & { role: "expert" })
  | (RegisterTasPayload    & { role: "tas" });

export interface RegisterUserResponse {
  status:  boolean;
  message: string;
  data:    ApiUser;
}

export const registerUser = async (payload: RegisterUserPayload): Promise<ApiUser> => {
  if (payload.role === "expert") {
    const { name, email, phone, password, gender, bio } = payload as RegisterExpertPayload & { role: "expert" };
    const { data } = await axiosInstance.post<RegisterUserResponse>("/experts/register", {
      name, email, phone, password, gender, bio,
    });
    return data.data;
  }

  if (payload.role === "tas") {
    const { name, email, phone, password, gender, dob } = payload as RegisterTasPayload & { role: "tas" };
    const { data } = await axiosInstance.post<RegisterUserResponse>("/tas/register", {
      name, email, phone, password, gender, dob,
    });
    return data.data;
  }

  // client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role: _, ...rest } = payload as RegisterClientPayload;
  const { data } = await axiosInstance.post<RegisterUserResponse>("/clients/register", rest);
  return data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/users/${id}`);
};

// ── New admin routes ──────────────────────────────────────

// GET /api/admin/users — all users (admin)
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