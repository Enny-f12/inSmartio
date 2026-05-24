// lib/api/paymentApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

export type TransactionStatus = "pending" | "success" | "failed" | "refunded" | "paid";
export type EscrowStatus      = "holding" | "released" | "refunded" | "disputed";

export interface ApiTransaction {
  id:               string;
  userId:           string;
  provider:         string;           // "korapay" | "paystack"
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

// ── Escrow types (same shape as transaction) ──────────────
export type ApiEscrow = ApiTransaction;

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

// GET /admin/escrows — Transactions tab
export const getTransactionHistory = async (): Promise<{ data: ApiTransaction[]; meta: TransactionMeta }> => {
  const { data } = await axiosInstance.get<TransactionListResponse>("/admin/escrows");
  return { data: data.data ?? [], meta: data.meta ?? { total: 0, totalPages: 1 } };
};

// GET /admin/escrows — Escrow Releases tab (same endpoint)
export const getEscrows = async (): Promise<{ data: ApiEscrow[]; meta: TransactionMeta }> => {
  const { data } = await axiosInstance.get<TransactionListResponse>("/admin/escrows");
  return { data: data.data ?? [], meta: data.meta ?? { total: 0, totalPages: 1 } };
};

// GET /admin/escrows/:escrowId/release — single escrow release detail
export const getEscrowById = async (escrowId: string): Promise<ApiEscrow> => {
  const { data } = await axiosInstance.get<TransactionOneResponse>(
    `/admin/escrows/${escrowId}/release`
  );
  return data.data;
};

// GET /admin/transaction/:id
export const getTransactionById = async (id: string): Promise<ApiTransaction> => {
  const { data } = await axiosInstance.get<TransactionOneResponse>(`/admin/transaction/${id}`);
  return data.data;
};

// POST /admin/escrows/:id/refund
export const refundTransaction = async (id: string, payload?: RefundPayload): Promise<ApiTransaction> => {
  const { data } = await axiosInstance.post<TransactionOneResponse>(
    `/admin/escrows/${id}/refund`,
    payload ?? {}
  );
  return data.data;
};

// GET /admin/balances
export const getBalances = async (): Promise<ApiBalances> => {
  const { data } = await axiosInstance.get<BalancesResponse>("/admin/balances");
  return data.data;
};

// ── Payout API ────────────────────────────────────────────

// GET /admin/payouts
export const getPayouts = async (): Promise<ApiPayout[]> => {
  const { data } = await axiosInstance.get<PayoutListResponse>("/admin/payouts");
  return data.data ?? [];
};

// POST /admin/payouts/:payoutId/retry
export const retryPayout = async (payoutId: string): Promise<ApiPayout> => {
  const { data } = await axiosInstance.post<PayoutOneResponse>(
    `/admin/payouts/${payoutId}/retry`,
    {}
  );
  return data.data;
};