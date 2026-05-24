// lib/api/disputeApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type DisputePriority = "HIGH" | "MEDIUM" | "LOW";
export type DisputeStatus   = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSE";

export interface DisputeParty {
  id:        string;
  statement: string;
  evidence:  string[];
}

export interface ApiDispute {
  id:              string;
  jobId:           string;
  date:            string;
  time:            string;
  priority:        DisputePriority;
  amountInEscrows: number;
  client:          DisputeParty;
  expert:          DisputeParty;
  chatId:          string;
  status?:         DisputeStatus;
  createdAt?:      string;
  updatedAt?:      string;
}

export interface CreateDisputePayload {
  jobId:           string;
  date:            string;
  time:            string;
  priority:        DisputePriority;
  amountInEscrows: number;
  client: { id: string; statement: string; evidence: string[] };
  expert: { id: string; statement: string; evidence: string[] };
  chatId:          string;
}

export interface UpdateDisputePayload extends Partial<CreateDisputePayload> {
  status?: DisputeStatus;
}

// ── Resolution enum — matches backend exactly ─────────────
export type ResolutionType =
  | "REFUND_EXPERT"
  | "REFUND_CLIENT"
  | "SPLIT_REFUND"
  | "PARTIAL_REFUND_EXPERT"
  | "PARTIAL_REFUND_CLIENT"
  | "DISMISS_DISPUTE"
  | "RE_PERFORM";

// POST /api/dispute/{id}/resolve
export interface ResolveDisputePayload {
  resolution: ResolutionType;
  reason:     string;
}

// POST /api/dispute/{id}/appeal
export interface AppealDisputePayload {
  reason: string;
}

interface DisputesResponse {
  status:  boolean;
  message: string;
  data:    ApiDispute[];
}

interface DisputeResponse {
  status:  boolean;
  message: string;
  data:    ApiDispute;
}

export const getAllDisputes = async (): Promise<ApiDispute[]> => {
  const { data } = await axiosInstance.get<DisputesResponse>("/dispute");
  return data.data ?? [];
};

export const getDisputeById = async (id: string): Promise<ApiDispute> => {
  const { data } = await axiosInstance.get<DisputeResponse>(`/dispute/${id}`);
  return data.data;
};

export const getDisputeByCaseId = async (caseId: string): Promise<ApiDispute> => {
  const { data } = await axiosInstance.get<DisputeResponse>(`/dispute/case/${caseId}`);
  return data.data;
};

export const createDispute = async (payload: CreateDisputePayload): Promise<ApiDispute> => {
  const { data } = await axiosInstance.post<DisputeResponse>("/dispute", payload);
  return data.data;
};

export const updateDispute = async (id: string, payload: UpdateDisputePayload): Promise<ApiDispute> => {
  const { data } = await axiosInstance.put<DisputeResponse>(`/dispute/${id}`, payload);
  return data.data;
};

export const deleteDispute = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/dispute/${id}`);
};

// POST /api/dispute/{id}/resolve — Submit Decision
export const resolveDispute = async (
  id:      string,
  payload: ResolveDisputePayload,
): Promise<ApiDispute> => {
  const { data } = await axiosInstance.post<DisputeResponse>(`/dispute/${id}/resolve`, payload);
  return data.data;
};

// POST /api/dispute/{id}/appeal — Appeal Later
export const appealDispute = async (
  id:      string,
  payload: AppealDisputePayload,
): Promise<ApiDispute> => {
  const { data } = await axiosInstance.post<DisputeResponse>(`/dispute/${id}/appeal`, payload);
  return data.data;
};