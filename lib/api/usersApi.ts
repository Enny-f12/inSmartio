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

// ── Response shapes ───────────────────────────────────────
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

export interface UserByIdResponse {
  status:  boolean;
  message: string;
  data:    ApiUser;
}

// ── Get all users ─────────────────────────────────────────
export const getAllUsers = async (): Promise<ApiUser[]> => {
  const { data } = await axiosInstance.get<AdminUsersResponse>("/admin/users");
  return data.data?.allUsers ?? [];
};

// ── Get user by type + id ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUserById = async (id: string, _type: string = "client"): Promise<ApiUser> => {
  const { data } = await axiosInstance.get<UserByIdResponse>(`/admin/users/{type.toLowerCase()}/${id}`);
  return data.data;
};

// ── Registration payloads ─────────────────────────────────
export interface RegisterClientPayload {
  name:      string;
  email:     string;
  username:  string;
  phone:     string;
  password:  string;
  referral?: string;
}

export interface RegisterExpertPayload {
  name:     string;
  email:    string;
  phone:    string;
  password: string;
  gender:   "male" | "female" | "other";
  bio:      string;
  referral?: string;
}

export interface RegisterTasPayload {
  name:     string;
  email:    string;
  phone:    string;
  password: string;
  gender:   "male" | "female" | "other";
  dob:      string;
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
    // Extracted referral from the template payload mapping
    const { name, email, phone, password, gender, bio, referral } = payload as RegisterExpertPayload & { role: "expert" };
    
    const { data } = await axiosInstance.post<RegisterUserResponse>("/experts/register", {
      name, 
      email, 
      phone, 
      password, 
      gender, 
      bio, 
      referral: referral || "" // Guarantees a flat string to pass schema validation constraints cleanly
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

  // client — strip role before sending
  const { role, ...rest } = payload as RegisterClientPayload & { role: "client" };
  void role;
  const { data } = await axiosInstance.post<RegisterUserResponse>("/clients/register", rest);
  return data.data;
};

// ── Admin user actions ────────────────────────────────────

// DELETE /api/admin/users/{type}/{id}
export const adminDeleteUser = async (type: string, id: string): Promise<void> => {
  await axiosInstance.delete(`/admin/users/${type}/${id}`);
};

// PUT /api/admin/users/suspend/{type}/{id}
export const suspendUser = async (type: string, id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/suspend/${type}/${id}`);
};

// PUT /api/admin/users/activate/{type}/{id}
export const activateUser = async (type: string, id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/activate/${type}/${id}`);
};

// ── Admin stats ───────────────────────────────────────────
export interface AdminStats {
  [key: string]: unknown;
}

export interface AdminStatsResponse {
  status:  boolean;
  message: string;
  data:    AdminStats;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await axiosInstance.get<AdminStatsResponse>("/admin/stats");
  return data.data;
};