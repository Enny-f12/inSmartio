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
  newTier: number;  // number, not string
}

interface TasListResponse { status: boolean; message: string; data: ApiTas[]; }
interface TasOneResponse  { status: boolean; message: string; data: ApiTas;   }

export const getAllTas = async (): Promise<ApiTas[]> => {
  const { data } = await axiosInstance.get<TasListResponse>("/admin/tas-managements");
  return data.data ?? [];
};

export const getTasById = async (id: string): Promise<ApiTas> => {
  const { data } = await axiosInstance.get<TasOneResponse>(`/admin/tas-managements/${id}`);
  return data.data;
};

export const adjustTasTier = async (id: string, payload: AdjustTierPayload): Promise<void> => {
  await axiosInstance.put<TasOneResponse>(`/admin/tas-managements/${id}/adjust-tier`, payload);
};

export const suspendTas = async (id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/suspend/tas/${id}`);
};

export const activateTas = async (id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/activate/tas/${id}`);
};