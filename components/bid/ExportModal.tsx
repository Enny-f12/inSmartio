/* eslint-disable react-hooks/purity */
"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Download, Loader2, AlertTriangle } from "lucide-react";
import { exportReportThunk, clearActionState } from "@/lib/redux/cancellationfeeSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";

// ─── Config ───────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: "summary",            label: "Summary Report",         desc: "Aggregated totals"     },
  { value: "detailed",           label: "Detailed Report",        desc: "Per transaction"       },
  { value: "expert_performance", label: "Expert Performance Report", desc: "Fees by expert"    },
  { value: "client_performance", label: "Client Performance Report", desc: "Fees by client"    },
] as const;

const FORMATS = ["pdf", "csv", "excel"] as const;

const INCLUDE_FIELDS = [
  { key: "job_details",          label: "Job details"               },
  { key: "expert_client_names",  label: "Expert and client names"   },
  { key: "fee_calculation",      label: "Fee calculation breakdown" },
  { key: "timestamps",           label: "Date and time stamps"      },
  { key: "refund_status",        label: "Refund status"             },
];

interface Props {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExportModal({ onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { exportLoading, exportError } = useSelector(
    (s: RootState) => s.cancellationFees
  );

  const today     = new Date().toISOString().split("T")[0];
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [reportType, setReportType] =
    useState<"summary" | "detailed" | "expert_performance" | "client_performance">("summary");
  const [format,        setFormat]        = useState<"pdf" | "csv" | "excel">("pdf");
  const [dateFrom,      setDateFrom]      = useState(thirtyAgo);
  const [dateTo,        setDateTo]        = useState(today);
  const [includeFields, setIncludeFields] = useState<string[]>(
    INCLUDE_FIELDS.map((f) => f.key)
  );

  const toggleField = (key: string) => {
    setIncludeFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleGenerate = async () => {
    await dispatch(exportReportThunk({ reportType, format, dateFrom, dateTo, includeFields }));
    dispatch(clearActionState());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-base font-semibold text-text-main">
            Export Cancellation Fee Report
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium text-text-main block mb-2">
              Date Range
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-text-muted block mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-muted block mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Export Options — matches spec label exactly */}
          <div>
            <label className="text-sm font-medium text-text-main block mb-2">
              Export Options
            </label>
            <div className="space-y-2">
              {REPORT_TYPES.map((r) => (
                <label key={r.value} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="report_type"
                    value={r.value}
                    checked={reportType === r.value}
                    onChange={() => setReportType(r.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm text-text-main group-hover:text-primary transition-colors">
                      {r.label}
                    </p>
                    <p className="text-xs text-text-muted">({r.desc})</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format — matches spec: [PDF] [CSV] [Excel] */}
          <div>
            <label className="text-sm font-medium text-text-main block mb-2">Format</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium uppercase transition-colors ${
                    format === f
                      ? "border-primary bg-primary text-white"
                      : "border-border text-text-muted hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Include — matches spec checkboxes */}
          <div>
            <label className="text-sm font-medium text-text-main block mb-2">Include</label>
            <div className="space-y-2">
              {INCLUDE_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFields.includes(f.key)}
                    onChange={() => toggleField(f.key)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-text-main">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {exportError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{exportError}</span>
            </div>
          )}

          {/* Actions — matches spec: [Cancel] [Generate Report] */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-sm text-text-muted hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={exportLoading || includeFields.length === 0}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {exportLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Generate Report
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}