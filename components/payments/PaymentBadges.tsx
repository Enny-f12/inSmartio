import type { Payout } from "./types";

type PayoutStatus = Payout["status"];

const payoutStyles: Record<PayoutStatus, string> = {
  Paid:    "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Failed:  "bg-red-100 text-red-600",
};

export function PayoutBadge({ status }: { status: PayoutStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${payoutStyles[status]}`}>
      {status}
    </span>
  );
}