// lib/api/announcementApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types from Swagger schema ─────────────────────────────

export interface AnnouncementAudience {
  all:    boolean;
  client: boolean;
  expert: boolean;
  tas:    boolean;
}

export interface AnnouncementSchedule {
  now:   boolean;
  later: boolean;
  date?: string;
  time?: string;
}

export type AnnouncementStatus = "sent" | "scheduled" | "draft";

export interface ApiAnnouncement {
  id:        string;
  title:     string;
  message:   string;
  audience:  AnnouncementAudience;
  schedule:  AnnouncementSchedule;
  status:    AnnouncementStatus;
  createdAt: string;
}

export interface CreateAnnouncementPayload {
  title:    string;
  message:  string;
  audience: {
    all:    boolean;
    client: boolean;
    expert: boolean;
    tas:    boolean;
  };
  schedule: {
    now:   boolean;
    later: boolean;
    date?: string;
    time?: string;
  };
}

export type UpdateAnnouncementPayload = Partial<CreateAnnouncementPayload>;

interface AnnouncementsResponse {
  status:  boolean;
  message: string;
  data:    ApiAnnouncement[];
}

interface AnnouncementResponse {
  status:  boolean;
  message: string;
  data:    ApiAnnouncement;
}

// ── API functions ─────────────────────────────────────────

export const getAllAnnouncements = async (): Promise<ApiAnnouncement[]> => {
  const { data } = await axiosInstance.get<AnnouncementsResponse>("/announcement");
  console.log("📋 Announcements API:", data);
  return data.data ?? [];
};

export const getAnnouncementById = async (id: string): Promise<ApiAnnouncement> => {
  const { data } = await axiosInstance.get<AnnouncementResponse>(`/announcement/${id}`);
  return data.data;
};

export const createAnnouncement = async (payload: CreateAnnouncementPayload): Promise<ApiAnnouncement> => {
  const { data } = await axiosInstance.post<AnnouncementResponse>("/announcement", payload);
  return data.data;
};

export const updateAnnouncement = async (id: string, payload: UpdateAnnouncementPayload): Promise<ApiAnnouncement> => {
  const { data } = await axiosInstance.put<AnnouncementResponse>(`/announcement/${id}`, payload);
  return data.data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/announcement/${id}`);
};