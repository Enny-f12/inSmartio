// lib/api/tasApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiTas {
  id:                  string;
  name:                string;
  email:               string;
  phone?:              string;
  status:              string;
  verify:              boolean | string;
  role:                string;
  avatar:              string | null;
  gender?:             string;
  dateOfBirth?:        string;
  username?:           string;
  tier?:               string | number;
  category?:           string[] | null;
  location?:           Record<string, unknown>;
  account?:            { bvn?: string; bankName?: string; accountName?: string; accountNumber?: string; accountCode?: string } | null;
  bankDetails?:        { bankName?: string; accountNo?: string } | null;
  document?:           Record<string, unknown>;
  applicationCode?:    string;
  referral?:           string | null;
  parentTasId?:        string | null;
  recruitExpectations?: Record<string, unknown> | string | null;
  commission?:         unknown;
  commissionsGiven?:   unknown[];
  experts?:            unknown;
  createdAt:           string;
  updatedAt:           string;
  [key: string]:       unknown;
}

export interface AdjustTierPayload {
  newTier: number;
}

// Unified verification payload — used for both expert and TAS
export interface VerifyTasPayload {
  verify:       boolean;
  reject?:      boolean;
  reason?:      string;
  adminId?:     string;
  documentKey?: string; // publicId value from the document array
}

interface TasListResponse { status: boolean; message: string; data: ApiTas[]; }
interface TasOneResponse  { status: boolean; message: string; data: ApiTas;   }

// encode handles IDs with slashes e.g. "TAS-021/05/26" → "TAS-021%2F05%2F26"
const encodeId = (id: string) => id.split("/").map(encodeURIComponent).join("%2F");

export const getAllTas = async (): Promise<ApiTas[]> => {
  const { data } = await axiosInstance.get<TasListResponse>("/admin/tas-managements");
  return data.data ?? [];
};

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

// PUT /admin/experts/verification/:id?type=tas
// Same endpoint as expert verification, just with type=tas query param
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