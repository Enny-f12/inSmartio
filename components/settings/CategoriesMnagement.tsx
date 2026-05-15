// components/settings/CategoriesManagement.tsx
"use client";

import { useState } from "react";
import { Pencil, Download, Plus, Upload } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SubPageShell, FieldInput } from "./SettingsShared";
import { initialCategories } from "@/components/settings/types";
import type { Category } from "@/components/settings/types";

function AddCategoryModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Category) => void }) {
  const [name, setName] = useState("");
  const [subs, setSubs] = useState([{ name: "", icon: "" }, { name: "", icon: "" }, { name: "", icon: "" }]);

  const addSub = () => setSubs((p) => [...p, { name: "", icon: "" }]);
  const updateSub = (i: number, val: string) =>
    setSubs((p) => p.map((s, idx) => idx === i ? { ...s, name: val } : s));

  const handleSave = (asDraft: boolean) => {
    if (!name.trim()) return;
    onSave({
      id: `cat-${Date.now()}`,
      name: name.trim(),
      icon: "📁",
      subCategories: subs.filter((s) => s.name.trim()).length,
      status: asDraft ? "Draft" : "Active",
      subs: subs.filter((s) => s.name.trim()),
    });
    onClose();
  };

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
        Cancel
      </button>
      <button onClick={() => handleSave(false)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
        <Upload size={14} /> Upload
      </button>
      <button onClick={() => handleSave(true)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
        Save to draft
      </button>
    </>
  );

  return (
    <Modal open onClose={onClose} title="Add Categories" footer={footer}>
      <div className="space-y-4">
        <FieldInput label="Category Name" placeholder="enter category name..." value={name} onChange={(e) => setName(e.target.value)} />

        <div>
          <label className="block text-[13px] font-medium text-text-main mb-1.5">Add Icon</label>
          <div className="flex items-center justify-center px-4 py-3 rounded-xl text-[13px] cursor-pointer border border-dashed border-border bg-background text-text-muted w-40">
            drag or upload icon
          </div>
        </div>

        {subs.map((sub, i) => (
          <div key={i}>
            <label className="block text-[13px] font-medium text-text-main mb-1.5">Sub-category</label>
            <div className="flex items-center gap-2">
              <input
                type="text" placeholder="enter sub-category..." value={sub.name}
                onChange={(e) => updateSub(i, e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button className="px-3 py-2.5 rounded-xl text-[12px] border border-border bg-surface text-text-muted hover:bg-background transition-colors whitespace-nowrap">
                upload icon
              </button>
            </div>
          </div>
        ))}

        <button onClick={addSub} className="text-[13px] font-medium text-primary hover:opacity-80 transition-opacity">
          Add more
        </button>
      </div>
    </Modal>
  );
}

export default function CategoriesManagement({ onBack }: { onBack: () => void }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showModal, setShowModal]   = useState(false);

  return (
    <SubPageShell
      title="Categories Management"
      onBack={onBack}
      action={
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Plus size={15} /> Add
        </button>
      }
    >
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {["Category Name", "Icon", "Sub-categories", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-background transition-colors">
                <td className="px-6 py-4 text-[13.5px] font-medium text-text-main">{cat.name}</td>
                <td className="px-6 py-4 text-[18px]">{cat.icon}</td>
                <td className="px-6 py-4 text-[13.5px] text-text-muted">{cat.subCategories}</td>
                <td className="px-6 py-4 text-[13.5px] text-text-muted">{cat.status}</td>
                <td className="px-6 py-4">
                  <button className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors">
                    <Pencil size={16} strokeWidth={1.8} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
          <button className="px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
            Reorder Categories
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {showModal && (
        <AddCategoryModal
          onClose={() => setShowModal(false)}
          onSave={(cat) => setCategories((p) => [...p, cat])}
        />
      )}
    </SubPageShell>
  );
}