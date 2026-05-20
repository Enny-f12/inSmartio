// components/disputes/DisputeBadges.tsx
import type { Priority, DisputeStatus } from "@/components/disputes/types";

export function PriorityLabel({ priority }: { priority: Priority }) {
  const styles: Record<Priority, { bg: string; color: string; label: string }> = {
    HIGH:   { bg: "#fef2f2", color: "#dc2626", label: "High"   },
    MEDIUM: { bg: "#fffbeb", color: "#d97706", label: "Medium" },
    LOW:    { bg: "#f0fdf4", color: "#16a34a", label: "Low"    },
  };
  const s = styles[priority] ?? styles.MEDIUM;
  return (
    <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const styles: Record<DisputeStatus, { bg: string; color: string; border: string; label: string }> = {
    // UI-normalized values
    "Open":        { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Open"        },
    "In Progress": { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "In Progress" },
    "Resolved":    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Resolved"    },
    // Raw backend values — handled in case normalizeStatus isn't applied
    "OPEN":        { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Open"        },
    "IN_PROGRESS": { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "In Progress" },
    "RESOLVED":    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Resolved"    },
    "CLOSE":       { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Closed"      },
  };
  const s = styles[status] ?? styles["Open"];
  return (
    <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}