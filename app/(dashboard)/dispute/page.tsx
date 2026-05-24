// app/(dashboard)/dispute/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/Navbar";
import { PriorityLabel } from "@/components/disputes/DisputeBadges";
import DisputeDetail from "@/components/disputes/Disputedetail";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDisputes, fetchDisputeById, clearSelectedDispute, addDispute } from "@/lib/redux/disputeSlice";
import { downloadReport } from "@/lib/api/reportApi";
import type { ApiDispute, CreateDisputePayload } from "@/lib/api/disputeApi";
import type { Dispute } from "@/components/disputes/types";

const normalizeStatus = (s?: string): "Open" | "In Progress" | "Resolved" => {
  const upper = s?.toUpperCase() ?? "";
  if (upper === "IN_PROGRESS") return "In Progress";
  if (upper === "RESOLVED" || upper === "CLOSE") return "Resolved";
  return "Open";
};

const toDispute = (d: ApiDispute): Dispute => ({
  id:              d.id,
  jobId:           d.jobId ?? "—",
  parties:         `${d.client?.id ?? "Client"} vs ${d.expert?.id ?? "Expert"}`,
  issue:           d.client?.statement?.slice(0, 60) ?? "No statement provided",
  priority:        d.priority ?? "MEDIUM",
  status:          normalizeStatus(d.status),
  opened:          d.date ? new Date(d.date).toLocaleDateString("en-GB") : d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-GB") : "—",
  escrowAmount:    d.amountInEscrows ? `₦${Number(d.amountInEscrows).toLocaleString()}` : "—",
  clientStatement: d.client?.statement ?? "No statement provided.",
  expertStatement: d.expert?.statement ?? "No statement provided.",
  clientEvidence:  d.client?.evidence ?? [],
  expertEvidence:  d.expert?.evidence ?? [],
  chatId:          d.chatId ?? "",
  mediationNotes:  [],
});

const PAGE_SIZE = 10;

export default function DisputesPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus } = useAppSelector((s) => s.disputes);

  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [form, setForm] = useState<CreateDisputePayload>({
    jobId: "", date: "", time: "", priority: "MEDIUM", amountInEscrows: 0,
    client: { id: "", statement: "", evidence: [] },
    expert: { id: "", statement: "", evidence: [] },
    chatId: "",
  });

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchDisputes());
  }, [dispatch, listStatus]);

  const handleCreate = () => {
    if (!form.jobId || !form.date || !form.client.id || !form.expert.id) {
      toast.warning("Missing fields", { description: "Job ID, date, client ID and expert ID are required." });
      return;
    }
    setCreating(true);
    dispatch(addDispute(form))
      .unwrap()
      .then(() => { toast.success("Dispute created"); setCreateOpen(false); })
      .catch((err: string) => toast.error("Failed to create dispute", { description: err }))
      .finally(() => setCreating(false));
  };

  const handleExport = async () => {
    setDownloading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const url   = await downloadReport({
        reportType: "dispute",
        type:       "pdf",
        fromDate:   "2026-05-15",
        toDate:     today,
      });
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `disputes_report_${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Disputes report downloaded");
    } catch {
      toast.error("Failed to download disputes report");
    } finally {
      setDownloading(false);
    }
  };

  const stats = {
    open:       list.filter((d) => !d.status || d.status === "OPEN").length,
    inProgress: list.filter((d) => d.status === "IN_PROGRESS").length,
    resolved:   list.filter((d) => d.status === "RESOLVED" || d.status === "CLOSE").length,
  };

  const filtered = list.filter((d) =>
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    (d.jobId ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (d.client?.id ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (d.expert?.id ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  if (selectedStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="Disputes Resolution" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: "10px", color: "var(--color-text-muted)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "13px" }}>Loading dispute...</span>
        </div>
      </div>
    );
  }

  if (selectedStatus === "succeeded" && selected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Topbar title="Disputes Resolution" />
        <DisputeDetail dispute={toDispute(selected)} disputeId={selected.id} onBack={() => dispatch(clearSelectedDispute())} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar title="Disputes Resolution" />

      <style>{`
        .disp-outer      { padding: 12px; gap: 12px; }
        .disp-stat-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .disp-stat-card  { border-radius: 12px; padding: 14px 12px; text-align: center; background: #fff; border: 1px solid var(--color-border); }
        .disp-stat-value { font-size: 24px; }
        .disp-toolbar    { flex-direction: column; gap: 8px; }
        .disp-table-wrap { display: none; }
        .disp-cards      { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .disp-pagination { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 480px) { .disp-toolbar { flex-direction: row; align-items: center; } }
        @media (min-width: 640px) {
          .disp-outer      { padding: 20px 32px; gap: 20px; }
          .disp-stat-card  { padding: 20px 32px; border-radius: 16px; }
          .disp-stat-value { font-size: 28px; }
          .disp-table-wrap { display: block; }
          .disp-cards      { display: none; }
          .disp-pagination { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div className="disp-outer" style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--color-background)", display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            {listStatus === "succeeded" ? `${list.length} disputes total` : "Disputes"}
          </p>
        </div>

        {/* Stats */}
        <div className="disp-stat-grid">
          {[
            { label: "Open",        value: stats.open       },
            { label: "In Progress", value: stats.inProgress },
            { label: "Resolved",    value: stats.resolved   },
          ].map((s) => (
            <div key={s.label} className="disp-stat-card">
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px", fontWeight: 500 }}>{s.label}</p>
              <p className="disp-stat-value" style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                {listStatus === "loading" ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>

          {/* Toolbar */}
          <div className="disp-toolbar" style={{ display: "flex", padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input type="text" placeholder="Search ID, client, job..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={handleExport}
              disabled={downloading}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: downloading ? "not-allowed" : "pointer", flexShrink: 0, opacity: downloading ? 0.7 : 1 }}>
              {downloading ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={14} /> Export</>}
            </button>
          </div>

          {listStatus === "loading" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "10px", color: "var(--color-text-muted)" }}>
              <Loader2 size={18} className="animate-spin" /><span style={{ fontSize: "13px" }}>Loading disputes...</span>
            </div>
          )}

          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "60px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
          )}

          {listStatus === "succeeded" && (
            <>
              <div className="disp-table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                      {["Case ID", "Job ID", "Client", "Amount", "Priority", "Status", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No disputes found.</td></tr>
                    ) : paginated.map((d) => {
                      const ui = toDispute(d);
                      return (
                        <tr key={d.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ui.id}</td>
                          <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{ui.jobId}</td>
                          <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{d.client?.id ?? "—"}</td>
                          <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-main)" }}>{ui.escrowAmount}</td>
                          <td style={{ padding: "16px 20px" }}><PriorityLabel priority={ui.priority} /></td>
                          <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{ui.status}</td>
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button onClick={() => dispatch(fetchDisputeById(d.id))} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                                <Eye size={17} strokeWidth={1.8} />
                              </button>
                              {ui.status === "Resolved" ? (
                                <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "999px", backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>Resolved</span>
                              ) : (
                                <button onClick={() => dispatch(fetchDisputeById(d.id))} style={{ fontSize: "13px", fontWeight: 500, padding: "4px 12px", borderRadius: "8px", color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)", border: "none", cursor: "pointer" }}>
                                  Resolve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="disp-cards">
                {paginated.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No disputes found.</p>
                ) : paginated.map((d) => {
                  const ui = toDispute(d);
                  return (
                    <div key={d.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ui.id}</p>
                          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "2px" }}>Job: {ui.jobId}</p>
                          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{ui.escrowAmount} in escrow</p>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <PriorityLabel priority={ui.priority} />
                          <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>{ui.status}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
                        {ui.status === "Resolved" ? (
                          <span style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>Resolved</span>
                        ) : (
                          <button onClick={() => dispatch(fetchDisputeById(d.id))} style={{ flex: 1, padding: "8px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)", border: "none", cursor: "pointer" }}>
                            Resolve
                          </button>
                        )}
                        <button onClick={() => dispatch(fetchDisputeById(d.id))} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                          <Eye size={16} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {listStatus === "succeeded" && (
            <div className="disp-pagination" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={p === page ? "btn-primary" : ""}
                    style={p !== page ? { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" } : { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "none", cursor: "pointer" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Dispute Modal */}
      {(() => {
        const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box" };
        const lbl: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "6px" };
        return (
          <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Dispute" size="md"
            footer={
              <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                <button onClick={() => setCreateOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="btn-primary" style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: creating ? 0.7 : 1 }}>
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Dispute"}
                </button>
              </div>
            }>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div><label style={lbl}>Job ID *</label><input style={inp} placeholder="job_id" value={form.jobId} onChange={(e) => setForm((f) => ({ ...f, jobId: e.target.value }))} /></div>
                <div><label style={lbl}>Chat ID</label><input style={inp} placeholder="chat_id" value={form.chatId} onChange={(e) => setForm((f) => ({ ...f, chatId: e.target.value }))} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div><label style={lbl}>Date *</label><input style={inp} type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
                <div><label style={lbl}>Time</label><input style={inp} type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></div>
                <div>
                  <label style={lbl}>Priority</label>
                  <select style={inp} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "HIGH"|"MEDIUM"|"LOW" }))}>
                    <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div><label style={lbl}>Amount in Escrow (₦)</label><input style={inp} type="number" placeholder="0" value={form.amountInEscrows} onChange={(e) => setForm((f) => ({ ...f, amountInEscrows: Number(e.target.value) }))} /></div>
              <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "-6px" }}>Client</p>
              <div><label style={lbl}>Client ID *</label><input style={inp} placeholder="client_user_id" value={form.client.id} onChange={(e) => setForm((f) => ({ ...f, client: { ...f.client, id: e.target.value } }))} /></div>
              <div><label style={lbl}>Client Statement</label><textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={2} placeholder="Client's statement..." value={form.client.statement} onChange={(e) => setForm((f) => ({ ...f, client: { ...f.client, statement: e.target.value } }))} /></div>
              <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: "-6px" }}>Expert</p>
              <div><label style={lbl}>Expert ID *</label><input style={inp} placeholder="expert_user_id" value={form.expert.id} onChange={(e) => setForm((f) => ({ ...f, expert: { ...f.expert, id: e.target.value } }))} /></div>
              <div><label style={lbl}>Expert Statement</label><textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={2} placeholder="Expert's statement..." value={form.expert.statement} onChange={(e) => setForm((f) => ({ ...f, expert: { ...f.expert, statement: e.target.value } }))} /></div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}