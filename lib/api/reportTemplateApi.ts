import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

export interface ReportTemplate {
  id:          string;
  name:        string;
  type:        string;
  description?: string;
  content?:    string;
  urls?: {
    csv?: { url: string; publicId: string; date: string };
    pdf?: { url: string; publicId: string; date: string };
  };
  lastUsed?:   string;
  createdAt?:  string;
  updatedAt?:  string;
}

export interface ReportTemplatePayload {
  name:         string;
  type:         string;
  content:      string;
  description?: string;
  file?:        File;       // optional CSV or PDF upload
}

// ── Helpers ───────────────────────────────────────────────

/** Builds a FormData from a ReportTemplatePayload */
const toFormData = (payload: ReportTemplatePayload): FormData => {
  const fd = new FormData();
  fd.append("name",    payload.name);
  fd.append("type",    payload.type);
  fd.append("content", payload.content);
  if (payload.description) fd.append("description", payload.description);
  if (payload.file)        fd.append("file", payload.file);
  return fd;
};

// ── API calls ─────────────────────────────────────────────

export const getReportTemplates = (): Promise<ReportTemplate[]> =>
  axiosInstance
    .get<{ success: boolean; data: ReportTemplate[] }>("/report/templates")
    .then((r) => r.data.data ?? []);

export const createReportTemplate = (payload: ReportTemplatePayload): Promise<ReportTemplate> =>
  axiosInstance
    .post<{ success: boolean; data: ReportTemplate }>(
      "/report/templates",
      toFormData(payload),
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    .then((r) => r.data.data);

export const updateReportTemplate = (
  id: string,
  payload: Partial<ReportTemplatePayload>,
): Promise<ReportTemplate> =>
  axiosInstance
    .patch<{ success: boolean; data: ReportTemplate }>(
      `/report/templates/${id}`,
      toFormData(payload as ReportTemplatePayload),
      { headers: { "Content-Type": "multipart/form-data" } },
    )
    .then((r) => r.data.data);

export const deleteReportTemplate = (id: string): Promise<void> =>
  axiosInstance.delete(`/report/templates/${id}`).then(() => undefined);