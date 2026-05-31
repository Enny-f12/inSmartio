// lib/api/disputeApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type DisputePriority = "HIGH" | "MEDIUM" | "LOW";
export type DisputeStatus   = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSE";

export interface MediationNote {
  date: string;
  time: string;
  note: string;
}

export interface DisputeParty {
  name:      string;
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
  chatId:          string | null;
  mediation:       MediationNote;   // ← object, not array
  status?:         DisputeStatus;
  resolution?:     string | null;
  decisionReason?: string | null;
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

export type ResolutionType =
  | "REFUND_EXPERT"
  | "REFUND_CLIENT"
  | "SPLIT_REFUND"
  | "PARTIAL_REFUND_EXPERT"
  | "PARTIAL_REFUND_CLIENT"
  | "DISMISS_DISPUTE"
  | "RE_PERFORM";

export interface ResolveDisputePayload {
  resolution: ResolutionType;
  reason:     string;
}

export interface AppealDisputePayload {
  reason: string;
}

// PUT /api/dispute/{id}/mediation — single mediation object
export interface AddMediationPayload {
  mediation: MediationNote;
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

export const resolveDispute = async (
  id:      string,
  payload: ResolveDisputePayload,
): Promise<ApiDispute> => {
  const { data } = await axiosInstance.post<DisputeResponse>(`/dispute/${id}/resolve`, payload);
  return data.data;
};

export const appealDispute = async (
  id:      string,
  payload: AppealDisputePayload,
): Promise<ApiDispute> => {
  const { data } = await axiosInstance.post<DisputeResponse>(`/dispute/${id}/appeal`, payload);
  return data.data;
};

// ✅ Changed to PUT — sends single mediation object matching backend shape:
// { mediation: { date: "2026-05-19", time: "14:30", note: "..." } }
export const addMediationNote = async (
  id:      string,
  payload: AddMediationPayload,
): Promise<ApiDispute> => {
  const { data } = await axiosInstance.put<DisputeResponse>(`/dispute/${id}/mediation`, payload);
  return data.data;
};