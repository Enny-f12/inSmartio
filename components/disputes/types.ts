// components/disputes/types.ts

export type DisputePriority = "HIGH" | "MEDIUM" | "LOW";
export type DisputeStatus   = "Open" | "In Progress" | "Resolved";
export type Resolution      = "full_expert" | "full_client" | "dismiss" | "partial" | "reperform" | null;

export interface MediationNote {
  timestamp: string;
  note:      string;
}

export interface Dispute {
  id:              string;
  jobId:           string;
  parties:         string;
  issue:           string;
  priority:        DisputePriority;
  status:          DisputeStatus;
  opened:          string;
  escrowAmount:    string;
  clientStatement: string;
  expertStatement: string;
  clientEvidence:  string[];
  expertEvidence:  string[];
  chatId:          string;
  mediationNotes:  MediationNote[];
}

export const PAGE_SIZE = 10;