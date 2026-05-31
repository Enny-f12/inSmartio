// lib/api/verificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type VerificationTier   = "tier1" | "tier2" | "tier3";
export type VerificationType   = "expert" | "tas";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationDocument {
  id?:     string | null;
  url?:    string;
  date?:   string;
  status?: "verified" | "pending" | string;
  type?:   string;
  name?:   string;
  verify?: boolean;
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
  tier?:          string;
  status:         string;
  verify?:        boolean | string;
  submitted:      string;
  documents:      VerificationDocument[] | number;
  totalDocuments: number;
  appliedTier?:          string;
  verificationFee?:      string;
  verificationDocuments?: VerificationDocument[];
  guarantor?:            GuarantorInfo;
  policeClearance?:      PoliceClearance;
  ninVerification?:      NinVerification;
  notes?:                string;
}

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
  category:             string | Record<string, unknown>;
  skill:                string[] | Record<string, unknown>;
  services:             string | null;
  tier:                 number | string;
  verification:         string;
  verify:               boolean | string;
  commission:           number | null;
  paymentModel:         string;
  subscriptionActive:   boolean;
  subscriptionExpiresAt: string | null;
  referral:             string | null;
  lastModelSwitchDate:  string | null;
  createdAt:            string;
  updatedAt:            string;
  location: {
    city?:    string;
    state?:   string;
    address?: string;
    area?:    string;
    country?: string;
  };
  document: Record<string, unknown> | unknown[];
  bankDetails: {
    bankName:      string;
    accountName:   string;
    accountNumber: string;
    bvn?:          string;
  };
}

export interface VerifyExpertPayload {
  documentKey?: string; // publicId value from the document being verified
  verify?:      boolean;
  reject?:      boolean;
  reason?:      string;
  adminId?:     string;
}

interface VerificationListResponse {
  status:  boolean;
  message: string;
  data:    Omit<ApiVerificationSummary, "id">[];
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

const encodeId = (id: string) => id.split("/").map(encodeURIComponent).join("%2F");

// ── Tier normalisation ────────────────────────────────────────────────────────
export function normaliseTier(raw: unknown): VerificationTier {
  if (raw === "tier1" || raw === "tier2" || raw === "tier3") return raw;
  const n = Number(raw);
  if (n === 3) return "tier3";
  if (n === 2) return "tier2";
  return "tier1";
}

// ── Status normalisation ──────────────────────────────────────────────────────
export function normaliseVerificationStatus(
  status:  string,
  verify?: boolean | string,
): VerificationStatus {
  if (verify === true) return "approved";
  if (typeof verify === "string") {
    const v = verify.toLowerCase();
    if (v === "approved" || v === "verified") return "approved";
    if (v === "rejected") return "rejected";
    if (v === "pending")  return "pending";
  }
  const s = (status ?? "").toLowerCase();
  if (s === "active" || s === "approved" || s === "verified") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

// ── Doc label ─────────────────────────────────────────────────────────────────
export function docLabel(summary: ApiVerificationSummary): string {
  const total = summary.totalDocuments ?? 0;
  if (total === 0) return "—";
  if (Array.isArray(summary.documents)) {
    const verified = summary.documents.filter(
      (d) => d.verify === true || d.status === "verified"
    ).length;
    return `${verified}/${total}`;
  }
  const n = typeof summary.documents === "number" ? summary.documents : 0;
  return `${n}/${total}`;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const getAllVerifications = async (): Promise<ApiVerificationSummary[]> => {
  const { data } = await axiosInstance.get<VerificationListResponse>("/admin/experts/verification");
  return (data.data ?? []).map((item, index) => ({
    ...item,
    id: item.email ?? `item-${index}`,
  }));
};

export const getVerificationById = async (
  id:   string,
  type: VerificationType,
): Promise<ApiVerificationDetail> => {
  const { data } = await axiosInstance.get<VerificationDetailResponse>(
    `/admin/experts/verification/${encodeId(id)}`,
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
    `/admin/experts/verification/${encodeId(id)}`,
    payload,
    { params: { type } },
  );
};