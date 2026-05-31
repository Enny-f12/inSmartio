import axiosInstance from "@/lib/api/axiosInstance";

export interface ScheduleObject {
  frequency:   "daily" | "weekly" | "monthly";
  time?:       string;   // e.g. "09:00"
  dayOfWeek?:  number;   // 1=Monday … 7=Sunday (for weekly)
  dayOfMonth?: number;   // 1–31 (for monthly)
}

export interface ScheduledReport {
  id:         string;
  type:       string;
  name:       string;
  schedule:   ScheduleObject;
  recipients: string[];
  lastRunAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduledReportPayload {
  type:       string;
  name:       string;
  schedule:   ScheduleObject;
  recipients: string[];
}

export const getScheduledReports = (): Promise<ScheduledReport[]> =>
  axiosInstance
    .get<{ success: boolean; data: ScheduledReport[] }>("/report/schedule")
    .then((r) => r.data.data);

export const createScheduledReport = (payload: ScheduledReportPayload): Promise<ScheduledReport> =>
  axiosInstance
    .post<{ success: boolean; data: ScheduledReport }>("/report/schedule", payload)
    .then((r) => r.data.data);

export const updateScheduledReport = (
  id: string,
  payload: Partial<ScheduledReportPayload>
): Promise<ScheduledReport> =>
  axiosInstance
    .patch<{ success: boolean; data: ScheduledReport }>(`/report/schedule/${id}`, payload)
    .then((r) => r.data.data);

export const deleteScheduledReport = (id: string): Promise<void> =>
  axiosInstance.delete(`/report/schedule/${id}`).then(() => undefined);