"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, RefreshCw, Send, Loader2, Bell } from "lucide-react";
import {
  fetchNotificationLog,
  resendNotification,
} from "@/lib/redux/cancellationfeeSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";

const TYPE_COLORS = {
  in_app: "bg-blue-100 text-blue-700",
  push: "bg-purple-100 text-purple-700",
  sms: "bg-green-100 text-green-700",
  email: "bg-orange-100 text-orange-700",
};

const STATUS_COLORS = {
  sent: "text-green-600",
  failed: "text-red-600",
  pending: "text-amber-600",
};

interface Props {
  bidId: string;
}

export default function NotificationLogPanel({ bidId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, notificationsLoading, resendingId } = useSelector(
    (s: RootState) => s.cancellationFees
  );

  const handleResend = (notificationId: string) => {
    dispatch(resendNotification({ bidId, notificationId }));
  };

  const handleExport = () => {
    const csv = [
      ["Timestamp", "Recipient", "Type", "Content", "Status"],
      ...notifications.map((n) => [
        n.timestamp,
        n.recipient,
        n.type,
        n.content,
        n.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notifications-bid-${bidId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-main">
            Notification History – Bid #{bidId}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchNotificationLog(bidId))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-text-muted ${notificationsLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs text-text-muted hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export Log
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs">Timestamp</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs">Recipient</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs">Type</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs">Content</th>
              <th className="text-center px-4 py-3 text-text-muted font-medium text-xs">Status</th>
              <th className="text-center px-4 py-3 text-text-muted font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notificationsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-text-muted text-sm">
                  No notifications found for this bid
                </td>
              </tr>
            ) : (
              notifications.map((n) => (
                <tr key={n.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                    {new Date(n.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{n.recipient}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                        TYPE_COLORS[n.type]
                      }`}
                    >
                      {n.type.replace("_", "-")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-main max-w-xs">
                    <span className="line-clamp-2">{n.content}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold ${STATUS_COLORS[n.status]}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {n.status === "failed" && (
                      <button
                        onClick={() => handleResend(n.id)}
                        disabled={resendingId === n.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        {resendingId === n.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Resend
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}