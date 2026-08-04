// components/mockData.ts
// Static mock data reflecting the wireframes in "REPORT MODULE – COMPLETE UPDATE".
// UI-only: no live API calls. Swap for real fetches when wiring up the backend.

export const dashboardKPIs = {
  totalUsers: { value: 15234, delta: 12 },
  jobs: { value: 8901, delta: 8 },
  revenue: { value: 4200000, delta: 15 },
  tasAgents: { value: 156, delta: 22 },
};

export const revenueTrend = [40000, 62000, 58000, 90000, 82000, 130000, 150000];
export const revenueTrendLabels = ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];

export const quickReports = [
  "User Growth",
  "Expert Details",
  "Verification Queue",
  "Revenue Summary",
  "Job Completion",
  "TAS Performance",
  "Dispute Analysis",
];

export const recentActivity = [
  { text: "TAS payout: Chidi E.", meta: "₦245,000" },
  { text: "Expert verified: Adebayo S.", meta: "" },
  { text: "Dispute resolved: CASE-2026-12", meta: "" },
  { text: "New TAS: Bola A.", meta: "" },
  { text: "Job completed: Plumbing", meta: "" },
];

export type Transaction = {
  id: string;
  date: string;
  time: string;
  type: "Escrow" | "Refund" | "Fee" | "Payout";
  client: string;
  expert: string;
  tas: string;
  amount: number;
  status: "Completed" | "Pending" | "Failed";
  originalValue: number;
  platformFee: number;
  tasCommission: number;
  netPayout: number;
  clientId: string;
  expertId: string;
  tasId: string;
  jobId: string;
  region: string;
  paymentModel: string;
};

export const transactions: Transaction[] = [
  {
    id: "TXN-2026-07-28-001", date: "28/07/2026", time: "14:30:12", type: "Escrow",
    client: "Funke A.", expert: "Chidi E.", tas: "Bola", amount: 25000, status: "Completed",
    originalValue: 25000, platformFee: 2500, tasCommission: 250, netPayout: 22250,
    clientId: "CLT-2026-01", expertId: "EXP-2026-03", tasId: "TAS-2026-12",
    jobId: "JOB-2026-07-28-042", region: "Mainland North (Ikeja)", paymentModel: "Model 2 (Commission)",
  },
  { id: "TXN-2026-07-27-002", date: "27/07/2026", time: "11:05:44", type: "Refund", client: "Adebayo E.", expert: "Emeka O.", tas: "—", amount: 10000, status: "Completed", originalValue: 10000, platformFee: 0, tasCommission: 0, netPayout: 10000, clientId: "CLT-2026-04", expertId: "EXP-2026-07", tasId: "—", jobId: "JOB-2026-07-27-011", region: "Island South (Lekki)", paymentModel: "Model 1 (Subscription)" },
  { id: "TXN-2026-07-26-003", date: "26/07/2026", time: "09:22:18", type: "Fee", client: "Grace I.", expert: "John D.", tas: "Chide", amount: 5000, status: "Completed", originalValue: 5000, platformFee: 500, tasCommission: 50, netPayout: 4450, clientId: "CLT-2026-09", expertId: "EXP-2026-11", tasId: "TAS-2026-04", jobId: "JOB-2026-07-26-008", region: "Mainland East (Yaba)", paymentModel: "Model 2 (Commission)" },
  { id: "TXN-2026-07-25-004", date: "25/07/2026", time: "16:48:02", type: "Payout", client: "—", expert: "Adebayo A.", tas: "Bola", amount: 35000, status: "Pending", originalValue: 35000, platformFee: 3500, tasCommission: 350, netPayout: 31150, clientId: "—", expertId: "EXP-2026-15", tasId: "TAS-2026-12", jobId: "JOB-2026-07-25-030", region: "Mainland North (Ikeja)", paymentModel: "Model 2 (Commission)" },
  { id: "TXN-2026-07-24-005", date: "24/07/2026", time: "08:10:55", type: "Escrow", client: "Funke A.", expert: "Emeka O.", tas: "—", amount: 40000, status: "Completed", originalValue: 40000, platformFee: 4000, tasCommission: 0, netPayout: 36000, clientId: "CLT-2026-01", expertId: "EXP-2026-07", tasId: "—", jobId: "JOB-2026-07-24-002", region: "Island South (Lekki)", paymentModel: "Model 1 (Subscription)" },
];

export type Expert = {
  name: string; phone: string; email: string; tier: 1 | 2 | 3;
  model: "M1" | "M2"; category: string; region: string; joined: string;
  status: "Active" | "Pending" | "Suspended";
};

export const experts: Expert[] = [
  { name: "Adebayo S.", phone: "080-1234-5678", email: "adebayo@e.com", tier: 2, model: "M2", category: "Plumbing", region: "MN-W", joined: "28/07/26", status: "Active" },
  { name: "Funke A.", phone: "080-2345-6789", email: "funke.a@e.com", tier: 1, model: "M1", category: "Cleaning", region: "IS-E", joined: "27/07/26", status: "Active" },
  { name: "Chidi E.", phone: "080-3456-7890", email: "chidi.e@e.com", tier: 3, model: "M2", category: "Auto Repair", region: "MN-N", joined: "27/07/26", status: "Pending" },
  { name: "Emeka O.", phone: "080-4567-8901", email: "emeka.o@e.com", tier: 1, model: "M1", category: "Tutoring", region: "MN-E", joined: "26/07/26", status: "Active" },
  { name: "Grace I.", phone: "080-5678-9012", email: "grace.i@e.com", tier: 2, model: "M2", category: "Cleaning", region: "IS-N", joined: "26/07/26", status: "Active" },
  { name: "John D.", phone: "080-6789-0123", email: "john.d@e.com", tier: 3, model: "M2", category: "Appliance", region: "MN-S", joined: "25/07/26", status: "Suspended" },
  { name: "Bola A.", phone: "080-7890-1234", email: "bola.a@e.com", tier: 2, model: "M1", category: "Hairdressing", region: "IS-W", joined: "25/07/26", status: "Active" },
];

export const expertTierTotals = { total: 3456, tier1: 1234, tier2: 1089, tier3: 1133 };

export type VerificationRow = {
  name: string; phone: string; email: string; tier: 1 | 2 | 3; docs: string;
  submitted: string; daysPending: number; officer: string; status: "Pending" | "Approved" | "Rejected";
};

export const verificationQueue: VerificationRow[] = [
  { name: "Adebayo S.", phone: "080-1234-5678", email: "adebayo@e.com", tier: 3, docs: "3/4", submitted: "22/07/26", daysPending: 6, officer: "Unassigned", status: "Pending" },
  { name: "Funke A.", phone: "080-2345-6789", email: "funke.a@e.com", tier: 2, docs: "2/2", submitted: "25/07/26", daysPending: 3, officer: "Chioma", status: "Pending" },
  { name: "Chidi E.", phone: "080-3456-7890", email: "chidi.e@e.com", tier: 1, docs: "1/1", submitted: "26/07/26", daysPending: 2, officer: "Olu", status: "Pending" },
  { name: "Emeka O.", phone: "080-4567-8901", email: "emeka.o@e.com", tier: 3, docs: "2/4", submitted: "20/07/26", daysPending: 8, officer: "Unassigned", status: "Pending" },
  { name: "Grace I.", phone: "080-5678-9012", email: "grace.i@e.com", tier: 2, docs: "2/2", submitted: "27/07/26", daysPending: 1, officer: "Chioma", status: "Pending" },
  { name: "John D.", phone: "080-6789-0123", email: "john.d@e.com", tier: 1, docs: "1/1", submitted: "28/07/26", daysPending: 0, officer: "Olu", status: "Pending" },
];

export const verificationKPIs = { total: 3456, pending: 156, approved: 3189, rejected: 111 };
export const verificationByTier = [
  { label: "Tier 1", value: 1234, pct: 36 },
  { label: "Tier 2", value: 1089, pct: 32 },
  { label: "Tier 3", value: 1133, pct: 32 },
];
export const rejectionReasons = [
  { label: "Incomplete Documents", value: 45, pct: 40 },
  { label: "NIN/BVN Mismatch", value: 34, pct: 31 },
  { label: "Police Clearance Expired", value: 32, pct: 29 },
];
export const officerWorkload = [
  { label: "Chioma", value: 234 },
  { label: "Olu", value: 198 },
  { label: "Unassigned", value: 156 },
];

export type TASRow = {
  name: string; phone: string; email: string; tier: number; expertsRecruited: number;
  active: number; earnings: number; zone: string; joined: string;
};

export const tasAgents: TASRow[] = [
  { name: "Bola Akin", phone: "080-1234-5678", email: "bola.a@e.com", tier: 5, expertsRecruited: 234, active: 198, earnings: 1200000, zone: "MN-W", joined: "15/03/26" },
  { name: "Chidi Eze", phone: "080-2345-6789", email: "chidi.e@e.com", tier: 4, expertsRecruited: 187, active: 156, earnings: 980000, zone: "IS-E", joined: "10/03/26" },
  { name: "Emeka Oka", phone: "080-3456-7890", email: "emeka.o@e.com", tier: 3, expertsRecruited: 156, active: 120, earnings: 720000, zone: "MN-E", joined: "09/03/26" },
  { name: "Funke Ade", phone: "080-4567-8901", email: "funke.a@e.com", tier: 4, expertsRecruited: 145, active: 110, earnings: 680000, zone: "MN-N", joined: "08/03/26" },
  { name: "Grace Ibe", phone: "080-5678-9012", email: "grace.i@e.com", tier: 2, expertsRecruited: 98, active: 76, earnings: 450000, zone: "IS-N", joined: "07/03/26" },
  { name: "John Dan", phone: "080-6789-0123", email: "john.d@e.com", tier: 3, expertsRecruited: 112, active: 89, earnings: 520000, zone: "MN-S", joined: "06/03/26" },
];

export const tasKPIs = { totalAgents: 156, expertsRecruited: 4567, totalEarnings: 12400000, avgEarnings: 79487 };

export type ScheduledReport = {
  name: string; type: string; freq: "Daily" | "Weekly" | "Monthly"; format: "PDF" | "Excel" | "CSV";
  recipients: string; lastRun: string;
};

export const scheduledReports: ScheduledReport[] = [
  { name: "Weekly Revenue", type: "Revenue Report", freq: "Weekly", format: "PDF", recipients: "finance@insmartio.com", lastRun: "27/07/26" },
  { name: "TAS Performance", type: "TAS Performance Report", freq: "Monthly", format: "Excel", recipients: "ops@insmartio.com", lastRun: "25/07/26" },
  { name: "Daily Transactions", type: "Transaction Detail Report", freq: "Daily", format: "CSV", recipients: "support@insmartio.com", lastRun: "28/07/26" },
  { name: "User Growth", type: "User Growth Report", freq: "Weekly", format: "PDF", recipients: "ceo@insmartio.com", lastRun: "26/07/26" },
  { name: "Dispute Analysis", type: "Dispute Analysis Report", freq: "Monthly", format: "PDF", recipients: "legal@insmartio.com", lastRun: "15/07/26" },
];

export const reportTypeOptions = [
  "Transaction Detail Report",
  "User Growth Report",
  "Expert Details Report",
  "Verification Report",
  "Revenue Report",
  "Job Completion Report",
  "TAS Performance Report",
  "Dispute Analysis Report",
];

export type ReportTemplate = {
  name: string; baseReport: string; used: number; createdBy: string;
};

export const reportTemplates: ReportTemplate[] = [
  { name: "Daily Finance View", baseReport: "Transaction Detail Report", used: 87, createdBy: "Super Admin" },
  { name: "TAS Payout Summary", baseReport: "TAS Performance Report", used: 23, createdBy: "Finance" },
  { name: "Expert Activity", baseReport: "Expert Details Report", used: 45, createdBy: "Ops Admin" },
  { name: "Weekly Revenue", baseReport: "Revenue Report", used: 156, createdBy: "Super Admin" },
];

export const templateColumns = [
  "Transaction ID", "Date", "Type", "Amount", "Fee", "TAS Commission",
  "Status", "Expert", "Client", "TAS Agent", "Job ID", "Region",
  "Cancellation Fee", "Refund", "Payment Model",
];

export const userGrowthKPIs = { newUsers: 1234, growthRate: 12, churnRate: 8, activeUsers: 8901 };
export const userGrowthByRegion = [
  { label: "MN-W", value: 456, pct: 37 },
  { label: "IS-E", value: 389, pct: 32 },
  { label: "MN-N", value: 312, pct: 25 },
  { label: "MN-E", value: 289, pct: 23 },
  { label: "IS-N", value: 234, pct: 19 },
];