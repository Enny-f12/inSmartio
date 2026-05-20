// lib/api/verificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

export interface ApiVerificationExpert {
  id:        string;
  name:      string;
  email:     string;
  phone?:    string;
  status:    string;
  verify:    boolean;
  role:      string;
  avatar:    string | null;
  createdAt: string;
  updatedAt: string;
  // verification-specific fields
  document?:      Record<string, unknown>;
  verification?:  string;   // "tier1" | "tier2" | "tier3"
  gender?:        string;
  bio?:           string;
  location?:      { country?: string; state?: string; city?: string; area?: string };
  [key: string]:  unknown;
}

// PUT /api/admin/experts/verification/{id}
// Request body
export interface VerifyExpertDocumentPayload {
  documentKey: string;   
  verify:      boolean;  
  reject:      boolean;  // true = reject
  reason?:     string;   // required when reject = true
  adminId:     string;   // the admin performing the action
}

// Response wrappers
interface VerificationListResponse {
  status:  boolean;
  message: string;
  data:    ApiVerificationExpert[];
}

interface VerificationOneResponse {
  status:  boolean;
  message: string;
  data:    ApiVerificationExpert;
}

interface VerifyDocumentResponse {
  status:  boolean;
  message: string;
  data:    ApiVerificationExpert;
}

// ── API functions ─────────────────────────────────────────

// GET /api/admin/experts/verification
export const getAllVerifications = async (): Promise<ApiVerificationExpert[]> => {
  const { data } = await axiosInstance.get<VerificationListResponse>("/admin/experts/verification");
  console.log("📋 Verifications API:", data);
  return data.data ?? [];
};

// GET /api/admin/experts/verification/{id}
export const getVerificationById = async (id: string): Promise<ApiVerificationExpert> => {
  const { data } = await axiosInstance.get<VerificationOneResponse>(`/admin/experts/verification/${id}`);
  return data.data;
};

// PUT /api/admin/experts/verification/{id}
export const verifyExpertDocument = async (
  id: string,
  payload: VerifyExpertDocumentPayload
): Promise<ApiVerificationExpert> => {
  const { data } = await axiosInstance.put<VerifyDocumentResponse>(
    `/admin/experts/verification/${id}`,
    payload
  );
  return data.data;
};