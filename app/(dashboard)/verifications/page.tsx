// app/(dashboard)/verifications/page.tsx
"use client";

import { useState } from "react";
import { Search, Eye } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import VerificationModal from "@/components/verifications/VerificationModal";
import { StatusBadge } from "@/components/ui/Badge";
import type { Expert, Tier } from "@/components/verifications/types";

// ── Mock data ────────────────────────────────────────────────
const mockExperts: Expert[] = [
  {
    id: 1, name: "Emeka O.", phone: "+234 801 234 5678", email: "emeka@email.com",
    appliedTier: "Tier 1", submitted: "20/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 3,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
    ],
    nin: { number: "12345678901", status: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: 2, name: "Ngozi E.", phone: "+234 802 345 6789", email: "ngozi@email.com",
    appliedTier: "Tier 1", submitted: "20/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 3,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
    ],
    nin: { number: "98765432100", status: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: 3, name: "Chidi E.", phone: "+234 801 234 5678", email: "chidi@email.com",
    appliedTier: "Tier 3", submitted: "19/03/2026",
    verificationFee: "₦1,500", feePaidOn: "18/03/2026",
    status: "Pending", docsTotal: 7, docsVerified: 5,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "BVN Consent Form", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
      { name: "Proof of Address", status: "Verified" },
      { name: "Guarantor Form", status: "Pending" },
      { name: "Police Clearance", status: "Pending" },
    ],
    guarantor: { name: "Chief Okafor M.", phone: "+234 809 876 5432", occupation: "Civil Servant (Level 14)", status: "Call Guarantor" },
    policeClearance: { certificate: "PC-2026-12345", issued: "10/03/2026 (within 6 months)", issuingState: "Lagos" },
  },
  {
    id: 4, name: "Peter O.", phone: "+234 803 456 7890", email: "peter@email.com",
    appliedTier: "Tier 2", submitted: "18/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 1,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "BVN Consent Form", status: "Pending" },
      { name: "Proof of Address", status: "Pending" },
    ],
  },
  {
    id: 5, name: "Mary K.", phone: "+234 804 567 8901", email: "mary@email.com",
    appliedTier: "Tier 1", submitted: "18/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 3,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
    ],
    nin: { number: "11223344556", status: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: 6, name: "John D.", phone: "+234 805 678 9012", email: "john@email.com",
    appliedTier: "Tier 2", submitted: "15/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 2,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "BVN Consent Form", status: "Verified" },
      { name: "Proof of Address", status: "Pending" },
    ],
  },
  {
    id: 7, name: "James O.", phone: "+234 806 789 0123", email: "james@email.com",
    appliedTier: "Tier 1", submitted: "13/02/2026", status: "Pending",
    docsTotal: 3, docsVerified: 1,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Pending" },
      { name: "Passport Photograph", status: "Pending" },
    ],
  },
  {
    id: 8, name: "Mayowa S.", phone: "+234 807 890 1234", email: "mayowa@email.com",
    appliedTier: "Tier 2", submitted: "10/02/2026", status: "Pending",
    docsTotal: 3, docsVerified: 2,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "BVN Consent Form", status: "Verified" },
      { name: "Proof of Address", status: "Pending" },
    ],
  },
];

const TIERS: Tier[] = ["Tier 1", "Tier 2", "Tier 3"];
const PAGE_SIZE = 10;
const TOTAL_PENDING = 45; // mock total across all tiers

export default function VerificationsPage() {
  const [activeTier, setActiveTier] = useState<Tier>("Tier 1");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<Expert | null>(null);

  const filtered = mockExperts.filter((e) =>
    e.appliedTier === activeTier &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Verifications" />

      <main className="flex-1 px-8 py-6 space-y-5">

        {/* ── Sub-header: pending count + tier tabs ── */}
        <div className="flex items-center justify-between">
          <span className="px-4 py-1.5 rounded-lg text-[13px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {TOTAL_PENDING} pending
          </span>

          <div className="flex items-center gap-2">
            {TIERS.map((tier) => (
              <button
                key={tier}
                onClick={() => { setActiveTier(tier); setPage(1); }}
                className={`
                  px-5 py-2 rounded-xl text-[13px] font-semibold transition-all
                  ${tier === activeTier
                    ? "bg-green-600 text-white border-transparent"
                    : "bg-surface text-text-muted border border-border hover:bg-background"}
                `}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">

          {/* Search bar */}
          <div className="px-6 py-4 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Name", "Submitted", "Status", "Documents", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-sm text-text-muted">
                      No verifications found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((expert) => (
                    <tr key={expert.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4 text-[13.5px] font-semibold text-text-main">
                        {expert.name}
                      </td>
                      <td className="px-6 py-4 text-[13.5px] text-text-muted">
                        {expert.submitted}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge label="Pending" variant="yellow" />
                      </td>
                      <td className="px-6 py-4 text-[13.5px] text-text-muted">
                        {expert.docsVerified}/{expert.docsTotal}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelected(expert)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors"
                          title="View details"
                        >
                          <Eye size={17} strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
            <p className="text-[12px] text-text-muted">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {TOTAL_PENDING} results
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all ${
                    p === page
                      ? "btn-primary"
                      : "border border-border bg-surface text-text-muted hover:bg-background"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-surface text-text-muted hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {selected && (
        <VerificationModal
          expert={selected}
          onClose={() => setSelected(null)}
          onApprove={() => setSelected(null)}
          onReject={() => setSelected(null)}
        />
      )}
    </div>
  );
}