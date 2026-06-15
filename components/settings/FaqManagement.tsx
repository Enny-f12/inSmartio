// components/settings/FaqManagement.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Pencil, Plus, Search, SlidersHorizontal, Trash2, Loader2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { SubPageShell } from "./SettingsShared";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchFaqs, addFaq, editFaq, removeFaq } from "@/lib/redux/faqSlice";
import { uploadManyFaqs } from "@/lib/api/faqApi";
import type { ApiFaq, FaqCategory } from "@/lib/api/faqApi";

const CAT_OPTIONS    = ["client", "expert", "tas"] as const;
const FILTER_OPTIONS = ["All", "client", "expert", "tas"] as const;

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, React.CSSProperties> = {
    client: { color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" },
    expert: { color: "#15803d", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" },
    tas:    { color: "#7c3aed", backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe" },
  };
  const labels: Record<string, string> = { client: "Clients", expert: "Experts", tas: "TAS" };
  return (
    <span style={{ ...(colors[category] ?? {}), fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {labels[category] ?? category}
    </span>
  );
}

// ── Add / Edit FAQ Modal ──────────────────────────────────
interface FaqModalProps {
  faq:     ApiFaq | null;
  onClose: () => void;
  onSave:  (p: { question: string; answer: string; category: FaqCategory }) => void;
  saving:  boolean;
}

function FaqModal({ faq, onClose, onSave, saving }: FaqModalProps) {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer,   setAnswer]   = useState(faq?.answer   ?? "");
  const [category, setCategory] = useState<string>(faq?.category ?? "client");

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
    fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box",
  };

  const footer = (
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <button onClick={onClose}
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "pointer" }}>
        Cancel
      </button>
      <button
        onClick={() => onSave({ question, answer, category: category as FaqCategory })}
        disabled={saving || !question.trim() || !answer.trim()}
        className="btn-primary"
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: (saving || !question.trim() || !answer.trim()) ? 0.7 : 1 }}>
        {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : faq ? "Save Changes" : "Add FAQ"}
      </button>
    </div>
  );

  return (
    <Modal open onClose={onClose} title={faq ? "Edit FAQ" : "Add New FAQ"} footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Question *</label>
          <input style={inp} placeholder="e.g. How do I post a job?" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Answer *</label>
          <textarea
            rows={4} placeholder="Enter the answer..."
            value={answer} onChange={(e) => setAnswer(e.target.value)}
            style={{ ...inp, resize: "none" } as React.CSSProperties}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "6px" }}>Category</label>
          <div style={{ position: "relative" }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ ...inp, appearance: "none", paddingRight: "36px", cursor: "pointer" } as React.CSSProperties}>
              {CAT_OPTIONS.map((c) => (
                <option key={c} value={c}>{c === "client" ? "Clients" : c === "expert" ? "Experts" : "TAS"}</option>
              ))}
            </select>
            <svg style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B7280" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Upload Doc Modal ──────────────────────────────────────
function UploadDocModal({ onClose }: { onClose: () => void }) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Expects a JSON file: [{ question, answer, category, status }]
  const handleUpload = async () => {
    if (!file) { toast.warning("Select a file first"); return; }
    setUploading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const faqs   = Array.isArray(parsed) ? parsed : parsed.faqs ?? [];
      if (!faqs.length) { toast.error("No FAQs found in file"); return; }
      await uploadManyFaqs(faqs);
      toast.success(`${faqs.length} FAQ(s) uploaded`);
      onClose();
    } catch {
      toast.error("Upload failed — ensure file is valid JSON");
    } finally {
      setUploading(false);
    }
  };

  const footer = (
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <button onClick={onClose}
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: "pointer" }}>
        Cancel
      </button>
      <button onClick={handleUpload} disabled={uploading || !file}
        className="btn-primary"
        style={{ flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: (uploading || !file) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: (uploading || !file) ? 0.7 : 1 }}>
        {uploading ? <><Loader2 size={13} className="animate-spin" /> Uploading...</> : <><Upload size={13} /> Upload</>}
      </button>
    </div>
  );

  return (
    <Modal open onClose={onClose} title="Upload FAQ Document" footer={footer}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
          Upload a <strong style={{ color: "#111827" }}>JSON file</strong> containing an array of FAQs. Each entry should have{" "}
          <code style={{ backgroundColor: "#F3F4F6", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>question</code>,{" "}
          <code style={{ backgroundColor: "#F3F4F6", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>answer</code>, and{" "}
          <code style={{ backgroundColor: "#F3F4F6", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>category</code>.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: "2px dashed #E5E7EB", borderRadius: "12px", padding: "32px 16px", textAlign: "center", cursor: "pointer", backgroundColor: file ? "#F0FDF4" : "#F9FAFB", transition: "background 0.15s" }}>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {file ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <FileText size={28} style={{ color: "#16a34a" }} />
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>{file.name}</p>
              <p style={{ fontSize: "12px", color: "#6B7280" }}>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <Upload size={28} style={{ color: "#9CA3AF" }} />
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Click to select a JSON file</p>
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>or drag and drop</p>
            </div>
          )}
        </div>

        {/* Example format */}
        <details style={{ fontSize: "12px", color: "#6B7280" }}>
          <summary style={{ cursor: "pointer", fontWeight: 500, color: "#374151" }}>View example format</summary>
          <pre style={{ marginTop: "8px", padding: "12px", backgroundColor: "#F3F4F6", borderRadius: "8px", overflow: "auto", fontSize: "11px", color: "#374151" }}>{`[
  {
    "question": "How do I post a job?",
    "answer": "Go to Jobs and click Post a Job.",
    "category": "client",
    "status": "active"
  }
]`}</pre>
        </details>
      </div>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────
export default function FaqManagement({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, mutateStatus } = useAppSelector((s) => s.faq);

  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("All");
  const [editingFaq,  setEditingFaq]  = useState<ApiFaq | null>(null);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showUpload,       setShowUpload]       = useState(false);
  const [deletingId,       setDeletingId]       = useState<string | null>(null);
  const [confirmDeleteFaq, setConfirmDeleteFaq] = useState<ApiFaq | null>(null);

  const isSaving = mutateStatus === "loading";

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchFaqs());
  }, [dispatch, listStatus]);

  const filtered = list.filter((f) => {
    const matchSearch = f.question.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "All" || f.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = (payload: { question: string; answer: string; category: FaqCategory }) => {
    if (editingFaq) {
      dispatch(editFaq({ id: editingFaq.id, payload }))
        .unwrap()
        .then(() => { toast.success("FAQ updated"); setEditingFaq(null); })
        .catch((err: string) => toast.error("Failed to update", { description: err }));
    } else {
      dispatch(addFaq({ ...payload, status: "active" }))
        .unwrap()
        .then(() => { toast.success("FAQ created"); setShowAdd(false); })
        .catch((err: string) => toast.error("Failed to create", { description: err }));
    }
  };

  const handleDelete = (faq: ApiFaq) => {
    setConfirmDeleteFaq(faq);
  };

  const confirmDelete = () => {
    if (!confirmDeleteFaq) return;
    const id = confirmDeleteFaq.id;
    setConfirmDeleteFaq(null);
    setDeletingId(id);
    dispatch(removeFaq(id))
      .unwrap()
      .then(() => { toast.success("FAQ deleted"); setDeletingId(null); })
      .catch((err: string) => { toast.error("Failed to delete", { description: err }); setDeletingId(null); });
  };

  return (
    <>
      <style>{`
        .faq-toolbar { flex-direction: column; gap: 8px; }
        .faq-table   { display: none; }
        .faq-cards   { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .faq-row:hover { background: #F9FAFB; }
        @media (min-width: 480px) { .faq-toolbar { flex-direction: row; align-items: center; } }
        @media (min-width: 640px) {
          .faq-table { display: table; width: 100%; border-collapse: collapse; }
          .faq-cards { display: none; }
        }
      `}</style>

      <SubPageShell
        title="FAQ Management"
        onBack={onBack}
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            
            {/* Add New */}
            <button onClick={() => setShowAdd(true)} className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
              <Plus size={14} /> Add New
            </button>
          </div>
        }
      >
        <div style={{ borderRadius: "16px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", overflow: "hidden", marginTop: "20px" }}>

          {/* Toolbar */}
          <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <SlidersHorizontal size={15} style={{ color: "#6B7280" }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Filter</span>
            </div>
            <div className="faq-toolbar" style={{ display: "flex" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                <input type="text" placeholder="Search questions..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
                />
              </div>
              <FilterDropdown value={catFilter} options={FILTER_OPTIONS} onChange={setCatFilter} />
            </div>
          </div>

          {/* Loading / Error */}
          {listStatus === "loading" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px", gap: "8px", color: "#9CA3AF", fontSize: "13px" }}>
              <Loader2 size={16} className="animate-spin" /> Loading FAQs...
            </div>
          )}
          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "48px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
          )}

          {listStatus === "succeeded" && (
            <>
              {/* Desktop table */}
              <table className="faq-table">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                    {["Question", "Category", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: "center", padding: "48px", fontSize: "14px", color: "#9CA3AF" }}>No FAQs found.</td></tr>
                  ) : filtered.map((faq) => (
                    <tr key={faq.id} className="faq-row" style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}>
                      <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#111827", fontWeight: 500 }}>{faq.question}</td>
                      <td style={{ padding: "16px 24px" }}><CategoryBadge category={faq.category} /></td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button onClick={() => setEditingFaq(faq)}
                            style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#6B7280" }}>
                            <Pencil size={16} strokeWidth={1.8} />
                          </button>
                          <button onClick={() => handleDelete(faq)} disabled={deletingId === faq.id}
                            style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#ef4444", opacity: deletingId === faq.id ? 0.5 : 1 }}>
                            {deletingId === faq.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} strokeWidth={1.8} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="faq-cards">
                {filtered.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF" }}>No FAQs found.</p>
                ) : filtered.map((faq) => (
                  <div key={faq.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13.5px", color: "#111827", fontWeight: 500, marginBottom: "8px", lineHeight: 1.5 }}>{faq.question}</p>
                      <CategoryBadge category={faq.category} />
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button onClick={() => setEditingFaq(faq)}
                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#6B7280" }}>
                        <Pencil size={14} strokeWidth={1.8} />
                      </button>
                      <button onClick={() => handleDelete(faq)} disabled={deletingId === faq.id}
                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid #fecaca", background: "none", cursor: "pointer", color: "#ef4444", opacity: deletingId === faq.id ? 0.5 : 1 }}>
                        {deletingId === faq.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={1.8} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        {(showAdd || editingFaq) && (
          <FaqModal
            faq={editingFaq}
            onClose={() => { setEditingFaq(null); setShowAdd(false); }}
            onSave={handleSave}
            saving={isSaving}
          />
        )}

        {confirmDeleteFaq && (
          <Modal
            open
            onClose={() => setConfirmDeleteFaq(null)}
            title="Delete FAQ"
            size="sm"
            footer={
              <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                <button
                  onClick={() => setConfirmDeleteFaq(null)}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", fontSize: "13px", cursor: "pointer", color: "#6B7280" }}>
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={!!deletingId}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: deletingId ? 0.7 : 1 }}>
                  {deletingId
                    ? <><Loader2 size={14} className="animate-spin" /> Deleting...</>
                    : "Delete"}
                </button>
              </div>
            }>
            <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
              Are you sure you want to delete this FAQ?<br />
              <strong style={{ color: "#111827" }}>&quot;{confirmDeleteFaq.question}&quot;</strong>
              <br /><br />
              This action cannot be undone.
            </p>
          </Modal>
        )}

        {showUpload && (
          <UploadDocModal onClose={() => { setShowUpload(false); dispatch(fetchFaqs()); }} />
        )}
      </SubPageShell>
    </>
  );
}