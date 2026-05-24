// lib/api/paymentApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

export type TransactionStatus = "pending" | "success" | "failed" | "refunded";
export type TransactionType   = "payment" | "refund" | "escrow" | "withdrawal" | "payout";

export interface ApiTransaction {
  id:           string;
  reference?:   string;
  amount:       number;
  type:         TransactionType;
  status:       TransactionStatus;
  description?: string;
  userId?:      string;
  jobId?:       string;
  createdAt:    string;
  updatedAt?:   string;
  [key: string]: unknown;
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

// ── Escrow types ──────────────────────────────────────────
export interface ApiEscrow {
  id:           string;
  jobId:        string;
  expertId:     string;
  expertName:   string;
  clientName:   string;
  amount:       number;
  status:       "released" | "pending" | "disputed";
  releasedAt?:  string;
  createdAt:    string;
  meta?:        { total: number; page: number; limit: number };
  [key: string]: unknown;
}

export interface ReleaseEscrowPayload {
  reason?: string;
}

// ── Payout types ──────────────────────────────────────────
export interface ApiPayout {
  id:              string;
  recipientId:     string;
  recipientName:   string;
  recipientType:   "expert" | "tas";
  amount:          number;
  status:          "paid" | "pending" | "failed";
  bankName?:       string;
  accountNumber?:  string;
  paidAt?:         string;
  createdAt:       string;
  [key: string]:   unknown;
}

export interface PayoutListMeta {
  total: number;
  page:  number;
  limit: number;
}

// ── Response wrappers ─────────────────────────────────────
interface TransactionListResponse {
  status:  boolean;
  message: string;
  data:    ApiTransaction[];
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

interface EscrowListResponse {
  status:  boolean;
  message: string;
  data:    ApiEscrow[];
  meta?:   PayoutListMeta;
}

interface EscrowOneResponse {
  status:  boolean;
  message: string;
  data:    ApiEscrow;
}

interface PayoutListResponse {
  status:  boolean;
  message: string;
  data:    ApiPayout[];
  meta?:   PayoutListMeta;
}

interface PayoutOneResponse {
  status:  boolean;
  message: string;
  data:    ApiPayout;
}

// ── Transaction API ───────────────────────────────────────

// GET /api/admin/transaction-history
export const getTransactionHistory = async (): Promise<ApiTransaction[]> => {
  const { data } = await axiosInstance.get<TransactionListResponse>("/admin/escrows");
  return data.data ?? [];
};

// GET /api/admin/transaction/{id}
export const getTransactionById = async (id: string): Promise<ApiTransaction> => {
  const { data } = await axiosInstance.get<TransactionOneResponse>(`/admin/transaction/${id}`);
  return data.data;
};

// POST /api/admin/transaction/{id}/refund
export const refundTransaction = async (id: string, payload?: RefundPayload): Promise<ApiTransaction> => {
  const { data } = await axiosInstance.post<TransactionOneResponse>(
    `admin/escrows/${id}/refund`,
    payload ?? {}
  );
  return data.data;
};

// GET /api/admin/balances
export const getBalances = async (): Promise<ApiBalances> => {
  const { data } = await axiosInstance.get<BalancesResponse>("/admin/balances");
  return data.data;
};

// ── Escrow API ────────────────────────────────────────────

// GET /api/admin/escrows
export const getEscrows = async (): Promise<ApiEscrow[]> => {
  const { data } = await axiosInstance.get<EscrowListResponse>("/admin/escrows");
  return data.data ?? [];
};

// POST /api/admin/escrows/{escrowId}/release
export const releaseEscrow = async (escrowId: string, payload?: ReleaseEscrowPayload): Promise<ApiEscrow> => {
  const { data } = await axiosInstance.post<EscrowOneResponse>(
    `/admin/escrows/${escrowId}/release`,
    payload ?? {}
  );
  return data.data;
};

// ── Payout API ────────────────────────────────────────────

// GET /api/admin/payouts
export const getPayouts = async (): Promise<ApiPayout[]> => {
  const { data } = await axiosInstance.get<PayoutListResponse>("/admin/payouts");
  return data.data ?? [];
};

// POST /api/admin/payouts/{payoutId}/retry
export const retryPayout = async (payoutId: string): Promise<ApiPayout> => {
  const { data } = await axiosInstance.post<PayoutOneResponse>(
    `/admin/payouts/${payoutId}/retry`,
    {}
  );
  return data.data;
};