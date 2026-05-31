"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";

// Commission
import {
  fetchCommissions, addCommission, editCommission, removeCommission, toggleCommission,
} from "@/lib/redux/commissionSlice";
import type { ApiCommission, CreateCommissionPayload } from "@/lib/api/commissionApi";

// Verification Settings
import {
  fetchVerificationSettings,
  createVerificationSettings,
  updateVerificationSettings,
  deleteVerificationSettings,
  toggleVerificationSettingsStatus,
} from "@/lib/redux/verificationSettingsSlice";
import type { VerificationSettings, VerificationSettingsData } from "@/lib/api/verificationSettingsApi";

// TAS Tier
import {
  fetchTasTiers,
  createTasTier,
  updateTasTier,
  deleteTasTier,
  toggleTasTierStatus,
} from "@/lib/redux/tastierSlice";
import type { TasTier, TasTierData, TierConfig } from "@/lib/api/tastierApi";

// ── Shared styles ─────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  borderRadius: "16px",
  border: "1px solid #E5E7EB",
  backgroundColor: "#ffffff",
  padding: "20px",
};

const INP: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #E5E7EB",
  backgroundColor: "#F9FAFB",
  fontSize: "13px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#6B7280",
  marginBottom: "6px",
};

// ── Shared display atoms ──────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B7280", margin: "0" }}>
      {text}
    </p>
  );
}

function SubLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: "8px", marginTop: "4px" }}>
      {text}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#fff", marginBottom: "6px" }}>
      <span style={{ fontSize: "13px", color: "#6B7280", flex: 1 }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

function RecordActions({ onToggle, onEdit, onDelete, isActive, isMutating }: {
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
  isActive?: boolean; isMutating?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
      <button onClick={onToggle} disabled={isMutating} title={isActive ? "Disable" : "Enable"}
        style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: isActive ? "#16a34a" : "#9CA3AF" }}>
        {isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
      </button>
      <button onClick={onEdit}
        style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}>
        <Pencil size={14} strokeWidth={1.8} />
      </button>
      <button onClick={onDelete} disabled={isMutating}
        style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>
        <Trash2 size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}

function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 16px", border: "1px dashed #E5E7EB", borderRadius: "12px", color: "#9CA3AF" }}>
      <p style={{ fontSize: "13px", marginBottom: "12px" }}>No {label} configured yet.</p>
      <button onClick={onAdd} className="btn-primary"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
        <Plus size={13} /> Add {label}
      </button>
    </div>
  );
}

function CardLoader() {
  return (
    <div style={{ textAlign: "center", padding: "32px", color: "#9CA3AF", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      <Loader2 size={15} className="animate-spin" /> Loading...
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, disabled }: {
  onClose: () => void; onSave: () => void; saving: boolean; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <button onClick={onClose}
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: "pointer" }}>
        Cancel
      </button>
      <button onClick={onSave} disabled={saving || disabled} className="btn-primary"
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: saving ? "not-allowed" : "pointer", opacity: saving || disabled ? 0.7 : 1 }}>
        {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : "Save"}
      </button>
    </div>
  );
}

function DeleteModal({ name, onClose, onConfirm, saving }: {
  name: string; onClose: () => void; onConfirm: () => void; saving: boolean;
}) {
  return (
    <Modal open onClose={onClose} title="Confirm Delete" size="sm"
      footer={
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#fff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={saving}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : "Delete"}
          </button>
        </div>
      }>
      <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
        Are you sure you want to delete <strong style={{ color: "#111827" }}>{name}</strong>? This cannot be undone.
      </p>
    </Modal>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-primary"
      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}>
      <Plus size={13} /> Add
    </button>
  );
}

const naira = (n: number | undefined | null) => n != null ? `₦${Number(n).toLocaleString()}` : "—";

// ═══════════════════════════════════════════════════════════════════════════════
// COMMISSION
// ═══════════════════════════════════════════════════════════════════════════════
function CommissionModal({ item, onClose, onSave, saving }: {
  item: ApiCommission | null;
  onClose: () => void;
  onSave: (p: CreateCommissionPayload) => void;
  saving: boolean;
}) {
  const [model2Rate, setModel2Rate] = useState(String(item?.model2CommissionRate ?? ""));
  const [model1Sub,  setModel1Sub]  = useState(item?.modelISubscription ?? "");
  const [tasBonus,   setTasBonus]   = useState(String(item?.tasRegistrationBonus ?? ""));
  const [tasModel1,  setTasModel1]  = useState(String(item?.tasModel1Commission ?? ""));
  const [tasModel2,  setTasModel2]  = useState(String(item?.tasModel2Commission ?? ""));
  const [effDate,    setEffDate]    = useState(
    item?.effectiveDate ? new Date(item.effectiveDate).toISOString().slice(0, 10) : ""
  );

  const valid = model2Rate && model1Sub && tasBonus && tasModel1 && tasModel2 && effDate;

  return (
    <Modal open onClose={onClose} title={item ? "Edit Commission Settings" : "Add Commission Settings"}
      footer={
        <ModalFooter onClose={onClose} saving={saving} disabled={!valid}
          onSave={() => onSave({
            model2CommissionRate: Number(model2Rate),
            modelISubscription:   model1Sub,
            tasRegistrationBonus: Number(tasBonus),
            tasModel1Commission:  Number(tasModel1),
            tasModel2Commission:  Number(tasModel2),
            effectiveDate:        new Date(effDate).toISOString().replace("Z", "+00:00"),
          })}
        />
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <SubLabel text="Expert" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={LABEL_STYLE}>Model 2 Commission Rate (%)</label>
            <input style={INP} type="number" placeholder="e.g. 10" value={model2Rate}
              onChange={(e) => setModel2Rate(e.target.value)} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Model 1 Subscription</label>
            <input style={INP} placeholder="e.g. ₦50,000 / month" value={model1Sub}
              onChange={(e) => setModel1Sub(e.target.value)} />
          </div>
        </div>
        <SubLabel text="TAS" />
        <div>
          <label style={LABEL_STYLE}>Registration Bonus (₦)</label>
          <input style={INP} type="number" placeholder="e.g. 7000" value={tasBonus}
            onChange={(e) => setTasBonus(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={LABEL_STYLE}>Model 1 Commission (₦/month)</label>
            <input style={INP} type="number" placeholder="e.g. 1000" value={tasModel1}
              onChange={(e) => setTasModel1(e.target.value)} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Model 2 Commission (%)</label>
            <input style={INP} type="number" placeholder="e.g. 1" value={tasModel2}
              onChange={(e) => setTasModel2(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={LABEL_STYLE}>Effective Date</label>
          <input style={INP} type="date" value={effDate} onChange={(e) => setEffDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function CommissionCard() {
  const dispatch = useAppDispatch();
  const { list, listStatus, mutateStatus } = useAppSelector((s) => s.commission);
  const isMutating = mutateStatus === "loading";
  const [editItem,   setEditItem]   = useState<ApiCommission | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiCommission | null>(null);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchCommissions());
  }, [dispatch, listStatus]);

  const handleSave = (payload: CreateCommissionPayload) => {
    const action = editItem
      ? dispatch(editCommission({ id: editItem.id, payload }))
      : dispatch(addCommission(payload));

    action.unwrap()
      .then(() => {
        toast.success(editItem ? "Commission updated" : "Commission created");
        setEditItem(null);
        setShowAdd(false);
      })
      .catch((err: string) => toast.error("Failed to save", { description: err }));
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    dispatch(removeCommission(deleteItem.id)).unwrap()
      .then(() => { toast.success("Deleted"); setDeleteItem(null); })
      .catch((err: string) => { toast.error("Failed to delete", { description: err }); setDeleteItem(null); });
  };

  return (
    <>
      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <SectionLabel text="Commission Settings" />
          <AddButton onClick={() => setShowAdd(true)} />
        </div>

        {listStatus === "loading" && <CardLoader />}

        {(listStatus === "succeeded" || listStatus === "failed") && list.length === 0 && (
          <div style={{ marginBottom: "10px", padding: "14px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Default Settings
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <button disabled title="Enable" style={{ padding: "4px", background: "none", border: "none", cursor: "not-allowed", color: "#9CA3AF" }}>
                  <ToggleLeft size={20} />
                </button>
                <button onClick={() => setShowAdd(true)} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}>
                  <Pencil size={14} strokeWidth={1.8} />
                </button>
              </div>
            </div>
            <SubLabel text="Expert" />
            <InfoRow label="Model 2 Commission Rate" value="10%" />
            <InfoRow label="Model 1 Subscription Fee" value="₦50,000 / month" />
            <div style={{ borderTop: "1px solid #E5E7EB", margin: "10px 0" }} />
            <SubLabel text="TAS" />
            <InfoRow label="Registration Bonus"  value="₦7,000" />
            <InfoRow label="Model 2 Commission"  value="1%" />
            <InfoRow label="Model 1 Commission"  value="₦1,000 / month" />
           
          </div>
        )}

        {list.map((c) => (
          <div key={c.id} style={{ marginBottom: "10px", padding: "14px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Effective {c.effectiveDate ? new Date(c.effectiveDate).toLocaleDateString("en-NG") : "—"}
              </span>
              <RecordActions
                isActive={c.status} isMutating={isMutating}
                onToggle={() =>
                  dispatch(toggleCommission(c.id)).unwrap()
                    .then(() => toast.success(`Commission ${c.status ? "disabled" : "enabled"}`))
                    .catch((e: string) => toast.error(e))
                }
                onEdit={() => setEditItem(c)}
                onDelete={() => setDeleteItem(c)}
              />
            </div>
            <SubLabel text="Expert" />
            <InfoRow label="Model 2 Commission Rate" value={`${c.model2CommissionRate}%`} />
            <InfoRow label="Model 1 Subscription Fee" value={c.modelISubscription ?? "—"} />
            <div style={{ borderTop: "1px solid #E5E7EB", margin: "10px 0" }} />
            <SubLabel text="TAS" />
            <InfoRow label="Registration Bonus" value={naira(c.tasRegistrationBonus)} />
            <InfoRow label="Model 2 Commission"  value={`${c.tasModel2Commission}%`} />
            <InfoRow label="Model 1 Commission"  value={`${naira(c.tasModel1Commission)} / month`} />
          </div>
        ))}
      </div>

      {(showAdd || editItem) && (
        <CommissionModal
          item={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={handleSave}
          saving={isMutating}
        />
      )}
      {deleteItem && (
        <DeleteModal
          name={`commission (effective ${deleteItem.effectiveDate ? new Date(deleteItem.effectiveDate).toISOString().slice(0, 10) : ""})`}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          saving={isMutating}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION TIER
// ═══════════════════════════════════════════════════════════════════════════════
function VerificationModal({ item, onClose, onSave, saving }: {
  item: VerificationSettings | null;
  onClose: () => void;
  onSave: (p: VerificationSettingsData) => void;
  saving: boolean;
}) {
  const [t1, setT1] = useState(String(item?.tier1MaxJobValue ?? ""));
  const [t2, setT2] = useState(String(item?.tier2MaxJobValue ?? ""));
  const [t3, setT3] = useState(String(item?.tier3MinJobValue ?? ""));
  const valid = t1 && t2 && t3;

  return (
    <Modal open onClose={onClose} title={item ? "Edit Verification Tier" : "Add Verification Tier"}
      footer={
        <ModalFooter onClose={onClose} saving={saving} disabled={!valid}
          onSave={() => onSave({ tier1MaxJobValue: Number(t1), tier2MaxJobValue: Number(t2), tier3MinJobValue: Number(t3) })}
        />
      }>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={LABEL_STYLE}>Tier 1 Max Job Value (₦)</label>
          <input style={INP} type="number" placeholder="e.g. 20000" value={t1} onChange={(e) => setT1(e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Tier 2 Max Job Value (₦)</label>
          <input style={INP} type="number" placeholder="e.g. 100000" value={t2} onChange={(e) => setT2(e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Tier 3 Verification Fee (₦)</label>
          <input style={INP} type="number" placeholder="e.g. 5000" value={t3} onChange={(e) => setT3(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function VerificationCard() {
  const dispatch = useAppDispatch();
  // ✅ Fixed: s.verificationSettings (new slice) — not s.verifications (old slice)
  const { settings, loading } = useAppSelector((s) => s.verificationSettings);
  const [editItem,   setEditItem]   = useState<VerificationSettings | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [deleteItem, setDeleteItem] = useState<VerificationSettings | null>(null);

  useEffect(() => { dispatch(fetchVerificationSettings()); }, [dispatch]);

  const handleSave = (payload: VerificationSettingsData) => {
    const action = editItem
      ? dispatch(updateVerificationSettings({ id: editItem.id, data: payload }))
      : dispatch(createVerificationSettings(payload));

    action.unwrap()
      .then(() => { toast.success(editItem ? "Updated" : "Created"); setEditItem(null); setShowAdd(false); })
      .catch((err: string) => toast.error("Failed to save", { description: err }));
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    dispatch(deleteVerificationSettings(deleteItem.id)).unwrap()
      .then(() => { toast.success("Deleted"); setDeleteItem(null); })
      .catch((err: string) => { toast.error("Failed to delete", { description: err }); setDeleteItem(null); });
  };

  return (
    <>
      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <SectionLabel text="Verification Tier Settings" />
          <AddButton onClick={() => setShowAdd(true)} />
        </div>

        {loading && <CardLoader />}

        {!loading && settings.length === 0 && (
          <EmptyState label="verification tier" onAdd={() => setShowAdd(true)} />
        )}

        {settings.map((v: VerificationSettings) => (
          <div key={v.id} style={{ marginBottom: "10px", padding: "14px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <RecordActions
                isActive={v.status} isMutating={loading}
                onToggle={() =>
                  dispatch(toggleVerificationSettingsStatus(v.id)).unwrap()
                    .then(() => toast.success(`Verification tier ${v.status ? "disabled" : "enabled"}`))
                    .catch((e: string) => toast.error(e))
                }
                onEdit={() => setEditItem(v)}
                onDelete={() => setDeleteItem(v)}
              />
            </div>
            <InfoRow label="Tier 1 Max Job Value"    value={naira(v.tier1MaxJobValue)} />
            <InfoRow label="Tier 2 Max Job Value"    value={naira(v.tier2MaxJobValue)} />
            <InfoRow label="Tier 3 Verification Fee" value={naira(v.tier3MinJobValue)} />
          </div>
        ))}
      </div>

      {(showAdd || editItem) && (
        <VerificationModal
          item={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={handleSave}
          saving={loading}
        />
      )}
      {deleteItem && (
        <DeleteModal
          name="verification tier record"
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          saving={loading}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAS TIER
// ═══════════════════════════════════════════════════════════════════════════════
const TIER_KEYS = ["tier1", "tier2", "tier3", "tier4", "tier5", "tier6"] as const;
type TierKey = typeof TIER_KEYS[number];

const TIER_COLORS: Record<TierKey, string> = {
  tier1: "#2563eb", tier2: "#16a34a", tier3: "#d97706",
  tier4: "#7c3aed", tier5: "#db2777", tier6: "#0891b2",
};

const TIER_LABELS: Record<TierKey, string> = {
  tier1: "Tier 1", tier2: "Tier 2", tier3: "Tier 3",
  tier4: "Tier 4", tier5: "Tier 5", tier6: "Tier 6",
};

function emptyTiers(): Record<TierKey, TierConfig> {
  return {
    tier1: { experts: 0,    bonus: 0  },
    tier2: { experts: 50,   bonus: 5  },
    tier3: { experts: 200,  bonus: 10 },
    tier4: { experts: 500,  bonus: 12 },
    tier5: { experts: 1000, bonus: 15 },
    tier6: { experts: 2500, bonus: 20 },
  };
}

function TasTierModal({ item, onClose, onSave, saving }: {
  item: TasTier | null;
  onClose: () => void;
  onSave: (p: TasTierData) => void;
  saving: boolean;
}) {
  const [tiers, setTiers] = useState<Record<TierKey, TierConfig>>(() => {
    if (item) {
      return {
        tier1: item.tier1,
        tier2: item.tier2,
        tier3: item.tier3,
        tier4: item.tier4,
        tier5: item.tier5,
        tier6: item.tier6,
      };
    }
    return emptyTiers();
  });

  const setField = (key: TierKey, field: keyof TierConfig, val: string) =>
    setTiers((prev) => ({ ...prev, [key]: { ...prev[key], [field]: Number(val) } }));

  return (
    <Modal open onClose={onClose} title={item ? "Edit TAS Tier Settings" : "Add TAS Tier Settings"}
      footer={<ModalFooter onClose={onClose} saving={saving} onSave={() => onSave(tiers)} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {TIER_KEYS.map((key) => {
          const color = TIER_COLORS[key];
          return (
            <div key={key}>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", color, backgroundColor: `${color}14`, border: `1px solid ${color}30` }}>
                  {TIER_LABELS[key]}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={LABEL_STYLE}>Min Experts</label>
                  <input style={INP} type="number" value={tiers[key].experts}
                    onChange={(e) => setField(key, "experts", e.target.value)} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Bonus (%)</label>
                  <input style={INP} type="number" value={tiers[key].bonus}
                    onChange={(e) => setField(key, "bonus", e.target.value)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function TasTierCard() {
  const dispatch = useAppDispatch();
  // ✅ Fixed: s.tastier (new slice) — not s.tas (old slice)
  const { tiers, loading } = useAppSelector((s) => s.tastier);
  const [editItem,   setEditItem]   = useState<TasTier | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [deleteItem, setDeleteItem] = useState<TasTier | null>(null);

  useEffect(() => { dispatch(fetchTasTiers()); }, [dispatch]);

  const handleSave = (payload: TasTierData) => {
    const action = editItem
      ? dispatch(updateTasTier({ id: editItem.id, data: payload }))
      : dispatch(createTasTier(payload));

    action.unwrap()
      .then(() => { toast.success(editItem ? "Updated" : "Created"); setEditItem(null); setShowAdd(false); })
      .catch((err: string) => toast.error("Failed to save", { description: err }));
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    dispatch(deleteTasTier(deleteItem.id)).unwrap()
      .then(() => { toast.success("Deleted"); setDeleteItem(null); })
      .catch((err: string) => { toast.error("Failed to delete", { description: err }); setDeleteItem(null); });
  };

  return (
    <>
      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <SectionLabel text="TAS Tier Settings" />
          <AddButton onClick={() => setShowAdd(true)} />
        </div>

        {loading && <CardLoader />}

        {!loading && tiers.length === 0 && (
          <EmptyState label="TAS tier settings" onAdd={() => setShowAdd(true)} />
        )}

        {tiers.map((t: TasTier) => (
          <div key={t.id} style={{ marginBottom: "10px", padding: "14px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <RecordActions
                isActive={t.status} isMutating={loading}
                onToggle={() =>
                  dispatch(toggleTasTierStatus(t.id)).unwrap()
                    .then(() => toast.success(`TAS tier ${t.status ? "disabled" : "enabled"}`))
                    .catch((e: string) => toast.error(e))
                }
                onEdit={() => setEditItem(t)}
                onDelete={() => setDeleteItem(t)}
              />
            </div>
            {TIER_KEYS.map((key) => {
              const color = TIER_COLORS[key];
              const tier  = t[key] as TierConfig;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#fff", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "999px", whiteSpace: "nowrap", flexShrink: 0, color, backgroundColor: `${color}14`, border: `1px solid ${color}30` }}>
                    {TIER_LABELS[key]}
                  </span>
                  <span style={{ fontSize: "13px", color: "#374151", flex: 1 }}>
                    {(tier?.experts ?? 0).toLocaleString()}+ experts
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                    {tier?.bonus ?? 0}% bonus
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {(showAdd || editItem) && (
        <TasTierModal
          item={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={handleSave}
          saving={loading}
        />
      )}
      {deleteItem && (
        <DeleteModal
          name="TAS tier record"
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          saving={loading}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE SHELL
// ═══════════════════════════════════════════════════════════════════════════════
export default function CommissionSettings({ onBack }: { onBack: () => void }) {
  return (
    <SubPageShell title="System Settings" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
        <CommissionCard />
        <VerificationCard />
        <TasTierCard />
      </div>
    </SubPageShell>
  );
}