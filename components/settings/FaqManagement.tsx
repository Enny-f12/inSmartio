// components/settings/FaqManagement.tsx
"use client";

import { useState } from "react";
import { Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { SubPageShell, FieldInput } from "./SettingsShared";
import { initialFaqs } from "@/components/settings/types";
import type { Faq, FaqCategory } from "@/components/settings/types";

const FAQ_CATS = ["All", "Clients", "Experts", "TAS"] as const;

function EditFaqModal({ faq, onClose, onSave }: {
  faq: Faq | null;
  onClose: () => void;
  onSave: (q: string, cat: Exclude<FaqCategory, "All">) => void;
}) {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [category, setCategory] = useState<string>(faq?.category ?? "Clients");

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors">
        Cancel
      </button>
      <button
        onClick={() => { onSave(question, category as Exclude<FaqCategory, "All">); onClose(); }}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors"
      >
        Upload
      </button>
    </>
  );

  return (
    <Modal open onClose={onClose} title="Edit Category" footer={footer}>
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-text-main mb-1.5">Question:</label>
          <FieldInput placeholder="How do i post a job?" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-text-main mb-1.5">Category</label>
          <FilterDropdown
            value={category}
            options={["Clients", "Experts", "TAS"]}
            onChange={setCategory}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function FaqManagement({ onBack }: { onBack: () => void }) {
  const [faqs, setFaqs]         = useState<Faq[]>(initialFaqs);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [editFaq, setEditFaq]   = useState<Faq | null>(null);
  const [showAdd, setShowAdd]   = useState(false);

  const filtered = faqs.filter((f) => {
    const matchSearch = f.question.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "All" || f.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = (id: string | null, question: string, category: Exclude<FaqCategory, "All">) => {
    if (id) {
      setFaqs((p) => p.map((f) => f.id === id ? { ...f, question, category } : f));
    } else {
      setFaqs((p) => [...p, { id: `f${Date.now()}`, question, category }]);
    }
  };

  return (
    <SubPageShell
      title="FAQ Management"
      onBack={onBack}
      action={
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold">
          <Plus size={15} /> Add
        </button>
      }
    >
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        {/* Filter */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={15} className="text-text-muted" />
            <span className="text-sm font-semibold text-text-main">Filter</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text" placeholder="Search name..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <FilterDropdown value={catFilter} options={FAQ_CATS} onChange={setCatFilter} />
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {["Question", "Category", "Actions"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((faq) => (
              <tr key={faq.id} className="hover:bg-background transition-colors">
                <td className="px-6 py-4 text-[13.5px] text-text-main">{faq.question}</td>
                <td className="px-6 py-4 text-[13.5px] text-text-muted">{faq.category}</td>
                <td className="px-6 py-4">
                  <button onClick={() => setEditFaq(faq)} className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors">
                    <Pencil size={16} strokeWidth={1.8} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editFaq || showAdd) && (
        <EditFaqModal
          faq={editFaq}
          onClose={() => { setEditFaq(null); setShowAdd(false); }}
          onSave={(q, cat) => handleSave(editFaq?.id ?? null, q, cat)}
        />
      )}
    </SubPageShell>
  );
}