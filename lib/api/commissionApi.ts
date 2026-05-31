// lib/api/commissionApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiCommission {
  id:                   string;
  model2CommissionRate: number;
  modelISubscription:   string;
  tasRegistrationBonus: number;
  tasModel1Commission:  number;
  tasModel2Commission:  number;
  effectiveDate:        string;
  status:               boolean;
  createdAt?:           string;
  updatedAt?:           string;
}

export interface CreateCommissionPayload {
  model2CommissionRate: number;
  modelISubscription:   string;
  tasRegistrationBonus: number;
  tasModel1Commission:  number;
  tasModel2Commission:  number;
  effectiveDate:        string; // YYYY-MM-DD — NestJS transforms this to a Date instance
}

export type UpdateCommissionPayload = Partial<CreateCommissionPayload>;

interface CommissionListResponse   { status: boolean; message: string; data: ApiCommission[];  }
interface CommissionSingleResponse { status: boolean; message: string; data: ApiCommission;    }
interface CommissionToggleResponse { status: boolean; message: string; data: ApiCommission;    }

// GET /api/settings/commission
export const getAllCommissions = async (): Promise<ApiCommission[]> => {
  const { data } = await axiosInstance.get<CommissionListResponse>("/settings/commission");
  return data.data ?? [];
};

// GET /api/settings/commission/{id}
export const getCommissionById = async (id: string): Promise<ApiCommission> => {
  const { data } = await axiosInstance.get<CommissionSingleResponse>(`/settings/commission/${id}`);
  return data.data;
};

// POST /api/settings/commission/create
export const createCommission = async (payload: CreateCommissionPayload): Promise<ApiCommission> => {
  const { data } = await axiosInstance.post<CommissionSingleResponse>("/settings/commission/create", payload);
  return data.data;
};

// PUT /api/settings/commission/{id}
export const updateCommission = async (id: string, payload: UpdateCommissionPayload): Promise<ApiCommission> => {
  const { data } = await axiosInstance.put<CommissionSingleResponse>(`/settings/commission/${id}`, payload);
  return data.data;
};

// DELETE /api/settings/commission/{id}
export const deleteCommission = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/settings/commission/${id}`);
};

// PATCH /api/settings/commission/{id}/toggle-status
export const toggleCommissionStatus = async (id: string): Promise<ApiCommission> => {
  const { data } = await axiosInstance.patch<CommissionToggleResponse>(
    `/settings/commission/${id}/toggle-status`
  );
  return data.data;
};