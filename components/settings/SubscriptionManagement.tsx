"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import {
  fetchAllSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  clearError,
  type SubscriptionPlan,
  type CreateSubscriptionPayload,
} from "@/lib/redux/subscriptionSlice";

// ── Types ─────────────────────────────────────────────────────────────────────

type FrequencyType = "monthly" | "yearly" | "weekly";
type PlanType = "bid" | "job" | "expert" | "tas";

interface FormState {
  amount: string;
  frequency: FrequencyType;
  type: PlanType;
  status: boolean;
}

const EMPTY_FORM: FormState = {
  amount: "",
  frequency: "monthly",
  type: "bid",
  status: true,
};

const PLAN_TYPE_OPTIONS: PlanType[] = ["bid", "job", "expert", "tas"];

const FREQUENCY_OPTIONS: FrequencyType[] = ["monthly", "yearly", "weekly"];

// ── Helpers ───────────────────────────────────────────────────────────────────

const frequencyBadge: Record<FrequencyType, string> = {
  monthly: "bg-blue-100 text-blue-700",
  yearly:  "bg-purple-100 text-purple-700",
  weekly:  "bg-green-100 text-green-700",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Modal ─────────────────────────────────────────────────────────────────────

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

// ── Subscription Form ─────────────────────────────────────────────────────────

interface SubscriptionFormProps {
  // Pass a stable key (e.g. plan id or "new") from the parent instead of
  // relying on an effect to reset form state — avoids setState-in-effect lint.
  initial?: FormState;
  onSubmit: (data: CreateSubscriptionPayload) => void;
  loading: boolean;
  submitLabel: string;
}

function SubscriptionForm({ initial = EMPTY_FORM, onSubmit, loading, submitLabel }: SubscriptionFormProps) {
  // `initial` is consumed once at mount. The parent controls re-mount via `key`.
  const [form, setForm] = useState<FormState>(initial);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount:    Number(form.amount),
      frequency: form.frequency,
      type:      form.type,
      status:    form.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <input
          type="number"
          required
          min={0}
          value={form.amount}
          onChange={(e) => set("amount", e.target.value)}
          placeholder="e.g. 5000"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
        <div className="grid grid-cols-4 gap-2">
          {PLAN_TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("type", t)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors uppercase tracking-wide ${
                form.type === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
        <div className="flex gap-2">
          {FREQUENCY_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => set("frequency", f)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                form.frequency === f
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Active Status</p>
          <p className="text-xs text-gray-400">Enable or disable this plan</p>
        </div>
        <button
          type="button"
          onClick={() => set("status", !form.status)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            form.status ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              form.status ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm">
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────

interface ConfirmDeleteProps {
  plan: SubscriptionPlan | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDelete({ plan, loading, onConfirm, onCancel }: ConfirmDeleteProps) {
  if (!plan) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-red-600" stroke="currentColor" strokeWidth={2}>
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-red-800">Delete Subscription Plan</p>
          <p className="text-xs text-red-600">
            This action cannot be undone. Plan &quot;{plan.type}&quot; will be permanently removed.
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
          {loading ? "Deleting…" : "Delete Plan"}
        </button>
      </div>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
}

function PlanCard({ plan, onEdit, onDelete }: PlanCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Plan Type</p>
          <h3 className="text-base font-semibold text-gray-900 capitalize">{plan.type}</h3>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
            plan.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {plan.status ? "Active" : "Inactive"}
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold text-gray-900">{formatAmount(plan.amount)}</p>
        <span
          className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            frequencyBadge[plan.frequency] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {plan.frequency}
        </span>
      </div>

      <p className="text-xs text-gray-400 truncate font-mono">ID: {plan.id}</p>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onEdit(plan)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit
        </button>
        <button
          onClick={() => onDelete(plan)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export default function SubscriptionManagement({ onBack }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { plans, loading, actionLoading, error } = useSelector(
    (s: RootState) => s.subscription
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan,   setEditPlan]   = useState<SubscriptionPlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<SubscriptionPlan | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    dispatch(fetchAllSubscriptions());
  }, [dispatch]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async (payload: CreateSubscriptionPayload) => {
    const result = await dispatch(createSubscription(payload));
    if (createSubscription.fulfilled.match(result)) {
      showToast("Subscription plan created successfully.");
      setCreateOpen(false);
    } else {
      showToast((result.payload as string) ?? "Creation failed.", "error");
    }
  };

  const handleUpdate = async (payload: CreateSubscriptionPayload) => {
    if (!editPlan) return;
    const result = await dispatch(updateSubscription({ id: editPlan.id, payload }));
    if (updateSubscription.fulfilled.match(result)) {
      showToast("Subscription plan updated successfully.");
      setEditPlan(null);
    } else {
      showToast((result.payload as string) ?? "Update failed.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deletePlan) return;
    const result = await dispatch(deleteSubscription(deletePlan.id));
    if (deleteSubscription.fulfilled.match(result)) {
      showToast("Subscription plan deleted.");
      setDeletePlan(null);
    } else {
      showToast((result.payload as string) ?? "Deletion failed.", "error");
    }
  };

  // Edit form initial values — key prop on SubscriptionForm forces re-mount
  // instead of using an effect to sync state (fixes setState-in-effect lint).
  const editInitial: FormState | undefined = editPlan
    ? {
        amount:    String(editPlan.amount),
        frequency: editPlan.frequency,
        type:      editPlan.type as PlanType,
        status:    editPlan.status,
      }
    : undefined;

  const activePlans   = plans.filter((p) => p.status).length;
  const inactivePlans = plans.length - activePlans;

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
              <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage and configure subscription plans</p>
            </div>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Plan
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Plans",    value: plans.length,  color: "text-blue-600",  bg: "bg-blue-50"  },
            { label: "Active Plans",   value: activePlans,   color: "text-green-600", bg: "bg-green-50" },
            { label: "Inactive Plans", value: inactivePlans, color: "text-gray-500",  bg: "bg-gray-50"  },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
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
        {!loading && plans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-400" stroke="currentColor" strokeWidth={1.5}>
                <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-gray-900 font-medium">No subscription plans yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Create your first plan to get started</p>
            <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm">
              Create Plan
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && plans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={setEditPlan}
                onDelete={setDeletePlan}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Subscription Plan">
        <SubscriptionForm
          key="create"
          onSubmit={handleCreate}
          loading={actionLoading}
          submitLabel="Create Plan"
        />
      </Modal>

      {/* Edit Modal — key forces full re-mount so initial state is fresh */}
      <Modal open={!!editPlan} onClose={() => setEditPlan(null)} title="Edit Subscription Plan">
        {editInitial && (
          <SubscriptionForm
            key={editPlan?.id}
            initial={editInitial}
            onSubmit={handleUpdate}
            loading={actionLoading}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deletePlan} onClose={() => setDeletePlan(null)} title="Confirm Deletion">
        <ConfirmDelete
          plan={deletePlan}
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeletePlan(null)}
        />
      </Modal>
    </div>
  );
}