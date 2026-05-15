// ── Types ──────────────────────────────────────────────────
export type PayTab = "Transactions" | "Escrow Releases" | "Payouts" | "Refunds";

export interface Transaction {
  id: string;
  date: string;
  type: "Escrow In" | "Escrow Out" | "Commission" | "TAS Payout" | "Refund";
  user: string;
  amount: string;
  status: "Held" | "Released" | "Revenue" | "Paid" | "Refunded" | "Pending";
  ref: string;
}

export interface EscrowRow {
  id: string;
  jobId: string;
  client: string;
  expert: string;
  amount: string;
  dateLeft: string;
  selected?: boolean;
}

export interface PayoutRow {
  id: string;
  recipient: string;
  role: "Expert" | "TAS";
  bank: string;
  amount: string;
  date: string;
  status: "Paid" | "Pending" | "Failed";
}

// ── Constants ──────────────────────────────────────────────
export const PAY_TABS: PayTab[] = ["Transactions", "Escrow Releases", "Payouts", "Refunds"];
export const PAGE_SIZE = 10;

// ── Mock Data ──────────────────────────────────────────────
export const mockTransactions: Transaction[] = [
  { id: "TXN-001", date: "15/03/2026", type: "Escrow In",  user: "Funke A.",   amount: "₦18,500",  status: "Held",     ref: "INV" },
  { id: "TXN-002", date: "18/03/2026", type: "Escrow Out", user: "Adebayo S.", amount: "₦16,650",  status: "Released", ref: "PAY" },
  { id: "TXN-003", date: "20/03/2026", type: "Commission", user: "Platform",   amount: "₦1,850",   status: "Revenue",  ref: "-"   },
  { id: "TXN-004", date: "22/03/2026", type: "TAS Payout", user: "Chidi E.",   amount: "₦245,000", status: "Paid",     ref: "TAS" },
  { id: "TXN-005", date: "23/03/2026", type: "Escrow In",  user: "Adeola B.",  amount: "₦50,000",  status: "Held",     ref: "INV" },
  { id: "TXN-006", date: "24/03/2026", type: "Escrow Out", user: "Mary K.",    amount: "₦45,000",  status: "Released", ref: "PAY" },
  { id: "TXN-007", date: "25/03/2026", type: "Commission", user: "Platform",   amount: "₦5,000",   status: "Revenue",  ref: "-"   },
  { id: "TXN-008", date: "26/03/2026", type: "Refund",     user: "Tunde A.",   amount: "₦12,000",  status: "Refunded", ref: "REF" },
];

export const mockEscrow: EscrowRow[] = [
  { id: "e1", jobId: "Job-001", client: "Funke A.",   expert: "Adebayo S.", amount: "₦18,500", dateLeft: "2 days" },
  { id: "e2", jobId: "Job-002", client: "Chinedu O.", expert: "Peter O.",   amount: "₦25,000", dateLeft: "1 day"  },
  { id: "e3", jobId: "Job-003", client: "Chioma K.",  expert: "Mary K.",    amount: "₦15,000", dateLeft: "3 days" },
  { id: "e4", jobId: "Job-004", client: "Adeola B.",  expert: "Mary K.",    amount: "₦50,000", dateLeft: "2 days" },
  { id: "e5", jobId: "Job-005", client: "Tunde A.",   expert: "John D.",    amount: "₦12,000", dateLeft: "3 days" },
  { id: "e6", jobId: "Job-006", client: "Mayowa F.",  expert: "Josiah O.",  amount: "₦30,000", dateLeft: "2 days" },
];

export const mockPayouts: PayoutRow[] = [
  { id: "p1", recipient: "Adebayo S.", role: "Expert", bank: "GTB **** 4523",        amount: "₦16,650",  date: "18/03/2026", status: "Paid"    },
  { id: "p2", recipient: "Mary K.",    role: "Expert", bank: "Access **** 7812",     amount: "₦45,000",  date: "24/03/2026", status: "Paid"    },
  { id: "p3", recipient: "Chidi E.",   role: "TAS",    bank: "Zenith **** 3301",     amount: "₦245,000", date: "22/03/2026", status: "Paid"    },
  { id: "p4", recipient: "Peter O.",   role: "Expert", bank: "UBA **** 9910",        amount: "₦22,500",  date: "25/03/2026", status: "Pending" },
  { id: "p5", recipient: "Bola A.",    role: "TAS",    bank: "GTB **** 1120",        amount: "₦98,000",  date: "26/03/2026", status: "Pending" },
  { id: "p6", recipient: "John D.",    role: "Expert", bank: "First Bank **** 5567", amount: "₦10,800",  date: "09/03/2026", status: "Failed"  },
];