// components/ui/Loader.tsx
"use client";

interface LoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

const ring = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

const dot = {
  sm: "w-1.5 h-1.5",
  md: "w-2.5 h-2.5",
  lg: "w-3.5 h-3.5",
};

const text = {
  sm: "text-[11px]",
  md: "text-[13px]",
  lg: "text-[14px]",
};

export default function Loader({ text: label = "Loading...", size = "md" }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">

      {/* Ring */}
      <div className={`relative ${ring[size]}`}>

        {/* Track */}
        <div className={`absolute inset-0 rounded-full border-2 border-border`} />

        {/* Spinning arc — uses Tailwind animate-spin + border-primary */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin`}
          style={{
            borderTopColor: "var(--color-primary)",
            borderRightColor: "var(--color-primary)",
          }}
        />

        {/* Center pulsing dot */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse ${dot[size]}`}
          style={{ backgroundColor: "var(--color-primary)" }}
        />
      </div>

      {/* Label */}
      {label && (
        <p className={`${text[size]} font-medium text-text-muted`}>{label}</p>
      )}
    </div>
  );
}

export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center flex-1 min-h-75">
      <Loader text={text} size="md" />
    </div>
  );
}