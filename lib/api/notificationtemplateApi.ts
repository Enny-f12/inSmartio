// lib/api/notificationApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiNotificationTemplate {
  id:        string;
  name:      string;
  subject:   string;
  body:      string;
  fields?:   { label: string; placeholder: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemplatePayload {
  name:    string;
  subject: string;
  body:    string;
}

interface TemplateListResponse {
  status:  boolean;
  message: string;
  data:    ApiNotificationTemplate[];
}

interface TemplateSingleResponse {
  status:  boolean;
  message: string;
  data:    ApiNotificationTemplate;
}

// GET /api/notifications/templates
export const getAllTemplates = async (): Promise<ApiNotificationTemplate[]> => {
  const { data } = await axiosInstance.get<TemplateListResponse>("/notifications/templates");
  return data.data ?? [];
};

// POST /api/notifications/templates/create
// Sends exactly: { name, subject, body } — no extra nesting
export const createTemplate = async (
  payload: CreateTemplatePayload,
): Promise<ApiNotificationTemplate> => {
  const { data } = await axiosInstance.post<TemplateSingleResponse>(
    "/notifications/templates/create",
    {
      name:    payload.name,
      subject: payload.subject,
      body:    payload.body,
    },
  );
  return data.data;
};