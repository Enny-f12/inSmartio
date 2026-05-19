// lib/api/disputeApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type DisputePriority = "HIGH" | "MEDIUM" | "LOW";
export type DisputeStatus   = "Open" | "In Progress" | "Resolved";

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
  mediator?:       Record<string, unknown>;
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
  status?:   DisputeStatus;
  mediator?: Record<string, unknown>;
}

// GET /api/dispute → data is array directly (no pagination)
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
  console.log(" Disputes API:", data);
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