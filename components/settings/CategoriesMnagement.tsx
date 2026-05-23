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
import type { ApiCategory, ApiSubCategory } from "@/lib/api/categoriesApi";

const COLOR_OPTIONS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#dc2626", "#65a30d"];
const DEFAULT_COLOR = "#2563eb";

// ── Sub-category shape used in the form ──────────────────
interface SubCategoryForm {
  name:      string;
  iconCode:  string;
  themeColor: string;
}

interface CategoryForm {
  category:      string;
  subCategories: SubCategoryForm[];
  iconCode:      string;
  themeColor:    string;
  status:        "active" | "inactive";
}

const emptySub  = (): SubCategoryForm => ({ name: "", iconCode: "Broom", themeColor: "" });
const emptyForm = (): CategoryForm => ({
  category:      "",
  subCategories: [emptySub(), emptySub(), emptySub()],
  iconCode:      "Broom",
  themeColor:    "",
  status:        "active",
});

// ── Icon + Color Picker ───────────────────────────────────
function IconColorPicker({
  selectedIcon, selectedColor, onSelectIcon, onSelectColor, label,
}: {
  selectedIcon:   string;
  selectedColor:  string;
  onSelectIcon:   (code: string) => void;
  onSelectColor:  (color: string) => void;
  label?:         string;
}) {
  const highlight = selectedColor || DEFAULT_COLOR;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", padding: "12px" }}>
      {label && <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", margin: 0 }}>{label}</p>}

      {/* Color row */}
      <div>
        <p style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", marginBottom: "8px" }}>Theme Color</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {COLOR_OPTIONS.map((c) => (
            <button key={c} type="button" onClick={() => onSelectColor(c)}
              style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: c, border: selectedColor === c ? "3px solid #fff" : "none", outline: selectedColor === c ? `2px solid ${c}` : "none", cursor: "pointer", transform: selectedColor === c ? "scale(1.15)" : "scale(1)", transition: "all 0.1s" }}
            />
          ))}
          {selectedColor && (
            <button type="button" onClick={() => onSelectColor("")}
              style={{ fontSize: "11px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Icon grid */}
      <div>
        <p style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", marginBottom: "8px" }}>Icon</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px", maxHeight: "140px", overflowY: "auto" }}>
          {PREMIUM_LUCIDE_ICONS.map((icon) => {
            const sel = selectedIcon === icon.code;
            return (
              <button key={icon.code} type="button" onClick={() => onSelectIcon(icon.code)}
                style={{ padding: "10px 4px", borderRadius: "10px", border: sel ? `2px solid ${highlight}` : "1px solid #E5E7EB", backgroundColor: sel ? `${highlight}12` : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.12s" }}>
                <div style={{ color: sel ? highlight : "#9CA3AF" }}>{renderLucideIcon(icon.code, 20)}</div>
                <span style={{ fontSize: "10px", fontWeight: 500, color: "#374151", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{icon.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sub-category row in the form ─────────────────────────
function SubCategoryRow({
  sub, index, onChange, onRemove,
}: {
  sub:      SubCategoryForm;
  index:    number;
  onChange: (i: number, s: SubCategoryForm) => void;
  onRemove: (i: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ borderRadius: "10px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
      {/* Name row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px" }}>
        <input
          type="text" placeholder={`Sub-category ${index + 1}`}
          value={sub.name}
          onChange={(e) => onChange(index, { ...sub, name: e.target.value })}
          style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px", color: "#111827", backgroundColor: "#F9FAFB", outline: "none" }}
        />
        {/* Preview icon */}
        <div style={{ width: 32, height: 32, borderRadius: "8px", backgroundColor: `${sub.themeColor || DEFAULT_COLOR}14`, border: `1px solid ${sub.themeColor || DEFAULT_COLOR}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {renderLucideIcon(sub.iconCode || "Broom", 16, sub.themeColor || DEFAULT_COLOR)}
        </div>
        <button type="button" onClick={() => setExpanded((v) => !v)}
          style={{ fontSize: "11px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          {expanded ? "▲ Icon" : "▼ Icon"}
        </button>
        <button type="button" onClick={() => onRemove(index)}
          style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "16px", flexShrink: 0, lineHeight: 1 }}>×</button>
      </div>
      {/* Collapsible icon picker */}
      {expanded && (
        <div style={{ padding: "0 10px 10px" }}>
          <IconColorPicker
            selectedIcon={sub.iconCode}
            selectedColor={sub.themeColor}
            onSelectIcon={(code) => onChange(index, { ...sub, iconCode: code })}
            onSelectColor={(color) => onChange(index, { ...sub, themeColor: color })}
          />
        </div>
      )}
    </div>
  );
}

// ── Category Form Modal ───────────────────────────────────
function CategoryFormModal({ open, onClose, onUpload, onDraft, initial, title, loading }: {
  open: boolean; onClose: () => void;
  onUpload: (form: CategoryForm) => void;
  onDraft:  (form: CategoryForm) => void;
  initial?: CategoryForm; title: string; loading: boolean;
}) {
  const [form, setForm] = useState<CategoryForm>(initial ?? emptyForm());

  const updateSub   = (i: number, sub: SubCategoryForm) =>
    setForm((f) => ({ ...f, subCategories: f.subCategories.map((s, idx) => idx === i ? sub : s) }));
  const removeSub   = (i: number) =>
    setForm((f) => ({ ...f, subCategories: f.subCategories.filter((_, idx) => idx !== i) }));
  const addSub      = () => setForm((f) => ({ ...f, subCategories: [...f.subCategories, emptySub()] }));

  const footer = (
    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
      <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "pointer" }}>
        Cancel
      </button>
      <button onClick={() => onDraft({ ...form, status: "inactive" })} disabled={loading}
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
        Draft
      </button>
      <button onClick={() => onUpload({ ...form, status: "active" })} disabled={loading} className="btn-primary"
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading && <Loader2 size={14} className="animate-spin" />} Upload
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Category name */}
        <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", padding: "14px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Category Name</label>
          <input type="text" placeholder="e.g. Plumbing"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
          />
        </div>

        {/* Category icon + color */}
        <IconColorPicker
          label="Category Icon & Color"
          selectedIcon={form.iconCode}
          selectedColor={form.themeColor}
          onSelectIcon={(code) => setForm((f) => ({ ...f, iconCode: code }))}
          onSelectColor={(color) => setForm((f) => ({ ...f, themeColor: color }))}
        />

        {/* Sub-categories */}
        <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Sub-categories</label>
          {form.subCategories.map((sub, i) => (
            <SubCategoryRow key={i} sub={sub} index={i} onChange={updateSub} onRemove={removeSub} />
          ))}
          <button onClick={addSub} style={{ fontSize: "13px", fontWeight: 500, color: "#2563eb", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
            + Add sub-category
          </button>
        </div>

      </div>
    </Modal>
  );
}

// ── Helpers ───────────────────────────────────────────────
// Normalize subCategory from API — may be string[], object[], or JSON string
const normalizeSubs = (subs?: ApiSubCategory[] | string[] | string): ApiSubCategory[] => {
  if (!subs) return [];
  // Sometimes the API returns a JSON string instead of an array
  if (typeof subs === "string") {
    try { subs = JSON.parse(subs); } catch { return []; }
  }
  if (!Array.isArray(subs)) return [];
  return subs.map((s) => {
    if (typeof s === "string") {
      // Try to parse if it looks like JSON
      try { return JSON.parse(s) as ApiSubCategory; } catch { return { name: s }; }
    }
    return s as ApiSubCategory;
  });
};

// ── Main Component ────────────────────────────────────────
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
    const color     = form.themeColor || DEFAULT_COLOR;
    const imageUrl  = `${form.iconCode}|${color}`;

    // Build sub-category objects with their own icon
    const subCategory: ApiSubCategory[] = form.subCategories
      .filter((s) => s.name.trim())
      .map((s) => ({
        name:     s.name,
        imageUrl: `${s.iconCode || "Broom"}|${s.themeColor || DEFAULT_COLOR}`,
      }));

    const payload = { category: form.category, imageUrl, subCategory, status: form.status };

    if (editId) {
      dispatch(editCategory({ id: editId, payload })).unwrap()
        .then(() => setEditTarget(null)).catch(() => {});
    } else {
      dispatch(addCategory(payload)).unwrap()
        .then(() => setAddOpen(false)).catch(() => {});
    }
  };

  // Convert ApiCategory back to form shape for editing
  const toFormInitial = (cat: ApiCategory): CategoryForm => {
    const { icon, color } = parseIconPayload(cat.imageUrl);
    const subs = normalizeSubs(cat.subCategory as ApiSubCategory[] | string[] | undefined);
    return {
      category:      cat.category,
      iconCode:      icon,
      themeColor:    color === DEFAULT_COLOR ? "" : color,
      status:        (cat.status as "active" | "inactive") ?? "active",
      subCategories: subs.length > 0
        ? subs.map((s) => {
            const parsed = parseIconPayload(s.imageUrl);
            return { name: s.name, iconCode: parsed.icon, themeColor: parsed.color === DEFAULT_COLOR ? "" : parsed.color };
          })
        : [emptySub(), emptySub(), emptySub()],
    };
  };

  return (
    <>
      <style>{`
        .cat-table-wrap { display: none; }
        .cat-cards      { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .cat-footer     { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px 16px; border-top: 1px solid #E5E7EB; }
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
          <button onClick={() => setAddOpen(true)} className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            <Plus size={15} /> Add
          </button>
        }
      >
        {listStatus === "loading" && <PageLoader text="Loading categories..." />}
        {listStatus === "failed"  && <p style={{ textAlign: "center", fontSize: "13px", color: "#ef4444", padding: "48px" }}>Failed to load categories.</p>}

        {listStatus === "succeeded" && (
          <div style={{ borderRadius: "16px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", overflow: "hidden", marginTop: "20px" }}>

            {/* Desktop table */}
            <div className="cat-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                    {["Category", "Icon", "Sub-category", "Sub-icon", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px", fontSize: "13px", color: "#9CA3AF" }}>No categories yet.</td></tr>
                  ) : list.map((cat: ApiCategory) => {
                    const { icon, color } = parseIconPayload(cat.imageUrl);
                    const subs   = normalizeSubs(cat.subCategory as ApiSubCategory[] | string[] | undefined);
                    const isDraft = cat.status === "inactive";
                    return (
                      <tr key={cat.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", fontWeight: 500, color: "#111827" }}>{cat.category}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ width: 40, height: 40, borderRadius: "10px", background: `linear-gradient(135deg, ${color}18, ${color}08)`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {renderLucideIcon(icon, 18, color)}
                          </div>
                        </td>
                        {/* Sub-category names */}
                        <td style={{ padding: "16px 24px" }}>
                          {subs.length === 0 ? (
                            <span style={{ fontSize: "13px", color: "#9CA3AF" }}>—</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {subs.slice(0, 3).map((s, i) => (
                                <span key={i} style={{ fontSize: "12px", fontWeight: 500, color: "#374151", whiteSpace: "nowrap" }}>
                                  {s.name}
                                </span>
                              ))}
                              {subs.length > 3 && (
                                <span style={{ fontSize: "11px", color: "#9CA3AF" }}>+{subs.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Sub-category icons */}
                        <td style={{ padding: "16px 24px" }}>
                          {subs.length === 0 ? (
                            <span style={{ fontSize: "13px", color: "#9CA3AF" }}>—</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {subs.slice(0, 3).map((s, i) => {
                                const sp = parseIconPayload(s.imageUrl);
                                return (
                                  <div key={i} style={{ width: 28, height: 28, borderRadius: "7px", background: `linear-gradient(135deg, ${sp.color}18, ${sp.color}08)`, border: `1px solid ${sp.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {renderLucideIcon(sp.icon, 14, sp.color)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", color: isDraft ? "#4b5563" : "#15803d", backgroundColor: isDraft ? "#f3f4f6" : "#dcfce7", border: isDraft ? "1px solid #e5e7eb" : "1px solid #bbf7d0" }}>
                            {isDraft ? "Draft" : "Active"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => setEditTarget(cat)}
                              style={{ padding: "6px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#6B7280" }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => setDeleteTarget(cat)}
                              style={{ padding: "6px", borderRadius: "8px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", color: "#f87171" }}>
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
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF" }}>No categories yet.</p>
              ) : list.map((cat: ApiCategory) => {
                const { icon, color } = parseIconPayload(cat.imageUrl);
                const subs   = normalizeSubs(cat.subCategory as ApiSubCategory[] | string[] | undefined);
                const isDraft = cat.status === "inactive";
                return (
                  <div key={cat.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "10px", background: `linear-gradient(135deg, ${color}18, ${color}08)`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {renderLucideIcon(icon, 18, color)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", marginBottom: "3px" }}>{cat.category}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>{subs.length} sub{subs.length !== 1 ? "s" : ""}</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", color: isDraft ? "#4b5563" : "#15803d", backgroundColor: isDraft ? "#f3f4f6" : "#dcfce7", border: isDraft ? "1px solid #e5e7eb" : "1px solid #bbf7d0" }}>
                          {isDraft ? "Draft" : "Active"}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setEditTarget(cat)}
                      style={{ padding: "7px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#6B7280" }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="cat-footer">
              <button style={{ padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "pointer" }}>
                Reorder Categories
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "pointer" }}>
                <Download size={14} /> Export
              </button>
            </div>
          </div>
        )}

        {/* Add Modal */}
        <CategoryFormModal
          key={addOpen ? "add-open" : "add-closed"}
          open={addOpen} onClose={() => setAddOpen(false)}
          onUpload={(form) => saveCategory(form)}
          onDraft={(form) => saveCategory(form)}
          title="Add Category" loading={isMutating}
        />

        {/* Edit Modal */}
        <CategoryFormModal
          key={editTarget?.id ?? "edit-closed"}
          open={!!editTarget} onClose={() => setEditTarget(null)}
          onUpload={(form) => editTarget && saveCategory(form, editTarget.id)}
          onDraft={(form)  => editTarget && saveCategory(form, editTarget.id)}
          initial={editTarget ? toFormInitial(editTarget) : undefined}
          title="Edit Category" loading={isMutating}
        />

        {/* Delete confirm */}
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category" size="sm"
          footer={
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isMutating}
                style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: isMutating ? 0.7 : 1 }}>
                {isMutating && <Loader2 size={14} className="animate-spin" />} Delete
              </button>
            </div>
          }>
          <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: "#111827" }}>{deleteTarget?.category}</strong>? This cannot be undone.
          </p>
        </Modal>

      </SubPageShell>
    </>
  );
}