// app/(dashboard)/reports/components/ReportTable.tsx
"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { colors, card, th, thFirst, td, tdFirst, exportBtn } from "./shared";
import { SkelTableRows, SkelCardRows } from "./Skeleton";
import type { DetailedReportPagination } from "@/lib/api/detailedReportApi";

export interface ReportColumn<T> {
  key:     string;
  header:  string;
  render:  (row: T) => ReactNode;
  /** monospace styling, e.g. for IDs */
  mono?:   boolean;
}

interface ReportTableProps<T extends Record<string, unknown>> {
  columns:      ReportColumn<T>[];
  rows:         T[];
  loading:      boolean;
  emptyLabel?:  string;
  onRowClick?:  (row: T) => void;
  /** Card renderer for the < 640px layout. Falls back to a generic 2-line card using the first 3 columns. */
  mobileCard?:  (row: T) => ReactNode;
  rowKey:       (row: T, index: number) => string;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  exporting?:   boolean;
}

export function ReportTable<T extends Record<string, unknown>>({
  columns, rows, loading, emptyLabel = "No results match your filter.",
  onRowClick, mobileCard, rowKey, onExportCsv, onExportPdf, exporting,
}: ReportTableProps<T>) {
  return (
    <div style={card}>
      {(onExportCsv || onExportPdf) && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
          {onExportCsv && (
            <button style={exportBtn()} onClick={onExportCsv} disabled={exporting}>
              {exporting ? "Exporting…" : "CSV"}
            </button>
          )}
          {onExportPdf && (
            <button style={exportBtn("primary")} onClick={onExportPdf} disabled={exporting}>
              {exporting ? "Exporting…" : "PDF"}
            </button>
          )}
        </div>
      )}

      <div className="rp-table" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
              {columns.map((c, i) => (
                <th key={c.key} style={i === 0 ? thFirst : th}>{c.header}</th>
              ))}
              {onRowClick && <th style={th} />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkelTableRows rows={6} cols={columns.length + (onRowClick ? 1 : 0)} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onRowClick ? 1 : 0)} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: colors.textFaint }}>
                  {emptyLabel}
                </td>
              </tr>
            ) : rows.map((row, ri) => (
              <tr
                key={rowKey(row, ri)}
                className="rp-row"
                style={{ borderBottom: `1px solid ${colors.borderSoft}`, cursor: onRowClick ? "pointer" : "default" }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c, ci) => (
                  <td key={c.key} style={{ ...(ci === 0 ? tdFirst : td), fontFamily: c.mono ? "monospace" : "inherit" }}>
                    {c.render(row)}
                  </td>
                ))}
                {onRowClick && (
                  <td style={td}><span style={{ color: colors.primary, fontSize: "12px", fontWeight: 600 }}>View</span></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rp-cards">
        {loading ? (
          <SkelCardRows rows={4} />
        ) : rows.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: colors.textFaint }}>{emptyLabel}</p>
        ) : rows.map((row, ri) => (
          <div
            key={rowKey(row, ri)}
            onClick={() => onRowClick?.(row)}
            style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}`, backgroundColor: "#fff", cursor: onRowClick ? "pointer" : "default" }}
          >
            {mobileCard ? mobileCard(row) : (
              <>
                <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textMain, margin: "0 0 4px" }}>
                  {columns[0]?.render(row)}
                </p>
                <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>
                  {columns.slice(1, 3).map((c) => c.render(row)).filter(Boolean).join(" · ")}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportPagination({
  pagination,
  onPageChange,
  loading,
}: {
  pagination: DetailedReportPagination | null;
  onPageChange: (page: number) => void;
  loading: boolean;
}) {
  if (loading || !pagination || pagination.total === 0) return null;

  const { page, limit, total, totalPages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className="rp-toolbar-row"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB",
        borderRadius: "0 0 16px 16px",
      }}
    >
      <p style={{ fontSize: "12px", color: colors.textFaint, margin: 0 }}>
        Showing {from} to {to} of {total.toLocaleString()} results
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{
            display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px",
            borderRadius: "8px", fontSize: "12px", fontWeight: 500,
            border: `1px solid ${colors.border}`, backgroundColor: "#ffffff",
            color: colors.textMuted, cursor: page <= 1 ? "not-allowed" : "pointer",
            opacity: page <= 1 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={13} /> Previous
        </button>
        <span style={{ fontSize: "12px", color: colors.textMuted, padding: "0 6px" }}>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{
            display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px",
            borderRadius: "8px", fontSize: "12px", fontWeight: 500,
            border: `1px solid ${colors.border}`, backgroundColor: "#ffffff",
            color: colors.textMuted, cursor: page >= totalPages ? "not-allowed" : "pointer",
            opacity: page >= totalPages ? 0.4 : 1,
          }}
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}