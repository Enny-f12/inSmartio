// app/(dashboard)/jobs/types.ts

export type JobStatus = "Completed" | "Inprogress" | "Bidding" | "Disputed" | "Cancelled";

export interface TimelineEvent {
  datetime: string;
  label: string;
}

export interface Job {
  id: string;
  client: string;
  clientPhone: string;
  clientEmail: string;
  clientRating: number;
  expert: string | null;
  expertPhone?: string;
  expertEmail?: string;
  expertRating?: number;
  amount: string;
  status: JobStatus;
  title: string;
  category: string;
  location: string;
  budget: string;
  finalPrice: string;
  created: string;
  paymentMethod: string;
  commission: string;
  commissionAmt: string;
  expertPayout: string;
  paymentStatus: string;
  timeline: TimelineEvent[];
}