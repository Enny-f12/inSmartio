// components/disputes/DisputeBadges.tsx
import type { Priority, DisputeStatus } from "@/components/disputes/types";

export function PriorityLabel({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    HIGH:   "text-red-600",
    MEDIUM: "text-amber-700",
    LOW:    "text-green-700",
  };
  return (
    <span className={`text-[13.5px] font-bold ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const styles: Record<DisputeStatus, string> = {
    "Open":        "bg-red-100 text-red-600",
    "In Progress": "bg-amber-100 text-amber-700",
    "Resolved":    "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}