// lib/api/notificationSettingsApi.ts
import axiosInstance from "./axiosInstance";

// ── TYPES ────────────────────────────────────────────────────────────────────
export interface NotificationSettingsPayload {
  dispute_opened:         boolean;
  dispute_resolved:       boolean;
  verification_submitted: boolean;
  verification_approved:  boolean;
  new_user:               boolean;
  user_suspended:         boolean;
  payment_received:       boolean;
  payout_processed:       boolean;
  tas_application:        boolean;
  tas_tier_adjusted:      boolean;
}

export interface NotificationSettingsResponse extends NotificationSettingsPayload {
  id:         string;
  createdAt?: string;
  updatedAt?: string;
}

interface Envelope<T> { status: boolean; message: string; data: T; }

// ── API ───────────────────────────────────────────────────────────────────────

// GET /api/settings/notification-settings
export const getNotificationSettings = async (): Promise<NotificationSettingsResponse | null> => {
  try {
    const { data } = await axiosInstance.get<Envelope<NotificationSettingsResponse>>(
      "/settings/notification-settings"
    );
    return data.data ?? null;
  } catch {
    return null; // first time — no settings exist yet
  }
};

// POST /api/settings/notification-settings/create
export const createNotificationSettings = async (
  payload: NotificationSettingsPayload
): Promise<NotificationSettingsResponse> => {
  const { data } = await axiosInstance.post<Envelope<NotificationSettingsResponse>>(
    "/settings/notification-settings/create",
    payload
  );
  return data.data;
};

// PUT /api/settings/notification-settings/{id}
export const updateNotificationSettings = async (
  id: string,
  payload: NotificationSettingsPayload
): Promise<NotificationSettingsResponse> => {
  const { data } = await axiosInstance.put<Envelope<NotificationSettingsResponse>>(
    `/settings/notification-settings/${id}`,
    payload
  );
  return data.data;
};