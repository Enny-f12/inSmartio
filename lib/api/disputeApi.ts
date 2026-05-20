// lib/api/disputeApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────
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
  createdAt?:      string;
  updatedAt?:      string;
}

// ── Create payload ────────────────────────────────────────
// POST /api/dispute
// Response: { status: true, message: string, data: ApiDispute }
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

// ── Update payload ────────────────────────────────────────
// PUT /api/dispute/{id}
// Used by frontend for status changes: Open → In Progress
// Response: { status: true, message: string, data: ApiDispute }
export interface UpdateDisputePayload extends Partial<CreateDisputePayload> {
  status?: DisputeStatus;
}

// ── PROPOSED: Resolve payload ─────────────────────────────
// POST /api/dispute/{id}/resolve
// Backend handles escrow release + sets status to "Resolved" automatically
// Request:
// {
//   resolution: "full_expert" | "full_client" | "dismiss" | "partial_70" | "reperform",
//   reason?: string
// }
// Response: { status: true, message: "Dispute resolved successfully", data: ApiDispute }
export type ResolutionType =
  | "full_expert"    // Full payment to expert
  | "full_client"    // Full refund to client
  | "dismiss"        // Dismiss dispute
  | "partial_70"     // Partial payment (70%)
  | "reperform";     // Re-performance ordered

export interface ResolveDisputePayload {
  resolution: ResolutionType;
  reason?:    string;
}

// ── Response wrappers ─────────────────────────────────────
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

// ── API functions ─────────────────────────────────────────

// GET /api/dispute
export const getAllDisputes = async (): Promise<ApiDispute[]> => {
  const { data } = await axiosInstance.get<DisputesResponse>("/dispute");
  console.log("📋 Disputes API:", data);
  return data.data ?? [];
};

// GET /api/dispute/{id}
export const getDisputeById = async (id: string): Promise<ApiDispute> => {
  const { data } = await axiosInstance.get<DisputeResponse>(`/dispute/${id}`);
  return data.data;
};

// GET /api/dispute/case/{caseId}
export const getDisputeByCaseId = async (caseId: string): Promise<ApiDispute> => {
  const { data } = await axiosInstance.get<DisputeResponse>(`/dispute/case/${caseId}`);
  return data.data;
};

// POST /api/dispute
export const createDispute = async (payload: CreateDisputePayload): Promise<ApiDispute> => {
  const { data } = await axiosInstance.post<DisputeResponse>("/dispute", payload);
  return data.data;
};

// PUT /api/dispute/{id}
export const updateDispute = async (id: string, payload: UpdateDisputePayload): Promise<ApiDispute> => {
  const { data } = await axiosInstance.put<DisputeResponse>(`/dispute/${id}`, payload);
  return data.data;
};

// DELETE /api/dispute/{id}
export const deleteDispute = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/dispute/${id}`);
};

// PROPOSED: POST /api/dispute/{id}/resolve
export const resolveDispute = async (id: string, payload: ResolveDisputePayload): Promise<ApiDispute> => {
  const { data } = await axiosInstance.post<DisputeResponse>(`/dispute/${id}/resolve`, payload);
  return data.data;
};