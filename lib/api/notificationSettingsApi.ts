// lib/api/notificationSettingsApi.ts
import axiosInstance from "./axiosInstance";

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface NotificationSettingsPayload {
  adminId?: string;
  disputes: {
    opened:   boolean;
    approved: boolean;
  };
  verifications: {
    submitted: boolean;
    approved:  boolean;
  };
  users: {
    registration: boolean;
    status:       boolean;
  };
  payments: {
    received:  boolean;
    processed: boolean;
  };
  tas: {
    applied: boolean;
    adjust:  boolean;
  };
}

export interface NotificationSettingsResponse {
  id:            string;
  adminId?:      string;
  disputes:      NotificationSettingsPayload["disputes"];
  verifications: NotificationSettingsPayload["verifications"];
  users:         NotificationSettingsPayload["users"];
  payments:      NotificationSettingsPayload["payments"];
  tas:           NotificationSettingsPayload["tas"];
  createdAt?:    string;
  updatedAt?:    string;
}

interface Envelope<T> { status: boolean; message: string; data: T; }

// ── API ───────────────────────────────────────────────────────────────────────

// GET /api/notification-settings/admin/{adminId}
export const getNotificationSettings = async (
  adminId: string
): Promise<NotificationSettingsResponse | null> => {
  try {
    const { data } = await axiosInstance.get<Envelope<NotificationSettingsResponse>>(
      `/notification-settings/admin/${adminId}`
    );
    return data.data ?? null;
  } catch {
    return null; // first time — no settings exist yet
  }
};

// POST /api/notification-settings
export const createNotificationSettings = async (
  payload: NotificationSettingsPayload
): Promise<NotificationSettingsResponse> => {
  const { data } = await axiosInstance.post<Envelope<NotificationSettingsResponse>>(
    "/notification-settings",
    payload
  );
  return data.data;
};

// PATCH /api/notification-settings/{id}
export const updateNotificationSettings = async (
  id: string,
  payload: NotificationSettingsPayload
): Promise<NotificationSettingsResponse> => {
  const { data } = await axiosInstance.patch<Envelope<NotificationSettingsResponse>>(
    `/notification-settings/${id}`,
    payload
  );
  return data.data;
};