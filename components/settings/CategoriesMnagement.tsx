 
// components/settings/CategoriesManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { Download, Plus, Loader2, Trash2, ChevronRight } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Loader";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchCategories, addCategory, editCategory, removeCategory } from "@/lib/redux/categoriesSlice";
import { PREMIUM_LUCIDE_ICONS, renderLucideIcon, parseIconPayload } from "@/lib/utils/premiumIcons";
import type { ApiCategory } from "@/lib/api/categoriesApi";

const COLOR_OPTIONS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#dc2626", "#65a30d"];
const DEFAULT_COLOR = "#2563eb";

interface CategoryForm {
  category: string;
  subCategories: string[];
  iconCode: string;   
  themeColor: string; // Can be empty string now if unselected
  status: "active" | "inactive";
}

const emptyForm: CategoryForm = { category: "", subCategories: ["", "", ""], iconCode: "Broom", themeColor: "", status: "active" };

function PremiumLucideIconPicker({ 
  selectedIcon, 
  selectedColor, 
  onSelectIcon, 
  onSelectColor 
}: { 
  selectedIcon: string; 
  selectedColor: string; 
  onSelectIcon: (code: string) => void; 
  onSelectColor: (color: string) => void; 
}) {
  // Fallback to default blue for UI highlights if no color is picked yet
  const activeHighlightColor = selectedColor || DEFAULT_COLOR;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px" }}>
      
      {/* Color picker palette (Moved to the top) */}
      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "10px" }}>
          1. Choose Theme Color
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: color,
                border: selectedColor === color ? "3px solid #ffffff" : "none",
                outline: selectedColor === color ? `2px solid ${color}` : "none",
                cursor: "pointer",
                transform: selectedColor === color ? "scale(1.1)" : "scale(1)",
                transition: "all 0.1s ease"
              }}
            />
          ))}
          {selectedColor && (
            <button
              type="button"
              onClick={() => onSelectColor("")}
              style={{ background: "none", border: "none", fontSize: "11px", color: "var(--color-text-muted)", cursor: "pointer", paddingLeft: "4px" }}
            >
              Reset to Default
            </button>
          )}
        </div>
      </div>

      {/* Icon picker grid */}
      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "10px" }}>
          2. Select Category Icon
        </label>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))",
          gap: "10px",
          maxHeight: "150px",
          overflowY: "auto",
          padding: "4px"
        }}>
          {PREMIUM_LUCIDE_ICONS.map((icon) => {
            const isSelected = selectedIcon === icon.code;
            return (
              <button
                key={icon.code}
                type="button"
                onClick={() => onSelectIcon(icon.code)}
                style={{
                  padding: "12px 6px",
                  borderRadius: "12px",
                  border: isSelected ? `2px solid ${activeHighlightColor}` : "1px solid var(--color-border)",
                  backgroundColor: isSelected ? `${activeHighlightColor}10` : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ color: isSelected ? activeHighlightColor : "var(--color-text-muted)" }}>
                  {renderLucideIcon(icon.code, 22)}
                </div>
                <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-main)", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  {icon.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function CategoryFormModal({ open, onClose, onUpload, onDraft, initial, title, loading }: {
  open: boolean; onClose: () => void;
  onUpload: (form: CategoryForm) => void; onDraft: (form: CategoryForm) => void;
  initial?: CategoryForm; title: string; loading: boolean;
}) {
  const [form, setForm] = useState<CategoryForm>(initial ?? emptyForm);

  const updateSub = (i: number, val: string) =>
    setForm((f) => ({ ...f, subCategories: f.subCategories.map((s, idx) => idx === i ? val : s) }));

  const addSub = () => setForm((f) => ({ ...f, subCategories: [...f.subCategories, ""] }));

  const footer = (
    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
      <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
        Cancel
      </button>
      <button onClick={() => onDraft({ ...form, status: "inactive" })} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
        Draft
      </button>
      <button onClick={() => onUpload({ ...form, status: "active" })} disabled={loading} className="btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading && <Loader2 size={14} className="animate-spin" />} Upload
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Category name */}
        <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "8px" }}>Category Name</label>
          <input
            type="text" placeholder="Enter category name..."
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
          />
        </div>

        {/* Dual Picker System */}
        <PremiumLucideIconPicker 
          selectedIcon={form.iconCode} 
          selectedColor={form.themeColor}
          onSelectIcon={(code) => setForm((f) => ({ ...f, iconCode: code }))}
          onSelectColor={(color) => setForm((f) => ({ ...f, themeColor: color }))}
        />

        {/* Sub-categories */}
        <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)" }}>Sub-categories</label>
          {form.subCategories.map((sub, i) => (
            <input key={i} type="text" placeholder="Enter sub-category..." value={sub} onChange={(e) => updateSub(i, e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          ))}
          <button onClick={addSub} style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
            + Add more
          </button>
        </div>

      </div>
    </Modal>
  );
}

export default function CategoriesManagement({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { list, listStatus, mutateStatus } = useAppSelector((s) => s.categories);

  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<ApiCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiCategory | null>(null);

  const isMutating = mutateStatus === "loading";

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchCategories());
  }, [dispatch, listStatus]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch(removeCategory(deleteTarget.id)).unwrap()
      .then(() => setDeleteTarget(null)).catch(() => {});
  };

  const saveCategory = (form: CategoryForm, editId?: string) => {
    if (!form.category.trim()) return;
    const subs = form.subCategories.filter((s) => s.trim());
    
    // Fall back to default color token string value if left blank by user
    const finalColor = form.themeColor || DEFAULT_COLOR;
    const packedIconValue = `${form.iconCode}|${finalColor}`;

    const payload = { 
      category: form.category, 
      imageUrl: packedIconValue, 
      subCategory: subs.length > 0 ? subs : undefined,
      status: form.status
    };

    if (editId) {
      dispatch(editCategory({ id: editId, payload })).unwrap()
        .then(() => { setEditTarget(null); }).catch(() => {});
    } else {
      dispatch(addCategory(payload)).unwrap()
        .then(() => { setAddOpen(false); }).catch(() => {});
    }
  };

  return (
    <>
      <style>{`
        .cat-table-wrap { display: none; }
        .cat-cards      { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .cat-footer     { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--color-border); }

        @media (min-width: 640px) {
          .cat-table-wrap { display: block; overflow-x: auto; }
          .cat-cards      { display: none; }
          .cat-footer     { padding: 14px 24px; }
        }
      `}</style>

      <SubPageShell
        title="Categories Management"
        onBack={onBack}
        action={
          <button onClick={() => setAddOpen(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            <Plus size={15} /> Add
          </button>
        }
      >
        {listStatus === "loading" && <PageLoader text="Loading categories..." />}
        {listStatus === "failed"  && <p style={{ textAlign: "center", fontSize: "13px", color: "#ef4444", padding: "48px" }}>Failed to load categories.</p>}

        {listStatus === "succeeded" && (
          <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden", marginTop: "20px" }}>

            {/* Desktop table */}
            <div className="cat-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    {["Category Name", "Icon Token", "Sub-categories", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px", fontSize: "13px", color: "var(--color-text-muted)" }}>No categories yet. Add one to get started.</td></tr>
                  ) : list.map((cat: ApiCategory) => {
                    const { icon, color } = parseIconPayload(cat.imageUrl);
                    const isInactive = cat.status === "inactive";
                    return (
                      <tr key={cat.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)" }}>{cat.category}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ 
                            width: 44, height: 44, borderRadius: "12px", 
                            background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`, 
                            border: `1px solid ${color}28`, 
                            display: "flex", alignItems: "center", justifyContent: "center" 
                          }}>
                            {renderLucideIcon(icon, 18, color)}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{cat.subCategory?.length ?? 0}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ 
                            fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", 
                            color: isInactive ? "#4b5563" : "#15803d", 
                            backgroundColor: isInactive ? "#f3f4f6" : "#dcfce7", 
                            border: isInactive ? "1px solid #e5e7eb" : "1px solid #bbf7d0" 
                          }}>
                            {isInactive ? "Draft" : "Active"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button onClick={() => setEditTarget(cat)} style={{ padding: "6px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button onClick={() => setDeleteTarget(cat)} style={{ padding: "6px", borderRadius: "8px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", color: "#f87171" }}>
                              <Trash2 size={15} strokeWidth={1.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="cat-cards">
              {list.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No categories yet.</p>
              ) : list.map((cat: ApiCategory) => {
                const { icon, color } = parseIconPayload(cat.imageUrl);
                const isInactive = cat.status === "inactive";
                return (
                  <div key={cat.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: "12px", 
                      background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`, 
                      border: `1px solid ${color}28`, 
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 
                    }}>
                      {renderLucideIcon(icon, 18, color)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "3px" }}>{cat.category}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{cat.subCategory?.length ?? 0} subs</span>
                        <span style={{ 
                          fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", 
                          color: isInactive ? "#4b5563" : "#15803d", 
                          backgroundColor: isInactive ? "#f3f4f6" : "#dcfce7", 
                          border: isInactive ? "1px solid #e5e7eb" : "1px solid #bbf7d0" 
                        }}>
                          {isInactive ? "Draft" : "Active"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button onClick={() => setEditTarget(cat)} style={{ padding: "7px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="cat-footer">
              <button style={{ padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                Reorder Categories
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                <Download size={14} /> Export
              </button>
            </div>

          </div>
        )}

        {/* Add Modal */}
        <CategoryFormModal key={addOpen ? "add-open" : "add-closed"} open={addOpen} onClose={() => setAddOpen(false)}
          onUpload={(form) => saveCategory(form)} onDraft={(form) => saveCategory(form)}
          title="Add Category" loading={isMutating} />

        {/* Edit Modal */}
        <CategoryFormModal key={editTarget?.id ?? "edit-closed"} open={!!editTarget} onClose={() => setEditTarget(null)}
          onUpload={(form) => editTarget && saveCategory(form, editTarget.id)}
          onDraft={(form) => editTarget && saveCategory(form, editTarget.id)}
          initial={editTarget ? (() => {
            const { icon, color } = parseIconPayload(editTarget.imageUrl);
            return { 
              category: editTarget.category, 
              subCategories: editTarget.subCategory?.length ? editTarget.subCategory : ["", "", ""], 
              iconCode: icon,
              themeColor: color === DEFAULT_COLOR ? "" : color, // empty means default color
              status: (editTarget.status as "active" | "inactive") ?? "active"
            };
          })() : undefined}
          title="Edit Category" loading={isMutating} />

        {/* Delete Modal */}
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category" size="sm"
          footer={
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "var(--color-text-muted)" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isMutating} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: isMutating ? 0.7 : 1 }}>
                {isMutating && <Loader2 size={14} className="animate-spin" />} Delete
              </button>
            </div>
          }
        >
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: "var(--color-text-main)" }}>{deleteTarget?.category}</strong>?
            This action cannot be undone.
          </p>
        </Modal>

      </SubPageShell>
    </>
  );
}