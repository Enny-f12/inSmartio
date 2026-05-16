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

// ── Icon options ──────────────────────────────────────────
const ICON_OPTIONS: { name: string; icon: React.ElementType }[] = [
  { name: "Wrench",      icon: Wrench      },
  { name: "Package",     icon: Package     },
  { name: "Car",         icon: Car         },
  { name: "Home",        icon: Home        },
  { name: "Palette",     icon: Palette     },
  { name: "Shirt",       icon: Shirt       },
  { name: "Zap",         icon: Zap         },
  { name: "Briefcase",   icon: Briefcase   },
  { name: "Camera",      icon: Camera      },
  { name: "Hammer",      icon: Hammer      },
  { name: "Tag",         icon: Tag         },
  { name: "Scissors",    icon: Scissors    },
  { name: "Utensils",    icon: Utensils    },
  { name: "Tv",          icon: Tv          },
  { name: "Music",       icon: Music       },
  { name: "Flower2",     icon: Flower2     },
  { name: "Truck",       icon: Truck       },
  { name: "ShieldCheck", icon: ShieldCheck },
  { name: "Wifi",        icon: Wifi        },
  { name: "BookOpen",    icon: BookOpen    },
  { name: "Heart",       icon: Heart       },
  { name: "Star",        icon: Star        },
  { name: "Globe",       icon: Globe       },
  { name: "Coffee",      icon: Coffee      },
];

const getIconComponent = (name: string): React.ElementType =>
  ICON_OPTIONS.find((o) => o.name === name)?.icon ?? Tag;

const colors = ["#2563eb","#16a34a","#d97706","#7c3aed","#db2777","#0891b2","#dc2626","#65a30d"];
const getColor = (i: number) => colors[i % colors.length];

// ── localStorage icon persistence ────────────────────────
const STORAGE_KEY = "category_icons";
const loadIconMap = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
};
const saveIconMap = (map: Record<string, string>) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));

// ── Types ─────────────────────────────────────────────────
interface CategoryForm {
  category: string;
  subCategories: string[];
  iconName: string;
}
const emptyForm: CategoryForm = { category: "", subCategories: ["", "", ""], iconName: "Tag" };

// ── Icon Picker ───────────────────────────────────────────
function IconPicker({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) {
  const SelectedIcon = getIconComponent(selected);
  return (
    <div>
      <label className="block text-[13px] font-medium text-text-main mb-2">Choose Icon</label>
      {/* ── Grid with inline style so Tailwind purge can't strip it ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gap: "6px",
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-background)",
        maxHeight: "160px",
        overflowY: "auto",
      }}>
        {ICON_OPTIONS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            title={name}
            style={{
              padding: "8px",
              borderRadius: "8px",
              border: selected === name ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
              backgroundColor: selected === name ? "var(--color-primary)" : "transparent",
              color: selected === name ? "#fff" : "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Icon size={16} strokeWidth={1.8} />
          </button>
        ))}
      </div>

      {/* Preview */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Selected:</span>
        <div style={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SelectedIcon size={14} color="#fff" strokeWidth={1.8} />
        </div>
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{selected}</span>
      </div>
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────
function CategoryFormModal({
  open, onClose, onUpload, onDraft, initial, title, loading,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (form: CategoryForm) => void;
  onDraft: (form: CategoryForm) => void;
  initial?: CategoryForm;
  title: string;
  loading: boolean;
}) {
  const [form, setForm] = useState<CategoryForm>(initial ?? emptyForm);

  const updateSub = (i: number, val: string) =>
    setForm((f) => ({ ...f, subCategories: f.subCategories.map((s, idx) => idx === i ? val : s) }));

  const addSub = () =>
    setForm((f) => ({ ...f, subCategories: [...f.subCategories, ""] }));

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
        Cancel
      </button>
      <button
        onClick={() => onUpload(form)}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-70"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Upload
      </button>
      <button
        onClick={() => onDraft(form)}
        disabled={loading}
        className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-70"
      >
        Save to draft
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-text-main mb-1.5">Category Name</label>
          <input
            type="text"
            placeholder="enter category name..."
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        <IconPicker
          selected={form.iconName}
          onSelect={(name) => setForm((f) => ({ ...f, iconName: name }))}
        />

        {form.subCategories.map((sub, i) => (
          <div key={i}>
            <label className="block text-[13px] font-medium text-text-main mb-1.5">Sub-category</label>
            <input
              type="text"
              placeholder="enter sub-category..."
              value={sub}
              onChange={(e) => updateSub(i, e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        ))}

        <button onClick={addSub} className="text-[13px] font-medium text-primary hover:opacity-80 transition-opacity">
          Add more
        </button>
      </div>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────
export default function CategoriesManagement({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { list, listStatus, mutateStatus } = useAppSelector((s) => s.categories);

  const [addOpen, setAddOpen]           = useState(false);
  const [editTarget, setEditTarget]     = useState<ApiCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiCategory | null>(null);
  const [iconMap, setIconMap] = useState<Record<string, string>>(loadIconMap);

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
    dispatch(removeCategory(deleteTarget.id))
      .unwrap()
      .then(() => setDeleteTarget(null))
      .catch(() => {});
  };

  const saveCategory = (form: CategoryForm, editId?: string) => {
    if (!form.category.trim()) return;
    const subs = form.subCategories.filter((s) => s.trim());
    const payload = {
      category:    form.category,
      subCategory: subs.length > 0 ? subs : undefined,
    };

    if (editId) {
      dispatch(editCategory({ id: editId, payload }))
        .unwrap()
        .then(() => { updateIconMap(editId, form.iconName); setEditTarget(null); })
        .catch(() => {});
    } else {
      dispatch(addCategory(payload))
        .unwrap()
        .then((newCat) => { updateIconMap(newCat.id, form.iconName); setAddOpen(false); })
        .catch(() => {});
    }
  };

  return (
    <SubPageShell
      title="Categories Management"
      onBack={onBack}
      action={
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 px-4 mb-5 py-2.5 rounded-xl text-[13px] font-semibold">
          <Plus size={15} /> Add
        </button>
      }
    >
      {listStatus === "loading" && <PageLoader text="Loading categories..." />}
      {listStatus === "failed" && <p className="text-center text-[13px] text-red-500 py-12">Failed to load categories.</p>}

      {listStatus === "succeeded" && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-140">
              <thead>
                <tr className="border-b border-border">
                  {["Category Name", "Icon", "Sub-categories", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[13px] text-text-muted">
                      No categories yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  list.map((cat: ApiCategory, i: number) => {
                    const iconName = iconMap[cat.id] ?? "Tag";
                    const Icon = getIconComponent(iconName);
                    const color = getColor(i);
                    return (
                      <tr key={cat.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4 text-[13.5px] font-medium text-text-main">{cat.category}</td>
                        <td className="px-6 py-4">
                          <div
                            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center"
                            style={{ backgroundColor: `${color}12` }}
                          >
                            <Icon size={17} color={color} strokeWidth={1.8} />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13.5px] text-text-muted">{cat.subCategory?.length ?? 0}</td>
                        <td className="px-6 py-4 text-[13.5px] text-text-muted">Active</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditTarget(cat)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                              title="Edit"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(cat)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} strokeWidth={1.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-border">
            <button className="px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
              Reorder Categories
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <CategoryFormModal
        key={addOpen ? "add-open" : "add-closed"}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onUpload={(form) => saveCategory(form)}
        onDraft={(form) => saveCategory(form)}
        title="Add Categories"
        loading={isMutating}
      />

      {/* Edit Modal */}
      <CategoryFormModal
        key={editTarget?.id ?? "edit-closed"}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onUpload={(form) => editTarget && saveCategory(form, editTarget.id)}
        onDraft={(form) => editTarget && saveCategory(form, editTarget.id)}
        initial={editTarget ? {
          category: editTarget.category,
          subCategories: editTarget.subCategory?.length ? editTarget.subCategory : ["", "", ""],
          iconName: iconMap[editTarget.id] ?? "Tag",
        } : undefined}
        title="Edit Category"
        loading={isMutating}
      />

      {/* Delete Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        size="sm"
        footer={
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
            <button
              onClick={() => setDeleteTarget(null)}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "var(--color-text-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isMutating}
              style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: isMutating ? 0.7 : 1 }}
            >
              {isMutating && <Loader2 size={14} className="animate-spin" />}
              Delete
            </button>
          </div>
        }
      >
        <p className="text-[13px] text-text-muted leading-relaxed">
          Are you sure you want to delete{" "}
          <strong className="text-text-main">{deleteTarget?.category}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </SubPageShell>
  );
}