// lib/api/paymentApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

export type TransactionStatus = "pending" | "success" | "failed" | "refunded";
export type TransactionType   = "payment" | "refund" | "escrow" | "withdrawal" | "payout";

export interface ApiTransaction {
  id:          string;
  reference?:  string;
  amount:      number;
  type:        TransactionType;
  status:      TransactionStatus;
  description?: string;
  userId?:     string;
  jobId?:      string;
  createdAt:   string;
  updatedAt?:  string;
  [key: string]: unknown;
}

export interface ApiBalances {
  paystack?: {
    balance:  number;
    currency: string;
    [key: string]: unknown;
  };
  korapay?: {
    balance:  number;
    currency: string;
    [key: string]: unknown;
  };
  escrow?: {
    balance:  number;
    currency: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface RefundPayload {
  reason?: string;
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

// ── API functions ─────────────────────────────────────────

// GET /api/admin/transaction-history
export const getTransactionHistory = async (): Promise<ApiTransaction[]> => {
  const { data } = await axiosInstance.get<TransactionListResponse>("/admin/transaction-history");
  console.log("Transactions API:", data);
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
    `/admin/transaction/${id}/refund`,
    payload ?? {}
  );
  return data.data;
};

// GET /api/admin/balances
export const getBalances = async (): Promise<ApiBalances> => {
  const { data } = await axiosInstance.get<BalancesResponse>("/admin/balances");
  console.log("Balances API:", data);
  return data.data;
};