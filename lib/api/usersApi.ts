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
  dob?:          string;
  dateOfBirth?:  string;   // TAS API returns this field name
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
// GET /api/admin/users/{type}/{id}  — type: "client" | "expert" | "tas"
export const getUserById = async (id: string, type: string = "client"): Promise<ApiUser> => {
  const { data } = await axiosInstance.get<UserByIdResponse>(`/admin/users/${type.toLowerCase()}/${id}`);
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

// POST /experts/register — full schema from Swagger
export interface RegisterExpertPayload {
  name:        string;
  email:       string;
  phone:       string;
  password:    string;
  gender:      "male" | "female" | "other";
  bio:         string;
  referral?:   string;
  avatar?:     string;
  location?: {
    country?: string;
    state?:   string;
    city?:    string;
    area?:    string;
  };
  skill?: {
    experience?:  number | string;
    description?: string;
    role?:        string[];
    area?:        string;
  };
  category?: {
    name?: string;
    sub?:  string[];
  };
  verification?: "tier1" | "tier2" | "tier3";
  paymentModel?: "protected" | "unprotected";
  bankDetails?: {
    bankName?:      string;
    accountNumber?: string;
    bvn?:           string;
    accountCode?:   string;
    accountName?:   string;
  };
  services?: unknown[];
}

// POST /tas/register — full schema from Swagger
export interface RegisterTasPayload {
  username:            string;
  name:                string;
  email:               string;
  phone:               string;
  password:            string;
  gender:              "male" | "female" | "other";
  dateOfBirth:         string;   // ISO 8601 e.g. "1990-01-01"
  category?:           string[];
  recruitExpectations?: string;
  bankDetails?: {
    bankName?:   string;
    accountNo?:  string;
  };
  document?: {
    idCard?:          string;
    referenceLetter?: string;
  };
  applicationCode?: string;
  avatar?:          string;
  location?:        Record<string, unknown>;
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
    const { role: _, ...expertPayload } = payload as RegisterExpertPayload & { role: "expert" };
    // Remove referral if empty string
    if (expertPayload.referral === "") delete expertPayload.referral;
    const { data } = await axiosInstance.post<RegisterUserResponse>("/experts/register", expertPayload);
    return data.data;
  }

  if (payload.role === "tas") {
    const { role: _, ...tasPayload } = payload as RegisterTasPayload & { role: "tas" };
    const { data } = await axiosInstance.post<RegisterUserResponse>("/tas/register", tasPayload);
    return data.data;
  }

  // client
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