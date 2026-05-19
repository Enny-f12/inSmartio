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

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, React.CSSProperties> = {
    Clients: { color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" },
    Experts: { color: "#15803d", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" },
    TAS:     { color: "#7c3aed", backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe" },
  };
  return (
    <span style={{ ...colors[category], fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {category}
    </span>
  );
}

function EditFaqModal({ faq, onClose, onSave }: {
  faq: Faq | null;
  onClose: () => void;
  onSave: (q: string, cat: Exclude<FaqCategory, "All">) => void;
}) {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [category, setCategory] = useState<string>(faq?.category ?? "Clients");

  const footer = (
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" }}>
        Cancel
      </button>
      <button
        onClick={() => { onSave(question, category as Exclude<FaqCategory, "All">); onClose(); }}
        className="btn-primary"
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
      >
        Save
      </button>
    </div>
  );

  return (
    <Modal open onClose={onClose} title={faq ? "Edit FAQ" : "Add FAQ"} footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "6px" }}>Question:</label>
          <FieldInput placeholder="How do I post a job?" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)", marginBottom: "6px" }}>Category</label>
          <FilterDropdown value={category} options={["Clients", "Experts", "TAS"]} onChange={setCategory} />
        </div>
      </div>
    </Modal>
  );
}

export default function FaqManagement({ onBack }: { onBack: () => void }) {
  const [faqs, setFaqs]           = useState<Faq[]>(initialFaqs);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [editFaq, setEditFaq]     = useState<Faq | null>(null);
  const [showAdd, setShowAdd]     = useState(false);

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
    <>
      <style>{`
        .faq-toolbar  { flex-direction: column; gap: 8px; }
        .faq-table    { display: none; }
        .faq-cards    { display: flex; flex-direction: column; gap: 10px; padding: 12px; }

        @media (min-width: 480px) {
          .faq-toolbar { flex-direction: row; align-items: center; }
        }
        @media (min-width: 640px) {
          .faq-table   { display: table; width: 100%; border-collapse: collapse; }
          .faq-cards   { display: none; }
        }
      `}</style>

      <SubPageShell
        title="FAQ Management"
        onBack={onBack}
        action={
          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", marginBottom: "20px" }}>
            <Plus size={15} /> Add FAQ
          </button>
        }
      >
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", overflow: "hidden" }}>

          {/* Filter toolbar */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <SlidersHorizontal size={15} style={{ color: "var(--color-text-muted)" }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>Filter</span>
            </div>
            <div className="faq-toolbar" style={{ display: "flex" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input
                  type="text" placeholder="Search questions..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
                />
              </div>
              <FilterDropdown value={catFilter} options={FAQ_CATS} onChange={setCatFilter} />
            </div>
          </div>

          {/* Desktop table */}
          <table className="faq-table">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                {["Question", "Category", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: "center", padding: "48px", fontSize: "14px", color: "var(--color-text-muted)" }}>No FAQs found.</td></tr>
              ) : filtered.map((faq) => (
                <tr key={faq.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-main)" }}>{faq.question}</td>
                  <td style={{ padding: "16px 24px" }}><CategoryBadge category={faq.category} /></td>
                  <td style={{ padding: "16px 24px" }}>
                    <button onClick={() => setEditFaq(faq)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                      <Pencil size={16} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="faq-cards">
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No FAQs found.</p>
            ) : filtered.map((faq) => (
              <div key={faq.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13.5px", color: "var(--color-text-main)", marginBottom: "8px", lineHeight: 1.5 }}>{faq.question}</p>
                  <CategoryBadge category={faq.category} />
                </div>
                <button onClick={() => setEditFaq(faq)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}>
                  <Pencil size={15} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>

        </div>

        {(editFaq || showAdd) && (
          <EditFaqModal
            faq={editFaq}
            onClose={() => { setEditFaq(null); setShowAdd(false); }}
            onSave={(q, cat) => handleSave(editFaq?.id ?? null, q, cat)}
          />
        )}
      </SubPageShell>
    </>
  );
}