// lib/api/verificationSettingsApi.ts
import axiosInstance from "./axiosInstance";

export interface VerificationSettingsData {
  tier1MaxJobValue: number;
  tier2MaxJobValue: number;
  tier3MinJobValue: number;
  status?: boolean;
}

export interface VerificationSettings extends VerificationSettingsData {
  id:         string;
  createdAt?: string;
  updatedAt?: string;
}

interface Envelope<T> { status: boolean; message: string; data: T; }

export const verificationSettingsApi = {
  fetchAll: async (): Promise<VerificationSettings[]> => {
    const { data } = await axiosInstance.get<Envelope<VerificationSettings[]>>("/settings/verification");
    return data.data ?? [];
  },

  fetchById: async (id: string): Promise<VerificationSettings> => {
    const { data } = await axiosInstance.get<Envelope<VerificationSettings>>(`/settings/verification/${id}`);
    return data.data;
  },

  create: async (payload: VerificationSettingsData): Promise<VerificationSettings> => {
    const { data } = await axiosInstance.post<Envelope<VerificationSettings>>("/settings/verification/create", payload);
    return data.data;
  },

  update: async (id: string, payload: VerificationSettingsData): Promise<VerificationSettings> => {
    const { data } = await axiosInstance.put<Envelope<VerificationSettings>>(`/settings/verification/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<string> => {
    await axiosInstance.delete(`/settings/verification/${id}`);
    return id;
  },

  toggleStatus: async (id: string): Promise<VerificationSettings> => {
    const { data } = await axiosInstance.patch<Envelope<VerificationSettings>>(`/settings/verification/${id}/toggle-status`);
    return data.data;
  },
};