// lib/api/tasApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────
export interface ApiTas {
  id:          string;
  name:        string;
  email:       string;
  phone?:      string;
  status:      string;
  verify:      boolean;
  role:        string;
  avatar:      string | null;
  gender?:     string;
  dateOfBirth?: string;
  username?:   string;
  tier?:       string;
  category?:   string;
  location?:   { area?: string; city?: string; state?: string; country?: string };
  account?:    { bvn?: string; bankName?: string; accountName?: string; accountNumber?: string; accountCode?: string };
  document?:   Record<string, unknown>;
  bankDetails?: string;
  applicationCode?: string;
  referral?:   string | null;
  createdAt:   string;
  updatedAt:   string;
  [key: string]: unknown;
}

export interface AdjustTierPayload {
  newTier: string;
}

// ── Response wrappers ─────────────────────────────────────
interface TasListResponse {
  status:  boolean;
  message: string;
  data:    ApiTas[];
}

interface TasOneResponse {
  status:  boolean;
  message: string;
  data:    ApiTas;
}

// ── API functions ─────────────────────────────────────────

// GET /api/admin/tas-managements
export const getAllTas = async (): Promise<ApiTas[]> => {
  const { data } = await axiosInstance.get<TasListResponse>("/admin/tas-managements");
  console.log("📋 TAS API:", data);
  return data.data ?? [];
};

// GET /api/admin/tas-managements/{id}
export const getTasById = async (id: string): Promise<ApiTas> => {
  const { data } = await axiosInstance.get<TasOneResponse>(`/admin/tas-managements/${id}`);
  return data.data;
};

// PUT /api/admin/tas-managements/{id}/adjust-tier
export const adjustTasTier = async (id: string, payload: AdjustTierPayload): Promise<ApiTas> => {
  const { data } = await axiosInstance.put<TasOneResponse>(
    `/admin/tas-managements/${id}/adjust-tier`,
    payload
  );
  return data.data;
};