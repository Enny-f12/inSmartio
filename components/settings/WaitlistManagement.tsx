"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import {
  fetchAllWaitlist,
  deleteWaitlistEntry,
  exportWaitlist,
  clearError,
  type WaitlistEntry,
} from "@/lib/redux/waitlistSlice";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

// ── Modal ─────────────────────────────────────────────────────────────────────
// Same pattern as SubscriptionManagement's Modal — kept local to this file to
// match the existing convention in components/settings/*.

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

function Modal({ open, onClose, children, title }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Entry Details ─────────────────────────────────────────────────────────────

function EntryDetails({ entry }: { entry: WaitlistEntry }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
          {initials(entry.name)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
          <p className="text-xs text-gray-500">{entry.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-xs text-gray-400">Joined</span>
          <span className="text-sm text-gray-700">{formatDate(entry.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-gray-400">Entry ID</span>
          <span className="text-xs text-gray-500 font-mono truncate max-w-50">{entry.id}</span>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────

interface ConfirmDeleteProps {
  entry: WaitlistEntry | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDelete({ entry, loading, onConfirm, onCancel }: ConfirmDeleteProps) {
  if (!entry) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-red-600" stroke="currentColor" strokeWidth={2}>
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-red-800">Remove Waitlist Entry</p>
          <p className="text-xs text-red-600">
            This action cannot be undone. &quot;{entry.name}&quot; will be permanently removed.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {loading ? "Removing…" : "Remove Entry"}
        </button>
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  entry: WaitlistEntry;
  onView: (entry: WaitlistEntry) => void;
  onDelete: (entry: WaitlistEntry) => void;
}

function EntryRow({ entry, onView, onDelete }: RowProps) {
  return (
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
            {initials(entry.name)}
          </div>
          <span className="text-sm font-medium text-gray-900">{entry.name}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{entry.email}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(entry)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
            title="View details"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            title="Remove"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export default function WaitlistManagement({ onBack }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { entries, loading, actionLoading, exportLoading, error } = useSelector(
    (s: RootState) => s.waitlist
  );

  const [search, setSearch] = useState("");
  const [viewEntry, setViewEntry] = useState<WaitlistEntry | null>(null);
  const [deleteEntry, setDeleteEntryState] = useState<WaitlistEntry | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    dispatch(fetchAllWaitlist());
  }, [dispatch]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const handleDelete = async () => {
    if (!deleteEntry) return;
    const result = await dispatch(deleteWaitlistEntry(deleteEntry.id));
    if (deleteWaitlistEntry.fulfilled.match(result)) {
      showToast("Waitlist entry removed.");
      setDeleteEntryState(null);
    } else {
      showToast((result.payload as string) ?? "Removal failed.", "error");
    }
  };

  const handleExportCsv = async () => {
    const result = await dispatch(exportWaitlist());
    if (exportWaitlist.fulfilled.match(result)) {
      const blob = new Blob([result.payload], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `waitlist-entries-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      showToast((result.payload as string) ?? "Failed to export waitlist entries.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-100 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Waitlist Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">People waiting for early access</p>
            </div>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={entries.length === 0 || exportLoading}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            {exportLoading ? (
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 animate-spin" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 3a9 9 0 100 18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12l4.5 4.5m0 0l4.5-4.5M12 16.5V3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {exportLoading ? "Exporting…" : "Export CSV"}
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{entries.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total on Waitlist</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{filteredEntries.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Matching Search</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 relative">
          <svg
            viewBox="0 0 24 24" fill="none"
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            stroke="currentColor" strokeWidth={2}
          >
            <path d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" stroke="currentColor" strokeWidth={2}>
              <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
            <button onClick={() => dispatch(clearError())} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-400" stroke="currentColor" strokeWidth={1.5}>
                <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-gray-900 font-medium">
              {entries.length === 0 ? "No one has joined the waitlist yet" : "No matches found"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {entries.length === 0
                ? "Entries will show up here as people sign up."
                : "Try a different name or email."}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredEntries.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      onView={setViewEntry}
                      onDelete={setDeleteEntryState}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal open={!!viewEntry} onClose={() => setViewEntry(null)} title="Waitlist Entry">
        {viewEntry && <EntryDetails entry={viewEntry} />}
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteEntry} onClose={() => setDeleteEntryState(null)} title="Confirm Removal">
        <ConfirmDelete
          entry={deleteEntry}
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteEntryState(null)}
        />
      </Modal>
    </div>
  );
}