import axiosInstance from "@/lib/api/axiosInstance";

export interface ReportTemplate {
  id:       string;
  name:     string;
  type:     string;
  lastUsed: string;
}

export interface ReportTemplatePayload {
  name: string;
  type: string;
}

export const getReportTemplates = (): Promise<ReportTemplate[]> =>
  axiosInstance.get<{ success: boolean; data: ReportTemplate[] }>("/report/templates")
    .then((r) => r.data.data);

export const createReportTemplate = (payload: ReportTemplatePayload): Promise<ReportTemplate> =>
  axiosInstance.post<{ success: boolean; data: ReportTemplate }>("/report/templates", payload)
    .then((r) => r.data.data);

export const updateReportTemplate = (id: string, payload: Partial<ReportTemplatePayload>): Promise<ReportTemplate> =>
  axiosInstance.put<{ success: boolean; data: ReportTemplate }>(`/report/templates/${id}`, payload)
    .then((r) => r.data.data);

export const deleteReportTemplate = (id: string): Promise<void> =>
  axiosInstance.delete(`/report/templates/${id}`).then(() => undefined);