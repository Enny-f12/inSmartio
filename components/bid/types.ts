// ─── Enums ────────────────────────────────────────────────────────────────────

export type BidStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "site";

export type BidStatus =
  | "open_for_bids"
  | "active_bid"
  | "selected"
  | "price_negotiation"
  | "price_rejected"
  | "price_accepted"
  | "confirmed"
  | "en_route"
  | "on_site_inspection"
  | "on_site_price_lower"
  | "on_site_price_higher"
  | "cancelled_fee_applied"
  | "completed"
  | "cancelled_no_fee"
  | "expired"
  | "reopened";

export type FlagPriority = "HIGH" | "MEDIUM" | "LOW";
export type FlagStatus = "open" | "dismissed" | "investigating" | "resolved";

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface BidExpert {
  id: string;
  name: string;
  phone: string;
  rating: number;
  verificationTier: string;
  cancellationFeesReceived: number;
}

export interface BidClient {
  id: string;
  name: string;
  phone: string;
  verificationTier: string;
  jobsCompleted: number;
  cancellationFeesPaid: number;
}

export interface CancellationFeeCalculation {
  originalJobValue: number;
  calculationPercentage: number; // 25
  calculatedAmount: number;
  feeCap: number; // 10000
  finalFee: number;
  clientRefund: number;
  expertPayout: number;
}

export interface SiteArrivalDetails {
  arrivalTime: string;
  inspectionCompletedAt: string;
  expertAssessment: string;
  proposedNewPrice: number;
  proposedIncreasePercent: number;
  clientResponse: "accepted" | "rejected" | "pending";
  clientResponseAt?: string;
  situation: "A1" | "A2" | "B1" | "B2"; // B2 = cancellation fee applies
  cancellationFee?: CancellationFeeCalculation;
  evidenceUrls?: string[];
}

export interface BidFlag {
  id: string;
  reason: string;
  priority: FlagPriority;
  status: FlagStatus;
  createdAt: string;
  resolvedAt?: string;
  adminNote?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  type: "in_app" | "push" | "sms" | "email";
  content: string;
  status: "sent" | "failed" | "pending";
}

export interface Bid {
  // ── Core (existing) ────────────────────────────────────────────────────────
  id: string;
  jobId: string;
  expert: BidExpert;
  /** Legacy flat client — kept for backward compat; prefer bid.job.client */
  client?: BidClient;
  /** Legacy field — kept for backward compat; prefer bid.bidAmount */
  originalBid?: number;
  requestedIncrease?: number;
  requestedIncreasePercent?: number;
  finalAmount?: number;
  step: BidStep;
  status: BidStatus;
  /** Legacy derived field — kept for backward compat; prefer bid.negotiationData != null */
  hasPriceRequest?: boolean;
  /** Legacy flat field — kept for backward compat; prefer bid.cancellationData?.feeAmount */
  cancellationFee?: number;
  /** Legacy flags array — kept for backward compat; prefer bid.flagData */
  flags?: BidFlag[];
  createdAt: string;
  step4ResponseAt?: string;
  step5DecisionAt?: string;
  siteArrivalAt?: string;
  siteArrivalDetails?: SiteArrivalDetails;
  notifications?: NotificationLog[];
  _jobTitle?: string;
  _jobDescription?: string;
  _jobBudget?: { min: number; max: number };
  _jobTimeline?: { label: string; datetime: string }[];
  proposalText?: string;
  completion?: string;
  startDate?: string;
  currency?: string;

  // ── Actual API fields ──────────────────────────────────────────────────────
  /** Bid amount as sent by the API */
  bidAmount?: number;
  expertId?: string;
  offerCashPayment?: boolean;
  updatedAt?: string;

  /** Full job object (includes nested client) */
  job?: BidJob;

  /**
   * Negotiation data — non-null means a price request exists.
   * Replaces the legacy hasPriceRequest boolean.
   */
  negotiationData?: {
    message?: string;
    requestedBy?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    counterAmount?: number;
    originalAmount?: number;
  } | null;

  /**
   * Flag data object — replaces the legacy flags array.
   * Top-level status/priority reflect the most recent open flag.
   */
  flagData?: {
    status?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
    reason?: string;
    flaggedAt?: string;
    flags?: Array<{
      id: string;
      reason: string;
      status: string;
      priority?: "HIGH" | "MEDIUM" | "LOW";
      createdAt: string;
    }>;
    notes?: Array<{
      note: string;
      adminId: string;
      createdAt: string;
    }>;
  } | null;

  /**
   * Cancellation data — replaces the legacy cancellationFee number.
   */
  cancellationData?: {
    reason?: string;
    feeAmount?: number;
    feeApplied?: boolean;
    cancelledAt?: string;
    cancelledBy?: string;
  } | null;

  offerExtension?: unknown | null;
  feeWaived?: unknown | null;
}

// ── Supporting types ──────────────────────────────────────────────────────────

export interface BidJob {
  id: string;
  title: string;
  status: string;
  budget?: { amount?: number; min?: number; max?: number };
  category?: string;
  subCategory?: string;
  postedBy?: string;
  location?: { city?: string; address?: string };
  createdAt?: string;
  client: BidClient;
}

// ─── KPI Summary ──────────────────────────────────────────────────────────────

export interface BidKPISummary {
  totalBids: number;
  totalBidsDelta: number;       // not from API — defaults to 0
  activeBids: number;
  activeBidsDelta: number;      // not from API — defaults to 0
  priceRequests: number;        // mapped from priceRequestBids
  priceRequestsDelta: number;   // not from API — defaults to 0
  rejected: number;             // mapped from rejectedBids
  rejectedDelta: number;        // not from API — defaults to 0
  cancellationFees: number;     // mapped from totalCancellationFees
  cancellationFeesDelta: number;// not from API — defaults to 0
  cancellationFeeRate: number;  // parsed from cancellationFeeRatio ("0.0%" -> 0.0)
}
// ─── Cancellation Fee Models ──────────────────────────────────────────────────

export interface CancellationFeeRecord {
  jobId: string;
  expert: BidExpert;
  client: BidClient;
  originalAmount: number;
  requestedAmount: number;
  increasePercent: number;
  feeApplied: number;
  date: string;
  adminVerified: boolean;
  adminAdjustedAmount?: number;
  adminNote?: string;
  refundStatus: "pending" | "processed" | "failed";
  refundDate?: string;
  refundTransactionId?: string;
  payoutStatus: "pending" | "paid" | "failed";
  payoutDate?: string;
  payoutTransactionId?: string;
  siteInspectionNotes: string;
  evidenceUrls: string[];
}

export interface CancellationFeeSummary {
  totalCancellations: number;
  totalFeesCollected: number;
  averageFee: number;
  minFee: number;
  maxFee: number;
  topReasons: { reason: string; percentage: number }[];
}

// ─── Dispute Flagging ─────────────────────────────────────────────────────────

export interface CancellationHistoryEntry {
  date: string;
  jobId: string;
  fee: number;
  reason: string;
}

export interface ExpertDispute {
  expertId: string;
  expertName: string;
  cancellationHistory: CancellationHistoryEntry[];
  totalSiteVisits: number;
  cancellationRate: number; // %
  exceedsThreshold: boolean; // >30%
}

export interface ClientDispute {
  clientId: string;
  clientName: string;
  cancellationHistory: CancellationHistoryEntry[];
  totalSiteVisits: number;
  rejectionRate: number; // %
  exceedsThreshold: boolean; // >40%
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface BidFilters {
  step?: BidStep | "all";
  status?: BidStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
}

export interface CancellationFeeFilters {
  dateRange?: "last_30" | "last_90" | "all";
  expertId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}