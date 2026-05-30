import axiosInstance from "./axiosInstance"; // Adjust the path to your axios instance

// ── TYPES & INTERFACES ──────────────────────────────────────────────────────
export interface TasTierData {
  tier1: Record<string, unknown>;
  tier2: Record<string, unknown>;
  tier3: Record<string, unknown>;
  tier4: Record<string, unknown>;
  tier5: Record<string, unknown>;
  tier6: Record<string, unknown>;
  status?: boolean;
}

export interface TasTier extends TasTierData {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── API METHODS ─────────────────────────────────────────────────────────────
export const tasApi = {
  // GET /api/settings/tas-tier
  fetchAll: async (): Promise<TasTier[]> => {
    const response = await axiosInstance.get<TasTier[]>("/api/settings/tas-tier");
    return response.data;
  },

  // GET /api/settings/tas-tier/{id}
  fetchById: async (id: string): Promise<TasTier> => {
    const response = await axiosInstance.get<TasTier>(`/api/settings/tas-tier/${id}`);
    return response.data;
  },

  // POST /api/settings/tas-tier/create -> Returns 201 Created
  create: async (data: TasTierData): Promise<TasTier> => {
    const response = await axiosInstance.post<TasTier>("/api/settings/tas-tier/create", data);
    return response.data;
  },

  // PUT /api/settings/tas-tier/{id}
  update: async (id: string, data: TasTierData): Promise<TasTier> => {
    const response = await axiosInstance.put<TasTier>(`/api/settings/tas-tier/${id}`, data);
    return response.data;
  },

  // DELETE /api/settings/tas-tier/{id}
  delete: async (id: string): Promise<string> => {
    await axiosInstance.delete(`/api/settings/tas-tier/${id}`);
    return id;
  },

  // PATCH /api/settings/tas-tier/{id}/toggle-status
  toggleStatus: async (id: string): Promise<TasTier> => {
    const response = await axiosInstance.patch<TasTier>(`/api/settings/tas-tier/${id}/toggle-status`);
    return response.data;
  },
};