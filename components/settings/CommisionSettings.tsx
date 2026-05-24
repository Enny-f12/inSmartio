// components/settings/CommissionSettings.tsx
"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchCommissions, addCommission, editCommission,
  removeCommission, toggleCommission,
} from "@/lib/redux/commissionSlice";
import type { ApiCommission, CreateCommissionPayload } from "@/lib/api/commissionApi";

// ── Static display helpers ────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B7280", margin: "0 0 12px" }}>
      {text}
    </p>
  );
}

function InfoRow({
  label, value, onEdit, onDelete, onToggle, isActive, isMutating,
}: {
  label:     string;
  value:     string;
  onEdit?:   () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  isActive?: boolean;
  isMutating?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", marginBottom: "8px" }}>
      <span style={{ fontSize: "13px", color: "#6B7280", flex: 1, minWidth: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827", flexShrink: 0 }}>{value}</span>
      {onToggle && (
        <button onClick={onToggle} disabled={isMutating} title={isActive ? "Disable" : "Enable"}
          style={{ padding: "2px", background: "none", border: "none", cursor: "pointer", color: isActive ? "#16a34a" : "#9CA3AF", flexShrink: 0 }}>
          {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6B7280", flexShrink: 0 }}>
          <Pencil size={14} strokeWidth={1.8} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} disabled={isMutating} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#ef4444", flexShrink: 0 }}>
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

const CARD: React.CSSProperties = {
  borderRadius: "16px", border: "1px solid #E5E7EB",
  backgroundColor: "#ffffff", padding: "16px",
};

// ── Commission Modal ──────────────────────────────────────
function CommissionModal({
  item, onClose, onSave, saving,
}: {
  item:    ApiCommission | null;
  onClose: () => void;
  onSave:  (p: CreateCommissionPayload) => void;
  saving:  boolean;
}) {
  const [name,   setName]   = useState(item?.name        ?? "");
  const [type,   setType]   = useState(item?.type        ?? "expert");
  const [rate,   setRate]   = useState(String(item?.rate   ?? ""));
  const [amount, setAmount] = useState(String(item?.amount ?? ""));
  const [desc,   setDesc]   = useState(item?.description  ?? "");

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
    fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box",
  };

  const footer = (
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <button onClick={onClose}
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "pointer" }}>
        Cancel
      </button>
      <button onClick={() => onSave({ name, type, rate: rate ? Number(rate) : undefined, amount: amount ? Number(amount) : undefined, description: desc })}
        disabled={saving || !name.trim()}
        className="btn-primary"
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: saving ? 0.7 : 1 }}>
        {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : item ? "Save Changes" : "Create"}
      </button>
    </div>
  );

  return (
    <Modal open onClose={onClose} title={item ? "Edit Commission" : "Add Commission"} footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Name *</label>
          <input style={inp} placeholder="e.g. Model 2 Commission Rate" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              style={{ ...inp, appearance: "none", cursor: "pointer" } as React.CSSProperties}>
              <option value="expert">Expert</option>
              <option value="tas">TAS</option>
              <option value="platform">Platform</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Rate (%)</label>
            <input style={inp} type="number" placeholder="e.g. 10" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Amount (₦)</label>
          <input style={inp} type="number" placeholder="e.g. 50000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Description</label>
          <input style={inp} placeholder="e.g. Monthly subscription fee" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

// ── Format display value ──────────────────────────────────
const fmtValue = (c: ApiCommission): string => {
  if (c.rate   != null) return `${c.rate}%`;
  if (c.amount != null) return `₦${Number(c.amount).toLocaleString()}`;
  return "—";
};

// ── Main Component ────────────────────────────────────────
export default function CommissionSettings({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, mutateStatus } = useAppSelector((s) => s.commission);

  const [editItem,   setEditItem]   = useState<ApiCommission | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiCommission | null>(null);

  const isMutating = mutateStatus === "loading";

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchCommissions());
  }, [dispatch, listStatus]);

  const expertItems   = list.filter((c) => c.type === "expert");
  const tasItems      = list.filter((c) => c.type === "tas");
  const otherItems    = list.filter((c) => c.type !== "expert" && c.type !== "tas");

  const handleSave = (payload: CreateCommissionPayload) => {
    if (editItem) {
      dispatch(editCommission({ id: editItem.id, payload }))
        .unwrap()
        .then(() => { toast.success("Updated"); setEditItem(null); })
        .catch((err: string) => toast.error("Failed to update", { description: err }));
    } else {
      dispatch(addCommission(payload))
        .unwrap()
        .then(() => { toast.success("Commission created"); setShowAdd(false); })
        .catch((err: string) => toast.error("Failed to create", { description: err }));
    }
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    dispatch(removeCommission(deleteItem.id))
      .unwrap()
      .then(() => { toast.success("Deleted"); setDeleteItem(null); })
      .catch((err: string) => { toast.error("Failed to delete", { description: err }); setDeleteItem(null); });
  };

  const handleToggle = (c: ApiCommission) => {
    dispatch(toggleCommission(c.id))
      .unwrap()
      .then(() => toast.success(`${c.name} ${c.isActive ? "disabled" : "enabled"}`))
      .catch((err: string) => toast.error("Failed to toggle", { description: err }));
  };

  // ── Fallback static rows when API returns empty ───────
  const STATIC_EXPERT = [
    { label: "Model 2 Commission Rate",  value: "10%" },
    { label: "Model 1 Subscription Fee", value: "₦50,000 / month" },
  ];
  const STATIC_TAS = [
    { label: "Registration Bonus", value: "₦7,000" },
    { label: "Model 2 Commission", value: "1%" },
    { label: "Model 1 Commission", value: "₦1,000 / month" },
  ];

  return (
    <SubPageShell
      title="System Settings"
      onBack={onBack}
      action={
        <button onClick={() => setShowAdd(true)} className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
          <Plus size={14} /> Add Commission
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>

        {listStatus === "loading" && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px", gap: "8px", color: "#9CA3AF", fontSize: "13px" }}>
            <Loader2 size={16} className="animate-spin" /> Loading settings...
          </div>
        )}

        {listStatus === "failed" && (
          <p style={{ textAlign: "center", color: "#ef4444", fontSize: "13px" }}>{listError}</p>
        )}

        {/* All cards — only render after API responds */}
        {(listStatus === "succeeded" || listStatus === "failed") && (<>
        <div style={CARD}>
          <SectionLabel text="Commission Settings" />

          {/* Expert */}
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280", marginBottom: "8px" }}>Expert</p>
          {expertItems.length > 0
            ? expertItems.map((c) => (
                <InfoRow key={c.id} label={c.name} value={fmtValue(c)} isActive={c.isActive}
                  onEdit={() => setEditItem(c)}
                  onDelete={() => setDeleteItem(c)}
                  onToggle={() => handleToggle(c)}
                  isMutating={isMutating} />
              ))
            : (listStatus === "succeeded" && expertItems.length === 0)
              ? STATIC_EXPERT.map((r) => <InfoRow key={r.label} label={r.label} value={r.value} />)
              : null
          }

          {/* TAS */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px", marginTop: "6px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280", marginBottom: "8px" }}>TAS</p>
            {tasItems.length > 0
              ? tasItems.map((c) => (
                  <InfoRow key={c.id} label={c.name} value={fmtValue(c)} isActive={c.isActive}
                    onEdit={() => setEditItem(c)}
                    onDelete={() => setDeleteItem(c)}
                    onToggle={() => handleToggle(c)}
                    isMutating={isMutating} />
                ))
              : (listStatus === "succeeded" && tasItems.length === 0)
                ? STATIC_TAS.map((r) => <InfoRow key={r.label} label={r.label} value={r.value} />)
                : null
            }
          </div>

          {/* Other */}
          {otherItems.length > 0 && (
            <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px", marginTop: "6px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280", marginBottom: "8px" }}>Other</p>
              {otherItems.map((c) => (
                <InfoRow key={c.id} label={c.name} value={fmtValue(c)} isActive={c.isActive}
                  onEdit={() => setEditItem(c)}
                  onDelete={() => setDeleteItem(c)}
                  onToggle={() => handleToggle(c)}
                  isMutating={isMutating} />
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px" }}>
            <InfoRow label="Effective Date" value="01/04/2026" />
          </div>
        </div>

        {/* Verification Tier Settings — static */}
        <div style={CARD}>
          <SectionLabel text="Verification Tier Settings" />
          <InfoRow label="Tier 1 Max Job Value"    value="₦20,000" />
          <InfoRow label="Tier 2 Max Job Value"    value="₦100,000" />
          <InfoRow label="Tier 3 Verification Fee" value="₦5,000" />
        </div>

        {/* TAS Tier Settings — static */}
        <div style={CARD}>
          <SectionLabel text="TAS Tier Settings" />
          {[
            { t: "Tier 1", d: "0 – 49 experts – 0% bonus" },
            { t: "Tier 2", d: "50 – 199 experts – 5% bonus" },
            { t: "Tier 3", d: "200 – 499 experts – 10% bonus" },
            { t: "Tier 4", d: "500 – 999 experts – 12% bonus" },
            { t: "Tier 5", d: "1,000 – 2,499 experts – 15% bonus" },
            { t: "Tier 6", d: "2,500+ experts – 20% bonus" },
          ].map(({ t, d }, i) => {
            const colors = ["#2563eb","#16a34a","#d97706","#7c3aed","#db2777","#0891b2"];
            const color  = colors[i % colors.length];
            return (
              <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", whiteSpace: "nowrap", flexShrink: 0, color, backgroundColor: `${color}14`, border: `1px solid ${color}30` }}>{t}</span>
                <span style={{ fontSize: "13px", color: "#111827", lineHeight: 1.5 }}>{d}</span>
              </div>
            );
          })}
        </div>
        </>)}

      </div>

      {/* Add / Edit Modal */}
      {(showAdd || editItem) && (
        <CommissionModal
          item={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={handleSave}
          saving={isMutating}
        />
      )}

      {/* Delete confirm */}
      {deleteItem && (
        <Modal open onClose={() => setDeleteItem(null)} title="Delete Commission" size="sm"
          footer={
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button onClick={() => setDeleteItem(null)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isMutating}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isMutating ? 0.7 : 1 }}>
                {isMutating ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : "Delete"}
              </button>
            </div>
          }>
          <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: "#111827" }}>{deleteItem.name}</strong>? This cannot be undone.
          </p>
        </Modal>
      )}
    </SubPageShell>
  );
}