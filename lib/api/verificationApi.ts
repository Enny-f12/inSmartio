// lib/api/verificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type VerificationTier   = "tier1" | "tier2" | "tier3";
export type VerificationType   = "expert" | "tas";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationDocument {
  id?:        string | null;
  publicId?:  string | null;
  url?:       string;
  date?:      string;
  status?:    string;
  type?:      string;
  name?:      string;
  verify?:    boolean;
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
  id:             string;  // injected from `id` field if present, else email
  name:           string;
  email:          string;
  phone?:         string;
  tier?:          string;  // "1" | "2" | "3" from backend
  status:         string;  // account status — NOT verification status
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
  id:                    string;
  name:                  string;
  email:                 string;
  phone:                 string;
  avatar:                string | null;
  gender:                string;
  bio:                   string;
  role:                  string;
  roles:                 string[];
  status:                string;
  currentMode:           string;
  category:              string | Record<string, unknown>;
  skill:                 string[] | Record<string, unknown>;
  services:              string | null;
  tier:                  number | string;
  verification:          string;
  verify:                boolean | string;
  commission:            number | null;
  paymentModel:          string;
  subscriptionActive:    boolean;
  subscriptionExpiresAt: string | null;
  referral:              string | null;
  lastModelSwitchDate:   string | null;
  createdAt:             string;
  updatedAt:             string;
  location: {
    city?:    string;
    state?:   string;
    address?: string;
    area?:    string;
    country?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document: Record<string, any> | any[];
  bankDetails: {
    bankName:      string;
    accountName:   string;
    accountNumber: string;
    bvn?:          string;
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
  // Backend may or may not include `id` — we handle both cases
  data:    (Partial<ApiVerificationSummary> & { email: string; name: string })[];
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

// ── ID encoding ───────────────────────────────────────────────────────────────
// Real ID format: "EXPERT-032-05-26" (dashes only — safe for URL path as-is)
// Legacy format:  "EXPERT-032/05/26" (slashes must be encoded)
// We encode each slash-separated segment, joining with %2F.
// Dash-only IDs pass through unchanged since they have no slashes to encode.
export const encodeId = (id: string) =>
  id.split("/").map(encodeURIComponent).join("%2F");

// ── Tier normalisation ────────────────────────────────────────────────────────
export function normaliseTier(raw: unknown): VerificationTier {
  if (raw === "tier1" || raw === "tier2" || raw === "tier3") return raw;
  const n = Number(raw);
  if (n === 3) return "tier3";
  if (n === 2) return "tier2";
  return "tier1";
}

// ── Verification status normalisation ────────────────────────────────────────
// `status` on the list is the USER ACCOUNT status ("active", "inactive", "pending").
// Only `verify` determines whether a verification is approved.
//   verify: true / "approved" / "verified"  --> approved
//   verify: "rejected"                      --> rejected
//   everything else                         --> pending
export function normaliseVerificationStatus(
  status:  string,
  verify?: boolean | string,
): VerificationStatus {
  if (verify === true) return "approved";
  if (typeof verify === "string") {
    const v = verify.toLowerCase();
    if (v === "approved" || v === "verified") return "approved";
    if (v === "rejected") return "rejected";
  }
  const s = (status ?? "").toLowerCase();
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

// GET /api/admin/experts/verification
// Injects a stable `id`:
//   1. Use `id` field from backend if present (preferred)
//   2. Fall back to `email` (unique, works for detail endpoint lookup by email)
export const getAllVerifications = async (): Promise<ApiVerificationSummary[]> => {
  const { data } = await axiosInstance.get<VerificationListResponse>(
    "/admin/experts/verification"
  );
  return (data.data ?? []).map((item, index) => ({
    documents:      [],
    totalDocuments: 0,
    status:         "pending",
    submitted:      "",
    ...item,
    // id priority: backend id field > email > fallback index string
    id: (item as Record<string, unknown>).id as string
        ?? item.email
        ?? `item-${index}`,
  })) as ApiVerificationSummary[];
};

// GET /api/admin/experts/verification/{id}?type=expert|tas
// ID format: "EXPERT-032-05-26" (dashes) or legacy "EXPERT-032/05/26" (slashes)
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