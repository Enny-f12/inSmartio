// app/(dashboard)/dispute/types.ts

export type Priority      = "HIGH" | "MEDIUM" | "LOW";
export type DisputeStatus = "Open" | "In Progress" | "Resolved";
export type Resolution    = "full_expert" | "full_client" | "dismiss" | "partial" | "reperform" | null;

export interface MediationNote {
  timestamp: string;
  note: string;
}

export interface Dispute {
  id: string;
  jobId: string;
  parties: string;
  issue: string;
  priority: Priority;
  status: DisputeStatus;
  opened: string;
  escrowAmount: string;
  clientName: string;
  clientStatement: string;
  expertName: string;
  expertStatement: string;
  mediationNotes: MediationNote[];
}

export const PAGE_SIZE = 10;

export const mockDisputes: Dispute[] = [
  {
    id: "CASE-001", jobId: "JOB-004", parties: "Adeola vs Mary",
    issue: "Quality", priority: "HIGH", status: "Open",
    opened: "21/03/2026 10:30", escrowAmount: "₦50,000",
    clientName: "Adeola B.", expertName: "Mary K.",
    clientStatement: "The plumber fixed the leak but damaged the cabinet.",
    expertStatement: "The cabinet was already damaged. I have photos from before.",
    mediationNotes: [
      { timestamp: "20/03 14:30", note: "Called both parties. Expert insists cabinet was pre-damaged. Client denies." },
      { timestamp: "20/03 15:45", note: "Expert sent before photos. Shows some wear but not clear if same spot." },
    ],
  },
  {
    id: "CASE-002", jobId: "JOB-007", parties: "Tunde vs Peter",
    issue: "No-show", priority: "MEDIUM", status: "In Progress",
    opened: "20/03/2026 09:00", escrowAmount: "₦25,000",
    clientName: "Tunde A.", expertName: "Peter O.",
    clientStatement: "Expert never showed up on the agreed day. No call, no message.",
    expertStatement: "I had an emergency and messaged the client the next morning.",
    mediationNotes: [
      { timestamp: "21/03 10:00", note: "Reviewed chat logs. Expert message sent 18 hours after scheduled time." },
    ],
  },
  {
    id: "CASE-003", jobId: "JOB-012", parties: "Chioma vs John",
    issue: "Payment", priority: "HIGH", status: "Open",
    opened: "19/03/2026 14:00", escrowAmount: "₦15,000",
    clientName: "Chioma K.", expertName: "John D.",
    clientStatement: "Work was incomplete but expert is demanding full payment.",
    expertStatement: "I completed everything in the agreed scope. Client added extra tasks.",
    mediationNotes: [
      { timestamp: "20/03 09:30", note: "Reviewed job scope document. Extra tasks not included in original agreement." },
      { timestamp: "20/03 11:00", note: "Both parties agreed scope was ambiguous. Mediation ongoing." },
    ],
  },
  {
    id: "CASE-004", jobId: "JOB-015", parties: "Funke vs Ade",
    issue: "Scope", priority: "LOW", status: "Resolved",
    opened: "15/03/2026 11:30", escrowAmount: "₦12,000",
    clientName: "Funke A.", expertName: "Adebayo S.",
    clientStatement: "Expert refused to clean the balcony which was part of the deal.",
    expertStatement: "Balcony cleaning was not listed in the job description.",
    mediationNotes: [
      { timestamp: "16/03 10:00", note: "Job description reviewed. Balcony not explicitly mentioned." },
      { timestamp: "16/03 14:00", note: "Partial refund of ₦2,000 agreed by both parties. Case closed." },
    ],
  },
];