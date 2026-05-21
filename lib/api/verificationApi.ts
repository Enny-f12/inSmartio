// lib/api/verificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types 

export interface ApiVerificationExpert {
  id:     string;
  name:   string;
  email:  string;
  phone?: string;
  gender?: string;
  bio?:    string;
  location?: {
    country?: string;
    state?:   string;
    city?:    string;
    area?:    string;
  };
  skill?: {
    experience?:  string;
    description?: string;
    role?:        string;
    area?:        string;
  };
  category?: string[];
  verificationDocument?: {
    idCard?:           string;   // url
    referenceLetter?:  string;   // url
    [key: string]:     string | undefined;
  };
  paymentModel?: string;
  bankDetails?: {
    bankName?:   string;
    accountNo?:  string;
  };
  services?: unknown[];
  // not in list response but kept for flexibility
  status?:   string;
  verify?:   boolean;
  role?:     string;
  avatar?:   string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// PUT /api/admin/experts/verification/{id}
// Response is { status: true, message: string, data: null }
export interface VerifyExpertDocumentPayload {
  documentKey: string;
  verify:      boolean;
  reject:      boolean;
  reason?:     string;   // required when reject = true
  adminId:     string;
}

// ── Response wrappers ─────────────────────────────────────
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
  data:    null;   // backend returns null on success
}

// ── API functions ─────────────────────────────────────────

// GET /api/admin/experts/verification
export const getAllVerifications = async (): Promise<ApiVerificationExpert[]> => {
  const { data } = await axiosInstance.get<VerificationListResponse>("/admin/experts/verification");
  return data.data ?? [];
};

// GET /api/admin/experts/verification/{id}
export const getVerificationById = async (id: string): Promise<ApiVerificationExpert> => {
  const { data } = await axiosInstance.get<VerificationOneResponse>(`/admin/experts/verification/${id}`);
  return data.data;
};

// PUT /api/admin/experts/verification/{id}
// Returns null on success — we refetch the list after
export const verifyExpertDocument = async (
  id: string,
  payload: VerifyExpertDocumentPayload
): Promise<void> => {
  await axiosInstance.put<VerifyDocumentResponse>(`/admin/experts/verification/${id}`, payload);
};