"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, RefreshCw, Bell, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import {
  fetchNotificationLog,
  resendNotification,
  clearNotifications,
} from "@/lib/redux/cancellationfeeSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  in_app: "bg-blue-100 text-blue-700",
  push:   "bg-purple-100 text-purple-700",
  sms:    "bg-green-100 text-green-700",
  email:  "bg-orange-100 text-orange-700",
};

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ElementType }> = {
  sent:    { cls: "text-green-600",  icon: CheckCircle },
  failed:  { cls: "text-red-600",    icon: AlertTriangle },
  pending: { cls: "text-amber-600",  icon: Clock },
};

interface Props {
  bidId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationLogPanel({ bidId }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const { notifications, notificationsLoading, notificationsError, resendingId } =
    useSelector((s: RootState) => s.cancellationFees);

  // Fetch on mount; clear on unmount so stale data from a previous bid is gone
  useEffect(() => {
    dispatch(fetchNotificationLog(bidId));
    return () => { dispatch(clearNotifications()); };
  }, [bidId, dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = () => {
    dispatch(clearNotifications());
    dispatch(fetchNotificationLog(bidId));
  };

  const handleResend = (notificationId: string) => {
    dispatch(resendNotification({ bidId, notificationId }));
  };

  const handleResendAllFailed = () => {
    notifications
      .filter((n) => n.status === "failed")
      .forEach((n) => dispatch(resendNotification({ bidId, notificationId: n.id })));
  };

  const handleExport = () => {
    const csv = [
      ["Timestamp", "Recipient", "Type", "Content", "Status"],
      ...notifications.map((n) => [
        n.timestamp,
        n.recipient,
        n.type,
        `"${n.content.replace(/"/g, '""')}"`,
        n.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `notifications-bid-${bidId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const failedCount = notifications.filter((n) => n.status === "failed").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-main">
            Notification History – Bid #{bidId}
          </h3>
          {notifications.length > 0 && (
            <span className="text-xs text-text-muted">({notifications.length} entries)</span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-text-muted ${notificationsLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error banner */}
      {notificationsError && !notificationsLoading && (
        <div className="flex items-center gap-3 px-5 py-3 bg-red-50 border-b border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{notificationsError}</p>
          <button onClick={handleRefresh} className="ml-auto text-xs text-red-700 underline">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium text-xs">Timestamp</th>
              <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium text-xs">Recipient</th>
              <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium text-xs">Type</th>
              <th className="text-left px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium text-xs hidden sm:table-cell">Content</th>
              <th className="text-center px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium text-xs">Status</th>
              <th className="text-center px-3 py-2 sm:px-4 sm:py-3 text-text-muted font-medium text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {notificationsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-3 py-2 sm:px-4 sm:py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {notificationsError
                      ? "Could not load notifications."
                      : "No notification history found for this bid."}
                  </p>
                  {!notificationsError && (
                    <p className="text-xs mt-1 opacity-60">
                      Notifications will appear here once they are sent.
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              notifications.map((n) => {
                const isResending = resendingId === n.id;
                const statusCfg   = STATUS_CONFIG[n.status] ?? STATUS_CONFIG.pending;
                const StatusIcon  = statusCfg.icon;

                return (
                  <tr key={n.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    {/* Timestamp */}
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs text-text-muted whitespace-nowrap">
                      {n.timestamp ? new Date(n.timestamp).toLocaleString() : "—"}
                    </td>

                    {/* Recipient */}
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs font-medium text-text-main">
                      {n.recipient || "—"}
                    </td>

                    {/* Type badge */}
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${TYPE_COLORS[n.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {n.type.replace("_", "-")}
                      </span>
                    </td>

                    {/* Content — hidden on mobile */}
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs text-text-main hidden sm:table-cell max-w-xs">
                      <span className="line-clamp-1">{n.content || "—"}</span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${statusCfg.cls}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{n.status}</span>
                      </span>
                    </td>

                    {/* Resend action — only for failed */}
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                      {n.status === "failed" && (
                        <button
                          onClick={() => handleResend(n.id)}
                          disabled={isResending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                          <span className="hidden sm:inline">{isResending ? "Sending…" : "Resend"}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-t border-border bg-gray-50 flex-wrap">
        <button
          onClick={handleResendAllFailed}
          disabled={failedCount === 0 || notificationsLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white rounded-lg text-xs text-text-muted hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <RefreshCw className="w-3 h-3" />
          Resend Failed
          {failedCount > 0 && (
            <span className="ml-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {failedCount}
            </span>
          )}
        </button>

        <button
          onClick={handleExport}
          disabled={notifications.length === 0 || notificationsLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white rounded-lg text-xs text-text-muted hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <Download className="w-3 h-3" />
          Export Log
        </button>

        {/* Live count summary */}
        {notifications.length > 0 && (
          <span className="ml-auto text-xs text-text-muted">
            {notifications.filter((n) => n.status === "sent").length} sent
            {failedCount > 0 && <span className="text-red-500"> · {failedCount} failed</span>}
            {notifications.filter((n) => n.status === "pending").length > 0 && (
              <span className="text-amber-500"> · {notifications.filter((n) => n.status === "pending").length} pending</span>
            )}
          </span>
        )}
      </div>

    </div>
  );
}