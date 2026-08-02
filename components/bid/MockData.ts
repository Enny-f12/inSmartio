import type {
  Bid,
  BidKPISummary,
  CancellationFeeRecord,
  CancellationFeeSummary,
  ExpertDispute,
  ClientDispute,
  NotificationLog,
  PaginatedResponse,
} from "@/components/bid/types";

// ─── KPI 

export const MOCK_KPI: BidKPISummary = {
  totalBids: 12847,
  totalBidsDelta: 8,
  activeBids: 3421,
  activeBidsDelta: -5,
  priceRequests: 892,
  priceRequestsDelta: 12,
  rejected: 1289,
  rejectedDelta: -3,
  cancellationFees: 156,
  cancellationFeesDelta: 5,
  cancellationFeeRate: 12.4, 
};

// ─── Bids

export const MOCK_BIDS: Bid[] = [
  {
    id: "BID-001",
    jobId: "JOB-01",
    expert: { id: "EXP-001", name: "Adebayo K.", phone: "+234 801 234 5678", rating: 4.8, verificationTier: "Tier 2", cancellationFeesReceived: 0 },
    client: { id: "CLT-001", name: "Funke A.", phone: "+234 802 345 6789", verificationTier: "Tier 1", jobsCompleted: 12, cancellationFeesPaid: 0 },
    originalBid: 18500,
    step: 7,
    status: "en_route",
    hasPriceRequest: false,
    flags: [],
    createdAt: "2026-03-14T10:23:00Z",
  },
  {
    id: "BID-002",
    jobId: "JOB-01",
    expert: { id: "EXP-002", name: "Peter O.", phone: "+234 803 456 7890", rating: 4.5, verificationTier: "Tier 1", cancellationFeesReceived: 0 },
    client: { id: "CLT-001", name: "Funke A.", phone: "+234 802 345 6789", verificationTier: "Tier 1", jobsCompleted: 12, cancellationFeesPaid: 0 },
    originalBid: 22000,
    step: 2,
    status: "active_bid",
    hasPriceRequest: false,
    flags: [],
    createdAt: "2026-03-14T10:25:00Z",
  },
  {
    id: "BID-003",
    jobId: "JOB-02",
    expert: { id: "EXP-003", name: "Mary E.", phone: "+234 804 567 8901", rating: 4.2, verificationTier: "Tier 1", cancellationFeesReceived: 0 },
    client: { id: "CLT-002", name: "Chidi N.", phone: "+234 805 678 9012", verificationTier: "Tier 2", jobsCompleted: 8, cancellationFeesPaid: 0 },
    originalBid: 35000,
    step: 5,
    status: "price_rejected",
    hasPriceRequest: true,
    requestedIncrease: 42000,
    requestedIncreasePercent: 20,
    flags: [{ id: "FLAG-001", reason: "Client rejected multiple increases from same job", priority: "MEDIUM", status: "open", createdAt: "2026-03-14T11:00:00Z" }],
    createdAt: "2026-03-13T09:00:00Z",
  },
  {
    id: "BID-004",
    jobId: "JOB-03",
    expert: { id: "EXP-008", name: "Bola A.", phone: "+234 801 234 5678", rating: 4.7, verificationTier: "Tier 2", cancellationFeesReceived: 10000 },
    client: { id: "CLT-012", name: "Kemi O.", phone: "+234 802 345 6789", verificationTier: "Tier 2", jobsCompleted: 8, cancellationFeesPaid: 10000 },
    originalBid: 100000,
    step: "site",
    status: "cancelled_fee_applied",
    hasPriceRequest: true,
    requestedIncrease: 120000,
    requestedIncreasePercent: 20,
    cancellationFee: 10000,
    flags: [
      { id: "FLAG-002", reason: "Cancellation fee applied (Situation B2)", priority: "MEDIUM", status: "open", createdAt: "2026-03-14T15:00:00Z" },
      { id: "FLAG-003", reason: "Client has rejected price increases on site multiple times", priority: "MEDIUM", status: "open", createdAt: "2026-03-14T15:01:00Z" },
    ],
    createdAt: "2026-03-14T10:23:00Z",
    step4ResponseAt: "2026-03-14T10:52:00Z",
    step5DecisionAt: "2026-03-14T11:00:00Z",
    siteArrivalAt: "2026-03-14T14:30:00Z",
    siteArrivalDetails: {
      arrivalTime: "2026-03-14T14:30:00Z",
      inspectionCompletedAt: "2026-03-14T14:45:00Z",
      expertAssessment: "Additional work required (concealed damage behind wall)",
      proposedNewPrice: 120000,
      proposedIncreasePercent: 20,
      clientResponse: "rejected",
      clientResponseAt: "2026-03-14T14:50:00Z",
      situation: "B2",
      cancellationFee: {
        originalJobValue: 100000,
        calculationPercentage: 25,
        calculatedAmount: 25000,
        feeCap: 10000,
        finalFee: 10000,
        clientRefund: 90000,
        expertPayout: 10000,
      },
      evidenceUrls: ["/evidence/photo1.jpg", "/evidence/photo2.jpg", "/evidence/video1.mp4"],
    },
  },
  {
    id: "BID-005",
    jobId: "JOB-03",
    expert: { id: "EXP-005", name: "Chidi M.", phone: "+234 806 789 0123", rating: 4.9, verificationTier: "Tier 2", cancellationFeesReceived: 0 },
    client: { id: "CLT-003", name: "Adeola B.", phone: "+234 807 890 1234", verificationTier: "Tier 1", jobsCompleted: 5, cancellationFeesPaid: 0 },
    originalBid: 45000,
    step: 3,
    status: "selected",
    hasPriceRequest: false,
    flags: [],
    createdAt: "2026-03-12T08:00:00Z",
  },
  {
    id: "BID-006",
    jobId: "JOB-04",
    expert: { id: "EXP-006", name: "Emeka T.", phone: "+234 808 901 2345", rating: 4.6, verificationTier: "Tier 2", cancellationFeesReceived: 8000 },
    client: { id: "CLT-004", name: "Amaka S.", phone: "+234 809 012 3456", verificationTier: "Tier 1", jobsCompleted: 3, cancellationFeesPaid: 0 },
    originalBid: 75000,
    step: 4,
    status: "price_negotiation",
    hasPriceRequest: true,
    requestedIncrease: 90000,
    requestedIncreasePercent: 20,
    flags: [{ id: "FLAG-004", reason: "Requested price increase >100%", priority: "HIGH", status: "open", createdAt: "2026-03-14T09:00:00Z" }],
    createdAt: "2026-03-11T14:00:00Z",
  },
];

export const MOCK_BIDS_RESPONSE: PaginatedResponse<Bid> = {
  data: MOCK_BIDS,
  total: 6,
  page: 1,
  limit: 20,
  totalPages: 1,
};

// ─── Cancellation Fees 

export const MOCK_CANCELLATION_FEES: CancellationFeeRecord[] = [
  {
    jobId: "JOB-04",
    expert: { id: "EXP-008", name: "Bola A.", phone: "+234 801 234 5678", rating: 4.7, verificationTier: "Tier 2", cancellationFeesReceived: 10000 },
    client: { id: "CLT-012", name: "Kemi O.", phone: "+234 802 345 6789", verificationTier: "Tier 2", jobsCompleted: 8, cancellationFeesPaid: 10000 },
    originalAmount: 100000,
    requestedAmount: 120000,
    increasePercent: 20,
    feeApplied: 10000,
    date: "14/03/2026",
    adminVerified: false,
    refundStatus: "processed",
    refundDate: "15/03/2026",
    refundTransactionId: "REF-20260315-001",
    payoutStatus: "paid",
    payoutDate: "15/03/2026",
    payoutTransactionId: "PAY-20260315-045",
    siteInspectionNotes: "Upon arrival, discovered concealed water damage behind wall. Additional 3 hours of work required.",
    evidenceUrls: ["/evidence/photo1.jpg", "/evidence/photo2.jpg", "/evidence/video1.mp4"],
  },
  {
    jobId: "JOB-07",
    expert: { id: "EXP-009", name: "John D.", phone: "+234 803 345 6789", rating: 4.3, verificationTier: "Tier 1", cancellationFeesReceived: 18000 },
    client: { id: "CLT-005", name: "Tunde F.", phone: "+234 804 456 7890", verificationTier: "Tier 1", jobsCompleted: 4, cancellationFeesPaid: 10000 },
    originalAmount: 50000,
    requestedAmount: 70000,
    increasePercent: 40,
    feeApplied: 10000,
    date: "13/03/2026",
    adminVerified: true,
    refundStatus: "processed",
    refundDate: "14/03/2026",
    refundTransactionId: "REF-20260314-002",
    payoutStatus: "paid",
    payoutDate: "14/03/2026",
    payoutTransactionId: "PAY-20260314-032",
    siteInspectionNotes: "Job scope was significantly underestimated. Additional materials required.",
    evidenceUrls: ["/evidence/photo3.jpg"],
  },
  {
    jobId: "JOB-09",
    expert: { id: "EXP-003", name: "Mary K.", phone: "+234 805 567 8901", rating: 4.1, verificationTier: "Tier 1", cancellationFeesReceived: 3750 },
    client: { id: "CLT-001", name: "Funke A.", phone: "+234 802 345 6789", verificationTier: "Tier 1", jobsCompleted: 12, cancellationFeesPaid: 3750 },
    originalAmount: 15000,
    requestedAmount: 18000,
    increasePercent: 20,
    feeApplied: 3750,
    date: "12/03/2026",
    adminVerified: true,
    refundStatus: "processed",
    payoutStatus: "paid",
    siteInspectionNotes: "Pipes were more corroded than initially assessed.",
    evidenceUrls: [],
  },
  {
    jobId: "JOB-11",
    expert: { id: "EXP-010", name: "Peter L.", phone: "+234 806 678 9012", rating: 3.9, verificationTier: "Tier 1", cancellationFeesReceived: 2000 },
    client: { id: "CLT-002", name: "Chidi N.", phone: "+234 805 678 9012", verificationTier: "Tier 2", jobsCompleted: 8, cancellationFeesPaid: 2000 },
    originalAmount: 8000,
    requestedAmount: 10000,
    increasePercent: 25,
    feeApplied: 2000,
    date: "11/03/2026",
    adminVerified: false,
    refundStatus: "pending",
    payoutStatus: "pending",
    siteInspectionNotes: "Client refused to allow additional work.",
    evidenceUrls: [],
  },
];

export const MOCK_CANCELLATION_FEES_RESPONSE: PaginatedResponse<CancellationFeeRecord> = {
  data: MOCK_CANCELLATION_FEES,
  total: 4,
  page: 1,
  limit: 20,
  totalPages: 1,
};

export const MOCK_CANCELLATION_SUMMARY: CancellationFeeSummary = {
  totalCancellations: 156,
  totalFeesCollected: 1248000,
  averageFee: 8000,
  minFee: 2000,
  maxFee: 10000,
  topReasons: [
    { reason: "Concealed damage", percentage: 45 },
    { reason: "Underestimated job", percentage: 32 },
    { reason: "Material cost increase", percentage: 23 },
  ],
};

// ─── Disputes 
export const MOCK_EXPERT_DISPUTES: ExpertDispute[] = [
  {
    expertId: "EXP-008",
    expertName: "Bola A.",
    totalSiteVisits: 5,
    cancellationRate: 60,
    exceedsThreshold: true,
    cancellationHistory: [
      { date: "14/03/2026", jobId: "JOB-004", fee: 10000, reason: "Client rejected price increase" },
      { date: "10/03/2026", jobId: "JOB-012", fee: 8000, reason: "Client rejected price increase" },
      { date: "05/03/2026", jobId: "JOB-018", fee: 6000, reason: "Client rejected price increase" },
    ],
  },
];

export const MOCK_CLIENT_DISPUTES: ClientDispute[] = [
  {
    clientId: "CLT-012",
    clientName: "Kemi O.",
    totalSiteVisits: 3,
    rejectionRate: 66,
    exceedsThreshold: true,
    cancellationHistory: [
      { date: "14/03/2026", jobId: "JOB-004", fee: 10000, reason: "Client rejected price increase" },
      { date: "07/03/2026", jobId: "JOB-009", fee: 5000, reason: "Client rejected price increase" },
    ],
  },
];

// ─── Notification Log 

export const MOCK_NOTIFICATIONS: NotificationLog[] = [
  { id: "NOTIF-001", timestamp: "2026-03-14T10:23:00Z", recipient: "Expert Bola", type: "in_app", content: "You have been selected for JOB-004", status: "sent" },
  { id: "NOTIF-002", timestamp: "2026-03-14T10:25:00Z", recipient: "Client Kemi", type: "push", content: "Expert requested price increase", status: "sent" },
  { id: "NOTIF-003", timestamp: "2026-03-14T10:50:00Z", recipient: "Client Kemi", type: "sms", content: "Price increase notification for JOB-004", status: "sent" },
  { id: "NOTIF-004", timestamp: "2026-03-14T10:52:00Z", recipient: "Client Kemi", type: "email", content: "Price increase detail for JOB-004", status: "sent" },
  { id: "NOTIF-005", timestamp: "2026-03-14T10:55:00Z", recipient: "Expert Bola", type: "push", content: "Client rejected price increase", status: "failed" },
  { id: "NOTIF-006", timestamp: "2026-03-14T15:00:00Z", recipient: "Both", type: "in_app", content: "Cancellation fee applied – JOB-004", status: "sent" },
];

// ─── Refund Tracking 

export interface RefundRecord {
  jobId: string;
  clientName: string;
  clientId: string;
  originalEscrow: number;
  cancellationFee: number;
  clientRefund: number;
  refundStatus: "pending" | "processed" | "failed";
  refundDate?: string;
  refundMethod: string;
  transactionId?: string;
}

export const MOCK_REFUNDS: RefundRecord[] = [
  {
    jobId: "JOB-004",
    clientName: "Kemi O.",
    clientId: "CLT-012",
    originalEscrow: 100000,
    cancellationFee: 10000,
    clientRefund: 90000,
    refundStatus: "processed",
    refundDate: "15/03/2026",
    refundMethod: "Original payment method",
    transactionId: "REF-20260315-001",
  },
  {
    jobId: "JOB-007",
    clientName: "Tunde F.",
    clientId: "CLT-005",
    originalEscrow: 50000,
    cancellationFee: 10000,
    clientRefund: 40000,
    refundStatus: "processed",
    refundDate: "14/03/2026",
    refundMethod: "Original payment method",
    transactionId: "REF-20260314-002",
  },
  {
    jobId: "JOB-009",
    clientName: "Funke A.",
    clientId: "CLT-001",
    originalEscrow: 15000,
    cancellationFee: 3750,
    clientRefund: 11250,
    refundStatus: "processed",
    refundDate: "13/03/2026",
    refundMethod: "Original payment method",
    transactionId: "REF-20260313-003",
  },
  {
    jobId: "JOB-011",
    clientName: "Chidi N.",
    clientId: "CLT-002",
    originalEscrow: 8000,
    cancellationFee: 2000,
    clientRefund: 6000,
    refundStatus: "pending",
    refundMethod: "Original payment method",
  },
];

// ─── Expert Payout 

export interface PayoutRecord {
  jobId: string;
  expertName: string;
  expertId: string;
  cancellationFee: number;
  payoutStatus: "pending" | "paid" | "failed";
  payoutDate?: string;
  payoutMethod: string;
  transactionId?: string;
}

export const MOCK_PAYOUTS: PayoutRecord[] = [
  {
    jobId: "JOB-004",
    expertName: "Bola A.",
    expertId: "EXP-008",
    cancellationFee: 10000,
    payoutStatus: "paid",
    payoutDate: "15/03/2026",
    payoutMethod: "Bank Transfer",
    transactionId: "PAY-20260315-045",
  },
  {
    jobId: "JOB-007",
    expertName: "John D.",
    expertId: "EXP-009",
    cancellationFee: 10000,
    payoutStatus: "paid",
    payoutDate: "14/03/2026",
    payoutMethod: "Bank Transfer",
    transactionId: "PAY-20260314-032",
  },
  {
    jobId: "JOB-009",
    expertName: "Mary K.",
    expertId: "EXP-003",
    cancellationFee: 3750,
    payoutStatus: "paid",
    payoutDate: "13/03/2026",
    payoutMethod: "Bank Transfer",
    transactionId: "PAY-20260313-019",
  },
  {
    jobId: "JOB-011",
    expertName: "Peter L.",
    expertId: "EXP-010",
    cancellationFee: 2000,
    payoutStatus: "pending",
    payoutMethod: "Bank Transfer",
  },
];