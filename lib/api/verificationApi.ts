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
  ninNumber:   string;
  ninStatus:   string;
  nameMatch:   boolean;
  dobMatch:    boolean;
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
  // tier from backend or assigned for filtering
  tier?:          VerificationTier;
  // detail fields (available after clicking view — or from mock)
  appliedTier?:        string;
  verificationFee?:    string;
  verificationDocuments?: VerificationDocument[];
  guarantor?:          GuarantorInfo;
  policeClearance?:    PoliceClearance;
  ninVerification?:    NinVerification;
  notes?:              string;
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
// Filters out records without an id
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