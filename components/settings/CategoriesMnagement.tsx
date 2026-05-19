/* eslint-disable react-hooks/static-components */
// components/settings/CategoriesManagement.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Download, Plus, Loader2, Trash2,
  Wrench, Package, Car, Home, Palette, Shirt,
  Zap, Briefcase, Camera, Hammer, Tag, Scissors,
  Utensils, Tv, Music, Flower2, Truck, ShieldCheck,
  Wifi, BookOpen, Heart, Star, Globe, Coffee,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Loader";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchCategories, addCategory, editCategory, removeCategory } from "@/lib/redux/categoriesSlice";
import type { ApiCategory } from "@/lib/api/categoriesApi";

const ICON_OPTIONS: { name: string; icon: React.ElementType }[] = [
  { name: "Wrench",      icon: Wrench      }, { name: "Package",     icon: Package     },
  { name: "Car",         icon: Car         }, { name: "Home",        icon: Home        },
  { name: "Palette",     icon: Palette     }, { name: "Shirt",       icon: Shirt       },
  { name: "Zap",         icon: Zap         }, { name: "Briefcase",   icon: Briefcase   },
  { name: "Camera",      icon: Camera      }, { name: "Hammer",      icon: Hammer      },
  { name: "Tag",         icon: Tag         }, { name: "Scissors",    icon: Scissors    },
  { name: "Utensils",    icon: Utensils    }, { name: "Tv",          icon: Tv          },
  { name: "Music",       icon: Music       }, { name: "Flower2",     icon: Flower2     },
  { name: "Truck",       icon: Truck       }, { name: "ShieldCheck", icon: ShieldCheck },
  { name: "Wifi",        icon: Wifi        }, { name: "BookOpen",    icon: BookOpen    },
  { name: "Heart",       icon: Heart       }, { name: "Star",        icon: Star        },
  { name: "Globe",       icon: Globe       }, { name: "Coffee",      icon: Coffee      },
];

const getIconComponent = (name: string): React.ElementType =>
  ICON_OPTIONS.find((o) => o.name === name)?.icon ?? Tag;

const colors = ["#2563eb","#16a34a","#d97706","#7c3aed","#db2777","#0891b2","#dc2626","#65a30d"];
const getColor = (i: number) => colors[i % colors.length];

const STORAGE_KEY = "category_icons";
const loadIconMap = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
};
const saveIconMap = (map: Record<string, string>) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));

interface CategoryForm {
  category: string;
  subCategories: string[];
  iconName: string;
}
const emptyForm: CategoryForm = { category: "", subCategories: ["", "", ""], iconName: "Tag" };

function IconPicker({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) {
  const SelectedIcon = getIconComponent(selected);
  return (
    <div style={{ borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", padding: "14px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "10px" }}>Choose Icon</label>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gap: "6px",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-background)",
        maxHeight: "152px",
        overflowY: "auto",
      }}>
        {ICON_OPTIONS.map(({ name, icon: Icon }) => (
          <button key={name} type="button" onClick={() => onSelect(name)} title={name}
            style={{
              padding: "8px", borderRadius: "8px",
              border: selected === name ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
              backgroundColor: selected === name ? "var(--color-primary)" : "transparent",
              color: selected === name ? "#fff" : "var(--color-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Icon size={16} strokeWidth={1.8} />
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Selected:</span>
        <div style={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SelectedIcon size={14} color="#fff" strokeWidth={1.8} />
        </div>
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{selected}</span>
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
      <button onClick={() => onDraft(form)} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
        Draft
      </button>
      <button onClick={() => onUpload(form)} disabled={loading} className="btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
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

        {/* Icon picker */}
        <IconPicker selected={form.iconName} onSelect={(name) => setForm((f) => ({ ...f, iconName: name }))} />

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
  const [iconMap,      setIconMap]      = useState<Record<string, string>>(loadIconMap);

  const isMutating = mutateStatus === "loading";

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchCategories());
  }, [dispatch, listStatus]);

  const updateIconMap = (id: string, iconName: string) => {
    const updated = { ...iconMap, [id]: iconName };
    setIconMap(updated);
    saveIconMap(updated);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch(removeCategory(deleteTarget.id)).unwrap()
      .then(() => setDeleteTarget(null)).catch(() => {});
  };

  const saveCategory = (form: CategoryForm, editId?: string) => {
    if (!form.category.trim()) return;
    const subs = form.subCategories.filter((s) => s.trim());
    const payload = { category: form.category, subCategory: subs.length > 0 ? subs : undefined };
    if (editId) {
      dispatch(editCategory({ id: editId, payload })).unwrap()
        .then(() => { updateIconMap(editId, form.iconName); setEditTarget(null); }).catch(() => {});
    } else {
      dispatch(addCategory(payload)).unwrap()
        .then((newCat) => { updateIconMap(newCat.id, form.iconName); setAddOpen(false); }).catch(() => {});
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
                    {["Category Name", "Icon", "Sub-categories", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px", fontSize: "13px", color: "var(--color-text-muted)" }}>No categories yet. Add one to get started.</td></tr>
                  ) : list.map((cat: ApiCategory, i: number) => {
                    const iconName = iconMap[cat.id] ?? "Tag";
                    const Icon = getIconComponent(iconName);
                    const color = getColor(i);
                    return (
                      <tr key={cat.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)" }}>{cat.category}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "10px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${color}12` }}>
                            <Icon size={17} color={color} strokeWidth={1.8} />
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{cat.subCategory?.length ?? 0}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", color: "#15803d", backgroundColor: "#dcfce7", border: "1px solid #bbf7d0" }}>Active</span>
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
              ) : list.map((cat: ApiCategory, i: number) => {
                const iconName = iconMap[cat.id] ?? "Tag";
                const Icon = getIconComponent(iconName);
                const color = getColor(i);
                return (
                  <div key={cat.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* Icon */}
                    <div style={{ width: 40, height: 40, borderRadius: "10px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${color}12`, flexShrink: 0 }}>
                      <Icon size={18} color={color} strokeWidth={1.8} />
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "3px" }}>{cat.category}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{cat.subCategory?.length ?? 0} sub-categories</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", color: "#15803d", backgroundColor: "#dcfce7", border: "1px solid #bbf7d0" }}>Active</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button onClick={() => setEditTarget(cat)} style={{ padding: "7px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => setDeleteTarget(cat)} style={{ padding: "7px", borderRadius: "8px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", color: "#f87171" }}>
                        <Trash2 size={15} strokeWidth={1.8} />
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
          initial={editTarget ? { category: editTarget.category, subCategories: editTarget.subCategory?.length ? editTarget.subCategory : ["", "", ""], iconName: iconMap[editTarget.id] ?? "Tag" } : undefined}
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