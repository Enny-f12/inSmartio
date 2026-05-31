// lib/api/tastierApi.ts
import axiosInstance from "./axiosInstance";

export interface TierConfig {
  experts: number;
  bonus:   number;
}

export interface TasTierData {
  tier1:   TierConfig;
  tier2:   TierConfig;
  tier3:   TierConfig;
  tier4:   TierConfig;
  tier5:   TierConfig;
  tier6:   TierConfig;
  status?: boolean;
}

export interface TasTier extends TasTierData {
  id:         string;
  createdAt?: string;
  updatedAt?: string;
}

interface Envelope<T> { status: boolean; message: string; data: T; }

export const tasApi = {
  fetchAll: async (): Promise<TasTier[]> => {
    const { data } = await axiosInstance.get<Envelope<TasTier[]>>("/settings/tas-tier");
    return data.data ?? [];
  },

  fetchById: async (id: string): Promise<TasTier> => {
    const { data } = await axiosInstance.get<Envelope<TasTier>>(`/settings/tas-tier/${id}`);
    return data.data;
  },

  create: async (payload: TasTierData): Promise<TasTier> => {
    const { data } = await axiosInstance.post<Envelope<TasTier>>("/settings/tas-tier/create", payload);
    return data.data;
  },

  update: async (id: string, payload: TasTierData): Promise<TasTier> => {
    const { data } = await axiosInstance.put<Envelope<TasTier>>(`/settings/tas-tier/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<string> => {
    await axiosInstance.delete(`/settings/tas-tier/${id}`);
    return id;
  },

  toggleStatus: async (id: string): Promise<TasTier> => {
    const { data } = await axiosInstance.patch<Envelope<TasTier>>(`/settings/tas-tier/${id}/toggle-status`);
    return data.data;
  },
};