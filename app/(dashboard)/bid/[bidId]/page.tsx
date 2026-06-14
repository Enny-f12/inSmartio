"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Flag,
  Bell,
  Loader2,
  X,
  FileText,
} from "lucide-react";
import { fetchBidDetail, clearSelectedBid } from "@/lib/redux/bidSlice";
import { fetchNotificationLog } from "@/lib/redux/cancellationfeeSlice";
import NotificationLogPanel from "@/components/bid/NotificationLogPanel";
import CancellationFeeDetailModal from "@/components/bid/CancellationFeeDetailModal";
import { bidService } from "@/lib/api/bidApi";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { BidStep } from "@/components/bid/types";
import Topbar from "@/components/layout/Navbar";

// ─── Local types ──────────────────────────────────────────────────────────────

interface ExpertShape {
  id?: string; name?: string; email?: string; phone?: string; gender?: string;
  bio?: string; rating?: number; tier?: number; status?: string;
  paymentModel?: string;
  location?: { address?: string; city?: string; state?: string };
  category?: { name?: string; sub?: string[] };
  skill?: { area?: string; role?: string[]; experience?: number; description?: string };
}
interface ClientShape {
  id?: string; name?: string; email?: string; phone?: string;
  username?: string; tier?: number; status?: string;
  location?: { address?: string; city?: string; country?: string };
  createdAt?: string;
}
interface FlagItem {
  id: string; reason: string; status: string;
  priority?: "HIGH" | "MEDIUM" | "LOW"; createdAt: string;
}
interface FlagNote { note: string; adminId: string; createdAt: string; }
interface FlagData {
  status?: string; priority?: "HIGH" | "MEDIUM" | "LOW"; reason?: string;
  flaggedAt?: string; flags?: FlagItem[]; notes?: FlagNote[];
}
interface CancellationData {
  reason?: string; feeAmount?: number; feeApplied?: boolean;
  cancelledAt?: string; cancelledBy?: string;
}
interface NegotiationData {
  message?: string; requestedBy?: string; rejectedBy?: string;
  rejectedAt?: string; counterAmount?: number; originalAmount?: number;
}
interface SiteCancellationFee {
  originalJobValue: number; calculatedAmount?: number;
  feeCap?: number; finalFee: number; clientRefund?: number;
}
interface SiteArrivalDetails {
  situation?: string; arrivalTime?: string; inspectionCompletedAt?: string;
  expertAssessment?: string; proposedNewPrice?: number;
  proposedIncreasePercent?: number; clientResponse?: string;
  clientResponseAt?: string; cancellationFee?: SiteCancellationFee;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}k`
  : `₦${n.toLocaleString()}`;

const dash = (v: unknown): string => (v == null || v === "" ? "-" : String(v));
const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleString() : "-";

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = ["Posted", "Bids", "Selected", "Response", "Decision", "Confirm", "Site"];
function stepIndex(step: BidStep): number {
  if (step === "site") return 6;
  const n = Number(step);
  return isNaN(n) ? 0 : Math.min(n - 1, 6);
}
const isSiteStep = (step: BidStep) => step === "site" || Number(step) === 7;

// ─── Process Timeline ─────────────────────────────────────────────────────────

function ProcessTimeline({ currentStep }: { currentStep: BidStep }) {
  const current = stepIndex(currentStep);
  const atSite  = isSiteStep(currentStep);
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Process Timeline</p>
      <div className="hidden sm:flex items-start">
        {STEPS.map((label, i) => {
          const done = i < current; const active = i === current; const isLast = i === STEPS.length - 1;
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all
                  ${done ? "bg-primary border-primary text-white" : active ? "bg-primary/10 border-primary text-primary" : "bg-gray-100 border-gray-200 text-gray-400"}`}>
                  {done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[9px] text-center font-medium leading-tight ${active ? "text-primary" : done ? "text-text-muted" : "text-gray-300"}`}>{label}</span>
              </div>
              {!isLast && <div className={`h-0.5 flex-1 mt-3.5 mx-0.5 rounded-full ${i < current ? "bg-primary" : "bg-gray-200"}`} />}
            </React.Fragment>
          );
        })}
      </div>
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-text-main">Step {current + 1} of 7</span>
          <span className="text-xs text-text-muted">{STEPS[current]}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${((current + 1) / 7) * 100}%` }} />
        </div>
      </div>
      {atSite && (
        <div className="mt-3 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs font-medium text-primary">SITE ARRIVAL: Complete</p>
        </div>
      )}
    </div>
  );
}

// ─── Flag Modal ───────────────────────────────────────────────────────────────

function FlagModal({ bidId, onClose, onSuccess }: { bidId: string; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason]     = useState("");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) { setError("Reason is required"); return; }
    setLoading(true); setError(null);
    try {
      await bidService.flagBid(bidId, reason.trim(), priority);
      onSuccess(); onClose();
    } catch { setError("Failed to flag bid. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-red-500" /><h3 className="text-sm font-semibold text-text-main">Flag Bid</h3></div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors
                    ${priority === p
                      ? p === "HIGH"   ? "bg-red-100 border-red-300 text-red-700"
                      : p === "MEDIUM" ? "bg-amber-100 border-amber-300 text-amber-700"
                                       : "bg-gray-100 border-gray-300 text-gray-700"
                      : "border-border text-text-muted hover:bg-gray-50"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Reason *</label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this bid is being flagged..."
              className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-xs text-text-muted hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "Flagging..." : "Flag Bid"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────

function AddNoteModal({ bidId, onClose, onSuccess }: { bidId: string; onClose: () => void; onSuccess: () => void }) {
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!note.trim()) { setError("Note cannot be empty"); return; }
    setLoading(true); setError(null);
    try {
      await bidService.addNote(bidId, note.trim());
      onSuccess(); onClose();
    } catch { setError("Failed to add note. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-main">Add Note</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-5">
          <label className="text-xs font-medium text-text-muted block mb-1.5">Note *</label>
          <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Reviewed bid – pricing looks competitive, proceeding with selection"
            className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-xs text-text-muted hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "Saving..." : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Waive Fee Modal ──────────────────────────────────────────────────────────

function WaiveFeeInlineModal({ bidId, feeAmount, expertName, onClose, onSuccess }: {
  bidId: string; feeAmount: number; expertName: string; onClose: () => void; onSuccess: () => void;
}) {
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) { setError("Reason is required"); return; }
    setLoading(true); setError(null);
    try {
      await bidService.waiveFee(bidId, reason.trim());
      onSuccess(); onClose();
    } catch { setError("Failed to waive fee. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-main">Waive Cancellation Fee</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
            <p className="font-medium text-amber-800">Waiving <span className="font-bold">{fmt(feeAmount)}</span> fee for Expert <span className="font-bold">{expertName}</span></p>
            <p className="text-amber-700 mt-0.5">This action cannot be undone.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Reason *</label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Expert had valid reason for cancellation – severe weather conditions"
              className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-xs text-text-muted hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "Waiving..." : "Waive Fee"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timerRef.current = setTimeout(onDone, 3000);
    return () => { if (timerRef.current !== null) clearTimeout(timerRef.current); };
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
      {message}
    </div>
  );
}

// ─── Flag status helpers ──────────────────────────────────────────────────────

// Flag state derived from latest bid data — API does NOT include a `status`
// field on flagData; presence of `reason` or `flaggedAt` means it's flagged.
function isFlagged(fd: FlagData | null | undefined): boolean {
  if (!fd) return false;
  if (fd.reason || fd.flaggedAt) return true;
  if (Array.isArray(fd.flags) && fd.flags.length > 0) return true;
  return false;
}

function flagPriorityColor(priority?: "HIGH" | "MEDIUM" | "LOW") {
  if (priority === "HIGH")   return "text-red-600 border-red-200 bg-red-50";
  if (priority === "MEDIUM") return "text-amber-600 border-amber-200 bg-amber-50";
  return "text-gray-600 border-gray-200 bg-gray-50";
}

// ─── Notes section ────────────────────────────────────────────────────────────

function NotesList({ notes }: { notes: FlagNote[] }) {
  if (!notes.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Admin Notes</p>
      {notes.map((n, i) => (
        <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5 text-xs">
          <FileText className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-text-main">{n.note}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{n.adminId} · {fmtDate(n.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BidDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router   = useRouter();
  const params   = useParams();
  const bidId    = params?.bidId as string;

  const { selectedBid: bid, detailLoading, detailError } = useSelector((s: RootState) => s.bids);

  const [activeTab,    setActiveTab]    = useState<"overview" | "notifications">("overview");
  const [showActions,  setShowActions]  = useState(false);
  const [showFlag,     setShowFlag]     = useState(false);
  const [showNote,     setShowNote]     = useState(false);
  const [showWaive,    setShowWaive]    = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [toast,        setToast]        = useState<string | null>(null);

  // ── Load bid + notification log on mount ──
  useEffect(() => {
    if (bidId) {
      dispatch(fetchBidDetail(bidId));
      // Notification log: GET /bid/admin/history — pass bidId so the thunk scopes it
      dispatch(fetchNotificationLog(bidId));
    }
    return () => { dispatch(clearSelectedBid()); };
  }, [bidId, dispatch]);

  // ── After flag/note success: re-fetch bid so UI reflects new state ──
  const refreshBid = () => {
    dispatch(fetchBidDetail(bidId));
  };

  if (detailLoading || !bid) return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Bid Details" />
      <div className="flex items-center justify-center flex-1 gap-2 text-text-muted p-10">
        <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Loading bid...</span>
      </div>
    </div>
  );

  if (detailError) return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Bid Details" />
      <div className="flex items-center justify-center flex-1 p-10">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-text-muted mb-4">{detailError}</p>
          <button onClick={() => router.back()} className="btn-primary text-sm">Go Back</button>
        </div>
      </div>
    </div>
  );

  // ── Typed derived values ──
  const bidAmount     = bid.bidAmount ?? bid.originalBid;
  const expert        = bid.expert as ExpertShape;
  const client        = (bid.job?.client ?? (bid as { client?: ClientShape }).client) as ClientShape | undefined;
  const fd            = bid.flagData as FlagData | null | undefined;
  const site          = (bid as { siteArrivalDetails?: SiteArrivalDetails }).siteArrivalDetails;
  const cd            = bid.cancellationData as CancellationData | null | undefined;
  const nd            = bid.negotiationData as NegotiationData | null | undefined;
  const siteArrivalAt = (bid as { siteArrivalAt?: string }).siteArrivalAt;
  const atSite        = isSiteStep(bid.step);
  const isCancelled   = bid.status === "cancelled_fee_applied";
  const isB2          = atSite && site?.situation === "B2";

  // Flag state derived from latest bid data
  const flagged         = isFlagged(fd);
  const flagPriority    = fd?.priority;
  const allNotes        = fd?.notes ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="Bid Details" />

      <div className="flex-1 overflow-y-auto bg-background p-4 md:p-6 space-y-3">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/bid")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-text-muted" />
            </button>
            <span className="text-xs text-text-muted hover:underline cursor-pointer" onClick={() => router.push("/bid")}>
              Bid Management
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-main">Bid #{bid.id}</span>
            {/* Flag status pill — always visible once flagged */}
            {flagged && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${flagPriorityColor(flagPriority)}`}>
                <Flag className="w-2.5 h-2.5" fill="currentColor" />
                Flagged{flagPriority ? ` · ${flagPriority}` : ""}
              </span>
            )}
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button onClick={() => setShowActions(v => !v)}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 flex items-center gap-1.5">
              Actions
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showActions ? "rotate-90" : ""}`} />
            </button>
            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg z-20 min-w-45 py-1">
                <button onClick={() => { setShowFeeModal(true); setShowActions(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-text-main hover:bg-gray-50">
                  View Cancellation Policy
                </button>
                {/* Flag button — shows "Flagged" if already flagged */}
                <button onClick={() => { if (!flagged) { setShowFlag(true); } setShowActions(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${flagged ? "text-text-muted cursor-default" : "text-red-600"}`}>
                  <Flag className={`w-3 h-3 ${flagged ? "text-text-muted" : "text-red-500"}`} fill={flagged ? "currentColor" : "none"} />
                  {flagged ? `Flagged${flagPriority ? ` (${flagPriority})` : ""}` : "Flag Bid"}
                </button>
                <button onClick={() => { setShowNote(true); setShowActions(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-text-main hover:bg-gray-50">
                  Add Note
                </button>
                <button onClick={() => { setActiveTab("notifications"); setShowActions(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-text-main hover:bg-gray-50 flex items-center gap-2">
                  <Bell className="w-3 h-3" /> Notification Log
                </button>
                {atSite && (
                  <>
                    <div className="border-t border-border my-1" />
                    <button onClick={() => { setShowFeeModal(true); setShowActions(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs text-text-main hover:bg-gray-50">
                      Review Fee Calculation
                    </button>
                    {isCancelled && (
                      <button onClick={() => { setShowWaive(true); setShowActions(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-amber-700 hover:bg-amber-50">
                        Waive Cancellation Fee
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(["overview", "notifications"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5
                ${activeTab === tab ? "bg-surface shadow text-text-main" : "text-text-muted hover:text-text-main"}`}>
              {tab === "notifications" && <Bell className="w-3 h-3" />}
              {tab === "overview" ? "Overview" : "Notification Log"}
            </button>
          ))}
        </div>

        {/* ══ NOTIFICATION TAB ══ */}
        {activeTab === "notifications" ? (
          <NotificationLogPanel bidId={bid.id} />
        ) : (
          <>
            {/* 1. PROCESS TIMELINE */}
            <ProcessTimeline currentStep={bid.step} />

            {/* 2. B2 ALERT */}
            {atSite && isB2 && (
              <div className="border border-gray-300 rounded-lg p-3 bg-surface">
                <p className="text-xs text-text-main">Situation B2 &ndash; Client rejected price increase</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Cancellation Fee Applied:{" "}
                  <span className="font-semibold text-text-main">{fmt(site?.cancellationFee?.finalFee ?? cd?.feeAmount ?? 0)}</span>
                </p>
              </div>
            )}

            {/* 3. BID INFORMATION */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Bid Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 text-xs">
                <div className="space-y-1.5">
                  <div><span className="text-text-muted">Bid ID: </span><span className="font-mono">{dash(bid.id)}</span></div>
                  <div><span className="text-text-muted">Original Bid: </span><span className="font-semibold">{bidAmount != null ? fmt(bidAmount) : "-"}</span></div>
                  {nd?.counterAmount != null && (
                    <div>
                      <span className="text-text-muted">Requested Increase: </span>
                      <span className="font-semibold text-amber-600">{fmt(nd.counterAmount)}</span>
                      {nd.originalAmount != null && (
                        <span className="text-text-muted"> ({Math.round(((nd.counterAmount - nd.originalAmount) / nd.originalAmount) * 100)}%)</span>
                      )}
                    </div>
                  )}
                  <div><span className="text-text-muted">Step 4 Response: </span><span>{fmtDate(bid.step4ResponseAt)}</span></div>
                  <div><span className="text-text-muted">Step 5 Decision: </span><span>{fmtDate(bid.step5DecisionAt)}</span></div>
                  <div><span className="text-text-muted">Currency: </span><span>{dash(bid.currency)}</span></div>
                  <div><span className="text-text-muted">Cash Payment: </span><span>{bid.offerCashPayment ? "Yes" : "No"}</span></div>
                </div>
                <div className="space-y-1.5 mt-1.5 md:mt-0">
                  <div><span className="text-text-muted">Job ID: </span><span className="font-mono">{dash(bid.jobId)}</span></div>
                  <div><span className="text-text-muted">Final Amount: </span><span className="font-semibold">{bid.finalAmount != null ? fmt(bid.finalAmount) : "-"}</span></div>
                  <div><span className="text-text-muted">Status: </span><span className="capitalize">{bid.status.replace(/_/g, " ")}</span></div>
                  <div><span className="text-text-muted">Step: </span><span>{dash(bid.step)}</span></div>
                  <div><span className="text-text-muted">Created: </span><span>{fmtDate(bid.createdAt)}</span></div>
                  <div><span className="text-text-muted">Updated: </span><span>{fmtDate(bid.updatedAt)}</span></div>
                  {atSite && <div><span className="text-text-muted">Site Arrival: </span><span>{fmtDate(siteArrivalAt)}</span></div>}
                </div>
              </div>
              {bid.proposalText && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Proposal: </span>
                  <span className="text-xs text-text-main">{bid.proposalText}</span>
                </div>
              )}
            </div>

            {/* 4. EXPERT | CLIENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Expert Information</p>
                <div className="space-y-1.5 text-xs">
                  <div><span className="text-text-muted">Name: </span><span className="font-medium">{dash(expert?.name)}</span></div>
                  <div><span className="text-text-muted">Expert ID: </span><span className="font-mono">{dash(expert?.id)}</span></div>
                  <div><span className="text-text-muted">Phone: </span><span>{dash(expert?.phone)}</span></div>
                  <div><span className="text-text-muted">Rating: </span><span>{expert?.rating != null ? `${expert.rating} ★` : "-"}</span></div>
                  <div><span className="text-text-muted">Tier: </span><span>{dash(expert?.tier)}</span></div>
                  <div><span className="text-text-muted">Category: </span><span>{dash(expert?.category?.name)}</span></div>
                  <div><span className="text-text-muted">Status: </span><span>{dash(expert?.status)}</span></div>
                  <div><span className="text-text-muted">Payment Model: </span><span>{dash(expert?.paymentModel)}</span></div>
                  <div><span className="text-text-muted">Location: </span><span>{expert?.location ? [expert.location.address, expert.location.city].filter(Boolean).join(", ") : "-"}</span></div>
                </div>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Client Information</p>
                <div className="space-y-1.5 text-xs">
                  <div><span className="text-text-muted">Name: </span><span className="font-medium">{dash(client?.name)}</span></div>
                  <div><span className="text-text-muted">Client ID: </span><span className="font-mono">{dash(client?.id)}</span></div>
                  <div><span className="text-text-muted">Phone: </span><span>{dash(client?.phone)}</span></div>
                  <div><span className="text-text-muted">Email: </span><span>{dash(client?.email)}</span></div>
                  <div><span className="text-text-muted">Username: </span><span>{dash(client?.username)}</span></div>
                  <div><span className="text-text-muted">Tier: </span><span>{dash(client?.tier)}</span></div>
                  <div><span className="text-text-muted">Status: </span><span>{dash(client?.status)}</span></div>
                  <div><span className="text-text-muted">Location: </span><span>{client?.location ? [client.location.address, client.location.city].filter(Boolean).join(", ") : "-"}</span></div>
                  <div><span className="text-text-muted">Member Since: </span><span>{fmtDate(client?.createdAt)}</span></div>
                </div>
              </div>
            </div>

            {/* 5. SITE ARRIVAL & CANCELLATION */}
            {atSite && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">
                  Site Arrival &amp; Cancellation Details <span className="normal-case font-normal">(Per Cancellation Fee Policy)</span>
                </p>
                <div className="space-y-1.5 text-xs">
                  <div><span className="text-text-muted">Site Arrival Time: </span><span>{fmtDate(site?.arrivalTime ?? siteArrivalAt)}</span></div>
                  <div><span className="text-text-muted">Inspection Completed: </span><span>{fmtDate(site?.inspectionCompletedAt)}</span></div>
                  <div><span className="text-text-muted">Expert&apos;s Assessment: </span><span>{dash(site?.expertAssessment)}</span></div>
                  {site?.proposedNewPrice != null && (
                    <div>
                      <span className="text-text-muted">Proposed New Price: </span>
                      <span className="font-semibold text-amber-600">{fmt(site.proposedNewPrice)}</span>
                      {site.proposedIncreasePercent != null && <span className="text-text-muted"> (+{site.proposedIncreasePercent}%)</span>}
                    </div>
                  )}
                  <div>
                    <span className="text-text-muted">Client Response: </span>
                    <span className={`font-semibold ${site?.clientResponse === "rejected" ? "text-red-600" : site?.clientResponse === "accepted" ? "text-green-600" : "text-text-main"}`}>
                      {site?.clientResponse ? `${site.clientResponse.toUpperCase()}${site.clientResponseAt ? ` at ${fmtDate(site.clientResponseAt)}` : ""}` : "-"}
                    </span>
                  </div>
                </div>
                {(site?.cancellationFee ?? cd) && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-text-main mb-2">Cancellation Fee Calculation:</p>
                    <div className="border border-border rounded-lg p-3 bg-gray-50 space-y-1 text-xs">
                      <div>Original Job Value: <span className="font-semibold">{fmt(site?.cancellationFee?.originalJobValue ?? cd?.feeAmount ?? 0)}</span></div>
                      {site?.cancellationFee?.calculatedAmount != null && (
                        <div>25% Calculation: <span>{fmt(site.cancellationFee.originalJobValue)} × 25% = {fmt(site.cancellationFee.calculatedAmount)}</span></div>
                      )}
                      {site?.cancellationFee?.feeCap != null && (
                        <div>Maximum Fee Cap: <span className="font-semibold">{fmt(site.cancellationFee.feeCap)}</span></div>
                      )}
                      <div className="border-t border-border pt-1">
                        Final Cancellation Fee: <span className="font-bold text-red-600">{fmt(site?.cancellationFee?.finalFee ?? cd?.feeAmount ?? 0)}</span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      <div>Fee Applied To: Expert <span className="font-medium">{dash(expert?.name)}</span></div>
                      {site?.cancellationFee?.clientRefund != null && (
                        <div>Client Refund: <span className="font-medium">{fmt(site.cancellationFee.clientRefund)}</span>
                          <span className="text-text-muted"> (original {fmt(site.cancellationFee.originalJobValue)} &minus; {fmt(site.cancellationFee.finalFee)} fee)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!site && cd && (
                  <div className="mt-3 space-y-1.5 text-xs border-t border-border pt-3">
                    <div><span className="text-text-muted">Reason: </span><span>{dash(cd.reason)}</span></div>
                    <div><span className="text-text-muted">Cancelled By: </span><span className="font-mono">{dash(cd.cancelledBy)}</span></div>
                    <div><span className="text-text-muted">Cancelled At: </span><span>{fmtDate(cd.cancelledAt)}</span></div>
                    <div><span className="text-text-muted">Fee Applied: </span><span>{cd.feeApplied ? "Yes" : "No"}</span></div>
                    {cd.feeAmount != null && <div><span className="text-text-muted">Fee Amount: </span><span className="font-bold text-red-600">{fmt(cd.feeAmount)}</span></div>}
                  </div>
                )}
              </div>
            )}

            {/* 6. ALERTS & FLAGS — shows flags + notes, flag button changes to Flagged */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Alerts &amp; Flags</p>
                {/* Flag / Flagged button inline in section header */}
                {flagged ? (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${flagPriorityColor(flagPriority)}`}>
                    <Flag className="w-2.5 h-2.5" fill="currentColor" />
                    Flagged{flagPriority ? ` · ${flagPriority}` : ""}
                  </span>
                ) : (
                  <button onClick={() => setShowFlag(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <Flag className="w-2.5 h-2.5" />
                    Flag Bid
                  </button>
                )}
              </div>

              {/* No flags yet */}
              {!fd && (
                <p className="text-xs text-text-muted">No alerts or flags on this bid.</p>
              )}

              {fd && (
                <div className="space-y-2">
                  {fd.reason && (
                    <div className="flex items-start gap-2 text-xs">
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${fd.priority === "HIGH" ? "text-red-500" : fd.priority === "MEDIUM" ? "text-amber-500" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <span>{fd.reason}</span>
                        {fd.priority && (
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${fd.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {fd.priority}
                          </span>
                        )}
                        {fd.flaggedAt && <span className="ml-2 text-text-muted">{fmtDate(fd.flaggedAt)}</span>}
                      </div>
                    </div>
                  )}
                  {fd.flags?.filter((f: FlagItem) => f.reason !== fd.reason).map((flag: FlagItem) => (
                    <div key={flag.id} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${flag.priority === "HIGH" ? "text-red-500" : "text-amber-500"}`} />
                      <div className="flex-1">
                        <span>{flag.reason}</span>
                        {flag.priority && (
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${flag.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {flag.priority}
                          </span>
                        )}
                        <span className="ml-2 text-text-muted">{fmtDate(flag.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button className="px-2.5 py-1 border border-border rounded text-[10px] text-text-main hover:bg-gray-50">Dismiss</button>
                    <button className="px-2.5 py-1 border border-border rounded text-[10px] text-text-main hover:bg-gray-50">Investigate</button>
                    <button className="px-2.5 py-1 border border-border rounded text-[10px] text-red-600 hover:bg-red-50">Flag Client</button>
                  </div>
                </div>
              )}

              {/* Notes from flagData — shown below flags */}
              <NotesList notes={allNotes} />

              {/* Add note button inline */}
              <button onClick={() => setShowNote(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-text-main hover:bg-gray-50 transition-colors">
                <FileText className="w-3 h-3" /> Add Note
              </button>
            </div>

            {/* 7. ADMIN ACTIONS */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">Admin Actions</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowFeeModal(true)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-text-main hover:bg-gray-50">
                  View Cancellation Policy
                </button>
                {atSite && (
                  <button onClick={() => setShowFeeModal(true)}
                    className="px-3 py-1.5 border border-border rounded-lg text-xs text-text-main hover:bg-gray-50">
                    Review Fee Calculation
                  </button>
                )}
                {/* Flag/Flagged toggle */}
                {flagged ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${flagPriorityColor(flagPriority)}`}>
                    <Flag className="w-3 h-3" fill="currentColor" />
                    Flagged{flagPriority ? ` (${flagPriority})` : ""}
                  </span>
                ) : (
                  <button onClick={() => setShowFlag(true)}
                    className="px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5">
                    <Flag className="w-3 h-3" /> Flag
                  </button>
                )}
                <button onClick={() => setShowNote(true)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-text-main hover:bg-gray-50">
                  Add Note
                </button>
                {atSite && isCancelled && (
                  <button onClick={() => setShowWaive(true)}
                    className="px-3 py-1.5 border border-amber-200 rounded-lg text-xs text-amber-700 hover:bg-amber-50">
                    Waive Cancellation Fee
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showFlag && (
        <FlagModal bidId={bid.id} onClose={() => setShowFlag(false)}
          onSuccess={() => { setToast("Bid flagged successfully"); refreshBid(); }} />
      )}
      {showNote && (
        <AddNoteModal bidId={bid.id} onClose={() => setShowNote(false)}
          onSuccess={() => { setToast("Note added successfully"); refreshBid(); }} />
      )}
      {showWaive && (
        <WaiveFeeInlineModal bidId={bid.id}
          feeAmount={site?.cancellationFee?.finalFee ?? cd?.feeAmount ?? 0}
          expertName={expert?.name ?? "-"}
          onClose={() => setShowWaive(false)}
          onSuccess={() => { setToast("Fee waived successfully"); refreshBid(); }} />
      )}
      {showFeeModal && (
        <CancellationFeeDetailModal jobId={bid.jobId} onClose={() => setShowFeeModal(false)} />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}