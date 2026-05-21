// lib/api/verificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiVerificationSummary {
  id:             string;   // required — records without id are filtered out
  name:           string;
  email:          string;
  status:         string;
  submitted:      string;
  documents:      number;
  totalDocuments: number;
}

export interface VerifyExpertPayload {
  action:  "verify" | "reject";
  reason?: string;
}

interface VerificationListResponse {
  status:  boolean;
  message: string;
  data:    (Omit<ApiVerificationSummary, "id"> & { id?: string })[];
}

interface VerifyResponse {
  status:  boolean;
  message: string;
  data:    null;
}

// GET /api/admin/experts/verification
// Filters out any records the backend returns without an id (e.g. Stella)
export const getAllVerifications = async (): Promise<ApiVerificationSummary[]> => {
  const { data } = await axiosInstance.get<VerificationListResponse>("/admin/experts/verification");
  return (data.data ?? []).filter((item): item is ApiVerificationSummary => !!item.id);
};

// PUT /api/admin/experts/verification/{id}
export const verifyExpert = async (
  id: string,
  payload: VerifyExpertPayload,
): Promise<void> => {
  await axiosInstance.put<VerifyResponse>(`/admin/experts/verification/${id}`, payload);
};