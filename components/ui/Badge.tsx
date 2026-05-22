// components/ui/StatusBadge.tsx

type BadgeVariant = "green" | "purple" | "yellow" | "red" | "gray";

const variantStyles: Record<BadgeVariant, string> = {
  green:  "bg-green-100 text-green-700",
  purple: "bg-violet-100 text-violet-600",
  yellow: "bg-amber-100 text-amber-700",
  red:    "bg-red-100 text-red-600",
  gray:   "bg-gray-100 text-gray-500",
};

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${variantStyles[variant]}`}>
      {label}
    </span>
  );
}