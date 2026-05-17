// components/settings/SettingsShared.tsx
"use client";

import { ArrowLeft } from "lucide-react";
import Topbar from "@/components/layout/Navbar";

// ── Sub-page shell ───────────────────────────────────────
interface SubPageShellProps {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SubPageShell({ title, onBack, action, children }: SubPageShellProps) {
  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Settings" />
      <main className="flex-1 px-4 sm:px-8 py-6">
        {/* Sub-header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[13.5px] font-medium text-text-main hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            {title}
          </button>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}

// ── Shared input ─────────────────────────────────────────
interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function FieldInput({ label, ...props }: FieldInputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-[13px] font-medium text-text-main mb-1.5">{label}</label>}
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
      />
    </div>
  );
}

// ── Shared textarea ──────────────────────────────────────
interface FieldTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function FieldTextarea({ label, ...props }: FieldTextareaProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-[13px] font-medium text-text-main mb-1.5">{label}</label>}
      <textarea
        {...props}
        className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none resize-none border border-border bg-background text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
      />
    </div>
  );
}

// ── Save button (used in sub-page sub-headers) ───────────
export function SaveButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-primary px-6 py-2.5 rounded-xl text-[13px] font-semibold"
    >
      Save
    </button>
  );
}