// components/ui/FilterDropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface FilterDropdownProps<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  placeholder?: string;
}

export function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Filter",
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border border-border bg-surface text-text-main transition-colors hover:bg-background min-w-35"
      >
        <span className="flex-1 text-left">{value || placeholder}</span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-hidden py-1 bg-surface border border-border shadow-lg min-w-40">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-left transition-colors text-text-main ${opt === value ? "bg-background" : "hover:bg-background"}`}
            >
              {opt === value
                ? <Check size={13} className="text-primary" />
                : <span className="w-3.25" />}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}