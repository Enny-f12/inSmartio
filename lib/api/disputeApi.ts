// lib/api/disputeApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type DisputePriority = "HIGH" | "MEDIUM" | "LOW";
export type DisputeStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSE";

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

// POST /api/dispute/{id}/appeal
// Used for: Submit Decision, Appeal Later
export interface AppealDisputePayload {
  reason: string;
}

export type ResolutionType =
  | "full_expert"
  | "full_client"
  | "dismiss"
  | "partial_70"
  | "reperform";

// Submit Decision extends appeal with resolution type
export interface SubmitDecisionPayload extends AppealDisputePayload {
  resolution: ResolutionType;
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

// POST /api/dispute/{id}/appeal — used for submit decision AND appeal later
export const appealDispute = async (
  id:      string,
  payload: AppealDisputePayload,
): Promise<ApiDispute> => {
  const { data } = await axiosInstance.post<DisputeResponse>(`/dispute/${id}/appeal`, payload);
  return data.data;
};