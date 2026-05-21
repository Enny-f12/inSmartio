// lib/api/verificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Matches the REAL list response from the API ───────────
// GET /api/admin/experts/verification returns these fields per item:
// { name, email, status, submitted, documents, totalDocuments }
// NOTE: No `id` field yet — pending backend confirmation

export interface ApiVerificationSummary {
  name:           string;
  email:          string;
  status:         string;        // "active" | "pending" | "rejected"
  submitted:      string;        // ISO date string
  documents:      number;        // uploaded count
  totalDocuments: number;        // required count
  // id will be added once backend confirms the correct field
  id?: string;
}

// PUT /api/admin/experts/verification/{id}
export interface VerifyExpertPayload {
  action:  "verify" | "reject";
  reason?: string;               // required when action = "reject"
}

// ── Response wrappers ─────────────────────────────────────
interface VerificationListResponse {
  status:  boolean;
  message: string;
  data:    ApiVerificationSummary[];
}

interface VerifyResponse {
  status:  boolean;
  message: string;
  data:    null;
}

// ── API functions ─────────────────────────────────────────

// GET /api/admin/experts/verification
export const getAllVerifications = async (): Promise<ApiVerificationSummary[]> => {
  const { data } = await axiosInstance.get<VerificationListResponse>("/admin/experts/verification");
  return data.data ?? [];
};

// PUT /api/admin/experts/verification/{id}
// id = expert's user ID (pending backend confirmation)
export const verifyExpert = async (
  id: string,
  payload: VerifyExpertPayload,
): Promise<void> => {
  await axiosInstance.put<VerifyResponse>(`/admin/experts/verification/${id}`, payload);
};