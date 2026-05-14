import type { AppStatus, AgentStatus } from "@/components/tas/types";

export function AppBadge({ status }: { status: AppStatus }) {
  const styles: Record<AppStatus, string> = {
    Approved: "bg-green-100 text-green-700",
    Pending:  "bg-amber-100 text-amber-700",
    Rejected: "bg-red-100 text-red-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export function AgentBadge({ status }: { status: AgentStatus }) {
  const styles: Record<AgentStatus, string> = {
    Active:    "bg-green-100 text-green-700",
    Suspended: "bg-red-100 text-red-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}