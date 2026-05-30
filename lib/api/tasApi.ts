// lib/api/tasApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiTas {
  id:               string;
  name:             string;
  email:            string;
  phone?:           string;
  status:           string;
  verify:           boolean;
  role:             string;
  avatar:           string | null;
  gender?:          string;
  dateOfBirth?:     string;
  username?:        string;
  tier?:            string | number;
  category?:        string[] | null;
  location?:        Record<string, unknown>;
  account?:         { bvn?: string; bankName?: string; accountName?: string; accountNumber?: string; accountCode?: string } | null;
  bankDetails?:     { bankName?: string; accountNo?: string } | null;
  document?:        Record<string, unknown>;
  applicationCode?: string;
  referral?:        string | null;
  parentTasId?:     string | null;
  recruitExpectations?: string | null;
  commission?:      unknown;
  commissionsGiven?: unknown[];
  experts?:         unknown;
  createdAt:        string;
  updatedAt:        string;
  [key: string]:    unknown;
}

export interface AdjustTierPayload {
  newTier: number;
}

export interface VerifyTasPayload {
  verify:  boolean;
  reject?: boolean;
  reason?: string;
  adminId?: string;
}

interface TasListResponse { status: boolean; message: string; data: ApiTas[]; }
interface TasOneResponse  { status: boolean; message: string; data: ApiTas;   }

export const getAllTas = async (): Promise<ApiTas[]> => {
  const { data } = await axiosInstance.get<TasListResponse>("/admin/tas-managements");
  return data.data ?? [];
};

// encode handles IDs with slashes e.g. "TAS-021/05/26" → "TAS-021%2F05%2F26"
const encodeId = (id: string) => id.split("/").map(encodeURIComponent).join("%2F");

export const getTasById = async (id: string): Promise<ApiTas> => {
  const { data } = await axiosInstance.get<TasOneResponse>(
    `/admin/tas-managements/${encodeId(id)}`
  );
  return data.data;
};

export const adjustTasTier = async (id: string, payload: AdjustTierPayload): Promise<void> => {
  await axiosInstance.put<TasOneResponse>(
    `/admin/tas-managements/${encodeId(id)}/adjust-tier`,
    payload
  );
};

// PUT /admin/experts/verification/:id?type=tas — approve or reject a TAS application
export const verifyTas = async (id: string, payload: VerifyTasPayload): Promise<void> => {
  await axiosInstance.put(
    `/admin/experts/verification/${encodeId(id)}`,
    payload,
    { params: { type: "tas" } }
  );
};

export const suspendTas = async (id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/suspend/tas/${encodeId(id)}`);
};

export const activateTas = async (id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/activate/tas/${encodeId(id)}`);
};