// components/ui/Modal.tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClass = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export default function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Shell — fixed height, flex column, nothing overflows outside */}
      <div className={`w-full ${sizeClass[size]} flex flex-col rounded-2xl bg-white border border-border shadow-2xl overflow-hidden`}
           style={{ maxHeight: "90vh" }}>

        {/* Header — never scrolls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <p className="text-[15px] font-semibold text-text-main">{title}</p>
          <button onClick={onClose} className="p-1 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-colors" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        {/* Body — scrolls independently */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {children}
        </div>

        {/* Footer — never scrolls, always visible */}
        {footer && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-white shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}