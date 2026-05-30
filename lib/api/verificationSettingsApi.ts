import axiosInstance from "./axiosInstance";

// ── TYPES & INTERFACES ──────────────────────────────────────────────────────
export interface VerificationSettingsData {
  tier1MaxJobValue: number;
  tier2MaxJobValue: number;
  tier3MinJobValue: number;
  status?: boolean;
}

export interface VerificationSettings extends VerificationSettingsData {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── API METHODS ─────────────────────────────────────────────────────────────
export const verificationSettingsApi = {
  // GET /api/settings/verification
  fetchAll: async (): Promise<VerificationSettings[]> => {
    const response = await axiosInstance.get<VerificationSettings[]>("/api/settings/verification");
    return response.data;
  },

  // GET /api/settings/verification/{id}
  fetchById: async (id: string): Promise<VerificationSettings> => {
    const response = await axiosInstance.get<VerificationSettings>(`/api/settings/verification/${id}`);
    return response.data;
  },

  // POST /api/settings/verification/create
  create: async (data: VerificationSettingsData): Promise<VerificationSettings> => {
    const response = await axiosInstance.post<VerificationSettings>("/api/settings/verification/create", data);
    return response.data;
  },

  // PUT /api/settings/verification/{id}
  update: async (id: string, data: VerificationSettingsData): Promise<VerificationSettings> => {
    const response = await axiosInstance.put<VerificationSettings>(`/api/settings/verification/${id}`, data);
    return response.data;
  },

  // DELETE /api/settings/verification/{id}
  delete: async (id: string): Promise<string> => {
    await axiosInstance.delete(`/api/settings/verification/${id}`);
    return id;
  },

  // PATCH /api/settings/verification/{id}/toggle-status
  toggleStatus: async (id: string): Promise<VerificationSettings> => {
    const response = await axiosInstance.patch<VerificationSettings>(`/api/settings/verification/${id}/toggle-status`);
    return response.data;
  },
};