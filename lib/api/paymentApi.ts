// lib/api/paymentApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

export type TransactionStatus = "pending" | "success" | "failed" | "refunded" | "paid";
export type EscrowStatus      = "holding" | "released" | "refunded" | "disputed";

export interface ApiTransaction {
  id:               string;
  userId:           string;
  provider:         string;
  reference?:       string;
  transactionId?:   string;
  amount:           number;
  currency?:        string;
  status:           TransactionStatus;
  escrowStatus?:    EscrowStatus;
  purpose?:         string;
  resourceType?:    string;
  expertId?:        string;
  resourceId?:      string;
  metadata?:        unknown;
  providerResponse?: unknown;
  releasedAt?:      string | null;
  createdAt:        string;
  updatedAt?:       string;
  [key: string]:    unknown;
}

export interface TransactionMeta {
  total:      number;
  totalPages: number;
}

export interface ApiBalances {
  paystackBalance?:        number;
  korapayBalance?:         number;
  paystackEscrowsBalance?: number;
  korapayEscrowsBalance?:  number;
  [key: string]: unknown;
}

export interface RefundPayload {
  reason?: string;
}

export type ApiEscrow = ApiTransaction;

export interface ReleaseEscrowPayload {
  note?: string;
}

// ── Payout types ──────────────────────────────────────────

export interface ApiPayout {
  id:              string;
  recipientId:     string;
  recipientName:   string;
  recipientType:   "expert" | "tas";
  tasId?:          string;        // e.g. TAS-20260301-01
  experts?:        number;        // recruits count (TAS only)
  model2Amount?:   number;
  model1Amount?:   number;
  totalAmount?:    number;
  amount:          number;        // same as totalAmount, kept for compatibility
  status:          "paid" | "pending" | "failed";
  bankName?:       string;
  accountNumber?:  string;
  accountName?:    string;
  paidAt?:         string;
  createdAt:       string;
  [key: string]:   unknown;
}

export interface PayoutSummary {
  totalTasToPay:     number;
  totalPayoutAmount: number;
  averagePerTas:     number;
  paymentDate:       string;
}

export interface PayoutListMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ── Response wrappers ─────────────────────────────────────

interface TransactionListResponse {
  status:  boolean;
  message: string;
  data:    ApiTransaction[];
  meta:    TransactionMeta;
}

interface TransactionOneResponse {
  status:  boolean;
  message: string;
  data:    ApiTransaction;
}

interface BalancesResponse {
  status:  boolean;
  message: string;
  data:    ApiBalances;
}

interface PayoutListResponse {
  status:   boolean;
  message:  string;
  data:     ApiPayout[];
  summary?: PayoutSummary;
  meta?:    PayoutListMeta;
}

interface PayoutOneResponse {
  status:  boolean;
  message: string;
  data:    ApiPayout;
}

// ── Transaction API ───────────────────────────────────────

export const getTransactionHistory = async (): Promise<{ data: ApiTransaction[]; meta: TransactionMeta }> => {
  const { data } = await axiosInstance.get<TransactionListResponse>("/admin/escrows");
  return { data: data.data ?? [], meta: data.meta ?? { total: 0, totalPages: 1 } };
};

export const getEscrows = async (): Promise<{ data: ApiEscrow[]; meta: TransactionMeta }> => {
  const { data } = await axiosInstance.get<TransactionListResponse>("/admin/escrows");
  return { data: data.data ?? [], meta: data.meta ?? { total: 0, totalPages: 1 } };
};

export const getEscrowById = async (escrowId: string): Promise<ApiEscrow> => {
  const { data } = await axiosInstance.get<TransactionOneResponse>(
    `/finance/escrows/${encodeURIComponent(escrowId)}`
  );
  return data.data;
};

export const getEscrowsByJobId = async (jobId: string): Promise<ApiEscrow[]> => {
  const { data } = await axiosInstance.get<TransactionListResponse>(
    `/finance/escrows/by-job/${encodeURIComponent(jobId)}`
  );
  return data.data ?? [];
};

export const releaseEscrow = async (escrowId: string, note?: string): Promise<ApiEscrow> => {
  const { data } = await axiosInstance.post<TransactionOneResponse>(
    `/finance/escrows/${encodeURIComponent(escrowId)}/release`,
    { note: note ?? "" }
  );
  return data.data;
};

export const getTransactionById = async (id: string): Promise<ApiTransaction> => {
  const { data } = await axiosInstance.get<TransactionOneResponse>(`/admin/transaction/${id}`);
  return data.data;
};

export const refundTransaction = async (id: string, payload?: RefundPayload): Promise<ApiTransaction> => {
  const { data } = await axiosInstance.post<TransactionOneResponse>(
    `/admin/escrows/${id}/refund`,
    payload ?? {}
  );
  return data.data;
};

export const getBalances = async (): Promise<ApiBalances> => {
  const { data } = await axiosInstance.get<BalancesResponse>("/admin/balances");
  return data.data;
};

// ── Payout API ────────────────────────────────────────────

export const getPayouts = async (): Promise<{ data: ApiPayout[]; summary?: PayoutSummary; meta?: PayoutListMeta }> => {
  const { data } = await axiosInstance.get<PayoutListResponse>("/admin/payouts");
  return { data: data.data ?? [], summary: data.summary, meta: data.meta };
};

export const retryPayout = async (payoutId: string): Promise<ApiPayout> => {
  const { data } = await axiosInstance.post<PayoutOneResponse>(
    `/admin/payouts/${payoutId}/retry`,
    {}
  );
  return data.data;
};