// lib/api/verificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type VerificationTier = "tier1" | "tier2" | "tier3";

export interface VerificationDocument {
  name:   string;
  url?:   string;
  status: "verified" | "pending";
}

export interface GuarantorInfo {
  name:       string;
  phone:      string;
  occupation: string;
  status?:    string;
}

export interface PoliceClearance {
  certificateNo: string;
  issued:        string;
  issuingState:  string;
  status:        string;
}

export interface NinVerification {
  ninNumber: string;
  ninStatus: string;
  nameMatch: boolean;
  dobMatch:  boolean;
}

export interface ApiVerificationSummary {
  id:             string;
  name:           string;
  email:          string;
  phone?:         string;
  status:         string;
  submitted:      string;
  documents:      number;
  totalDocuments: number;
  tier?:          VerificationTier;
  appliedTier?:        string;
  verificationFee?:    string;
  verificationDocuments?: VerificationDocument[];
  guarantor?:          GuarantorInfo;
  policeClearance?:    PoliceClearance;
  ninVerification?:    NinVerification;
  notes?:              string;
}

// PUT /api/admin/experts/verification/{id}?type=...
// Body matches Swagger schema exactly
export interface VerifyExpertPayload {
  documentKey?: string;
  verify?:      boolean;
  reject?:      boolean;
  reason?:      string;
  adminId?:     string;
}

interface VerificationListResponse {
  status:  boolean;
  message: string;
  data:    (Omit<ApiVerificationSummary, "id"> & { id?: string })[];
}

interface VerificationDetailResponse {
  status:  boolean;
  message: string;
  data:    ApiVerificationSummary;
}

interface VerifyResponse {
  status:  boolean;
  message: string;
  data:    null;
}

// GET /api/admin/experts/verification
export const getAllVerifications = async (): Promise<ApiVerificationSummary[]> => {
  const { data } = await axiosInstance.get<VerificationListResponse>("/admin/experts/verification");
  return (data.data ?? []).filter((item): item is ApiVerificationSummary => !!item.id);
};

// GET /api/admin/experts/verification/{id}?type=tier1|tier2|tier3
export const getVerificationById = async (
  id:   string,
  type: VerificationTier,
): Promise<ApiVerificationSummary> => {
  const { data } = await axiosInstance.get<VerificationDetailResponse>(
    `/admin/experts/verification/${id}`,
    { params: { type } },
  );
  return data.data;
};

// PUT /api/admin/experts/verification/{id}?type=tier1|tier2|tier3
export const verifyExpert = async (
  id:      string,
  type:    VerificationTier,
  payload: VerifyExpertPayload,
): Promise<void> => {
  await axiosInstance.put<VerifyResponse>(
    `/admin/experts/verification/${id}`,
    payload,
    { params: { type } },
  );
};