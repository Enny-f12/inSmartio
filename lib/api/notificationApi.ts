// lib/api/notificationApi.ts
import axiosInstance from "./axiosInstance"; // adjust path as needed

/* ── Types ───────────────────────────────────────────────── */
export interface ApiNotification {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
  [key: string]: unknown;
}

interface PaginatedData {
  data: ApiNotification[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Actual response shape: { status, message, data: { data: [], total, page, ... } }
interface ApiListResponse {
  status: boolean;
  message: string;
  data: PaginatedData;
}

interface ApiSingleResponse {
  status: boolean;
  message: string;
  data?: ApiNotification;
}

/* ── Endpoints ───────────────────────────────────────────── */

/** GET /api/notifications  — works for both admin and user (token decides) */
export async function getNotifications(
  params?: { limit?: number; page?: number }
): Promise<ApiNotification[]> {
  const res = await axiosInstance.get<ApiListResponse>("/notifications", {
    params,
  });
  // data.data is the paginated wrapper; data.data.data is the actual array
  return res.data.data?.data ?? [];
}

/** POST /api/notifications/:id/read  — mark one notification read */
export async function markNotificationRead(id: string): Promise<void> {
  await axiosInstance.post<ApiSingleResponse>(`/notifications/${id}/read`);
}

/** POST /api/notifications/read-all  — mark all notifications read */
export async function markAllNotificationsRead(): Promise<void> {
  await axiosInstance.post<ApiSingleResponse>("/notifications/read-all");
}

/** DELETE /api/notifications/:id  — delete a single notification */
export async function deleteNotification(id: string): Promise<void> {
  await axiosInstance.delete<ApiSingleResponse>(`/notifications/${id}`);
}