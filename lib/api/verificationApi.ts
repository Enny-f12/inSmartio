// lib/api/verificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type VerificationTier = "tier1" | "tier2" | "tier3";
export type VerificationType = "expert" | "tas";

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

// ── Shape returned by GET /api/admin/experts/verification (list) ──
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
  verificationType?: VerificationType;
  appliedTier?:        string;
  verificationFee?:    string;
  verificationDocuments?: VerificationDocument[];
  guarantor?:          GuarantorInfo;
  policeClearance?:    PoliceClearance;
  ninVerification?:    NinVerification;
  notes?:              string;
}

// ── Shape returned by GET /api/admin/experts/verification/{id}?type=expert|tas ──
// This is a full expert profile, not a verification summary
export interface ApiVerificationDetail {
  id:                   string;
  name:                 string;
  email:                string;
  phone:                string;
  avatar:               string | null;
  gender:               string;
  bio:                  string;
  role:                 string;
  roles:                string[];
  status:               string;
  currentMode:          string;
  category:             string;
  skill:                string[];
  services:             string | null;
  tier:                 number;           // 1 | 2 | 3 as number
  verification:         string;           // "tier1" | "tier2" | "tier3"
  verify:               boolean;          // true = already verified
  commission:           number | null;
  paymentModel:         string;
  subscriptionActive:   boolean;
  subscriptionExpiresAt: string | null;
  referral:             string | null;
  lastModelSwitchDate:  string | null;
  createdAt:            string;
  updatedAt:            string;
  location: {
    city:    string;
    state:   string;
    address: string;
  };
  document: {
    number:   string;
    kycType:  string;       // "BVN" | "NIN" etc.
    verified: boolean;
  };
  bankDetails: {
    bankName:      string;
    accountName:   string;
    accountNumber: string;
  };
}

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
  data:    ApiVerificationDetail;
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

// GET /api/admin/experts/verification/{id}?type=expert|tas
export const getVerificationById = async (
  id:   string,
  type: VerificationType,
): Promise<ApiVerificationDetail> => {
  const { data } = await axiosInstance.get<VerificationDetailResponse>(
    `/admin/experts/verification/${id}`,
    { params: { type } },
  );
  return data.data;
};

// PUT /api/admin/experts/verification/{id}?type=expert|tas
export const verifyExpert = async (
  id:      string,
  type:    VerificationType,
  payload: VerifyExpertPayload,
): Promise<void> => {
  await axiosInstance.put<VerifyResponse>(
    `/admin/experts/verification/${id}`,
    payload,
    { params: { type } },
  );
};