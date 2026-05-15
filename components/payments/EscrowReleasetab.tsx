// components/payments/EscrowReleasetab.tsx
"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { mockEscrowReleases } from "./types";

export default function EscrowReleasesTab() {
  const [search, setSearch] = useState("");

  const filtered = mockEscrowReleases.filter((e) =>
    e.expert.toLowerCase().includes(search.toLowerCase()) ||
    e.jobId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text" placeholder="Search..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {["Job ID", "Expert", "Amount", "Status", "Date"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-background transition-colors">
                <td className="px-5 py-4 text-[13.5px] font-semibold text-text-main">{e.jobId}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{e.expert}</td>
                <td className="px-5 py-4 text-[13.5px] font-medium text-text-main">{e.amount}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{e.status}</td>
                <td className="px-5 py-4 text-[13.5px] text-text-muted">{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}