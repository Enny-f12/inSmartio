export type PayTab = "Transactions" | "Escrow Releases"  | "Refunds";
export const PAY_TABS: PayTab[] = ["Transactions", "Escrow Releases", "Refunds"];

export interface Transaction {
  id: string;
  date: string;
  type: string;
  user: string;
  amount: string;
  status: string;
  ref: string;
}

export interface EscrowRelease {
  id: string;
  jobId: string;
  expert: string;
  amount: string;
  status: string;
  date: string;
}

export interface Payout {
  id: string;
  recipient: string;
  type: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  date: string;
}

export const mockTransactions: Transaction[] = [
  { id: "t1", date: "15/03/2026", type: "Escrow In",  user: "Funke A.",   amount: "₦18,500",  status: "Held",     ref: "INV" },
  { id: "t2", date: "18/03/2026", type: "Escrow Out", user: "Adebayo S.", amount: "₦16,650",  status: "Released", ref: "PAY" },
  { id: "t3", date: "20/03/2026", type: "Commission", user: "Platform",   amount: "₦1,850",   status: "Revenue",  ref: "-"   },
  { id: "t4", date: "22/03/2026", type: "TAS Payout", user: "Chidi E.",   amount: "₦245,000", status: "Paid",     ref: "TAS" },
];

export const mockEscrowReleases: EscrowRelease[] = [
  { id: "e1", jobId: "JOB-001", expert: "Adebayo S.", amount: "₦16,650",  status: "Released", date: "16/03/2026" },
  { id: "e2", jobId: "JOB-002", expert: "Peter O.",   amount: "₦22,500",  status: "Pending",  date: "15/03/2026" },
  { id: "e3", jobId: "JOB-005", expert: "John D.",    amount: "₦10,800",  status: "Released", date: "09/03/2026" },
];

export const mockPayouts: Payout[] = [
  { id: "p1", recipient: "Adebayo S.", type: "Expert", amount: "₦16,650",  status: "Paid",    date: "16/03/2026" },
  { id: "p2", recipient: "Chidi E.",   type: "TAS",    amount: "₦245,000", status: "Paid",    date: "22/03/2026" },
  { id: "p3", recipient: "Mary K.",    type: "Expert", amount: "₦45,000",  status: "Pending", date: "12/03/2026" },
];