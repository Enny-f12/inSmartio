import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

export interface ReportTemplateFileInfo {
  url:      string;
  publicId: string;
  date:     string;
}

export interface ReportTemplate {
  id:          string;
  name:        string;
  type:        string;
  content?:    string;
  description?: string;
  baseReport?: string;
  columns?:    string[];
  filter?:     string[];
  createdBy?:  string;
  used?:       string;      // API returns this as a display string, e.g. "Number of usage"
  urls?: {
    csv?: ReportTemplateFileInfo;
    pdf?: ReportTemplateFileInfo;
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
  baseReport?:  string;
  columns?:     string[];
  filter?:      string[];
  createdBy?:   string;
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
  if (payload.baseReport)  fd.append("baseReport", payload.baseReport);
  if (payload.createdBy)   fd.append("createdBy", payload.createdBy);
  if (payload.file)        fd.append("file", payload.file);
  // array<string> fields — append once per entry under the same key
  (payload.columns ?? []).forEach((c) => fd.append("columns", c));
  (payload.filter ?? []).forEach((f) => fd.append("filter", f));
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