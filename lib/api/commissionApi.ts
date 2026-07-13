// lib/api/commissionApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type ActiveModel = "protected" | "unprotected" | "both";

export interface ApiCommission {
  id:                   string;
  model2CommissionRate: number;
  modelISubscription:   string;
  tasRegistrationBonus: number;
  tasModel1Commission:  number;
  tasModel2Commission:  number;
  effectiveDate:        string; // ISO 8601 datetime e.g. "2026-05-19T14:30:00Z"
  status:               boolean;
  activePaymentModel?:  ActiveModel; // this specific record's payment model (per-record scope, endpoint 4)
  createdAt?:           string;
  updatedAt?:           string;
}

export interface CreateCommissionPayload {
  model2CommissionRate: number;
  modelISubscription:   string;
  tasRegistrationBonus: number;
  tasModel1Commission:  number;
  tasModel2Commission:  number;
  effectiveDate:        string; // ISO 8601 datetime — e.g. "2026-05-19T14:30:00Z"
}

export type UpdateCommissionPayload = Partial<CreateCommissionPayload>;

interface CommissionListResponse       { status: boolean; message: string; data: ApiCommission[];  }
interface CommissionSingleResponse     { status: boolean; message: string; data: ApiCommission;    }
interface CommissionToggleResponse     { status: boolean; message: string; data: ApiCommission;    }
// Actual response shape observed for GET /settings/active-model — NOT the bare
// string the original spec described. Wrapped as { activePaymentModel: "..." }.
interface ActiveModelGetResponse       { status: boolean; message: string; data: { activePaymentModel: ActiveModel }; }

// GET /api/settings/commission
export const getAllCommissions = async (): Promise<ApiCommission[]> => {
  const { data } = await axiosInstance.get<CommissionListResponse>("/settings/commission");
  return data.data ?? [];
};

// GET /api/settings/commission/{id}
export const getCommissionById = async (id: string): Promise<ApiCommission> => {
  const { data } = await axiosInstance.get<CommissionSingleResponse>(`/settings/commission/${id}`);
  return data.data;
};

// POST /api/settings/commission/create
// Payload must include effectiveDate as a full ISO 8601 string: "2026-05-19T14:30:00Z"
// If the user picks a date-only value (e.g. from a date input), use toISOString() before sending.
export const createCommission = async (payload: CreateCommissionPayload): Promise<ApiCommission> => {
  // Ensure effectiveDate is always a full ISO string, never a bare date like "2026-05-19"
  const sanitised: CreateCommissionPayload = {
    ...payload,
    effectiveDate: toISOString(payload.effectiveDate),
  };
  const { data } = await axiosInstance.post<CommissionSingleResponse>(
    "/settings/commission/create",
    sanitised,
  );
  return data.data;
};

// PUT /api/settings/commission/{id}
export const updateCommission = async (
  id:      string,
  payload: UpdateCommissionPayload,
): Promise<ApiCommission> => {
  const sanitised: UpdateCommissionPayload = { ...payload };
  if (sanitised.effectiveDate) {
    sanitised.effectiveDate = toISOString(sanitised.effectiveDate);
  }
  const { data } = await axiosInstance.put<CommissionSingleResponse>(
    `/settings/commission/${id}`,
    sanitised,
  );
  return data.data;
};

// DELETE /api/settings/commission/{id}
export const deleteCommission = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/settings/commission/${id}`);
};

// PATCH /api/settings/commission/{id}/toggle-status
export const toggleCommissionStatus = async (id: string): Promise<ApiCommission> => {
  const { data } = await axiosInstance.patch<CommissionToggleResponse>(
    `/settings/commission/${id}/toggle-status`,
  );
  return data.data;
};

// ── Active payment model endpoints ──────────────────────────────────────────

// GET /settings/active-model — public, no auth required
export const getActiveModel = async (): Promise<ActiveModel> => {
  const { data } = await axiosInstance.get<ActiveModelGetResponse>("/settings/active-model");
  return data.data.activePaymentModel;
};

// PATCH /settings/commission/active-model — admin only, sets an explicit model
export const setActiveModel = async (model: ActiveModel): Promise<ApiCommission> => {
  const { data } = await axiosInstance.patch<CommissionSingleResponse>(
    "/settings/commission/active-model",
    { model },
  );
  return data.data;
};

// PATCH /settings/commission/active-model/toggle — admin only,
// cycles both -> protected -> unprotected -> both
export const toggleActiveModel = async (): Promise<ApiCommission> => {
  const { data } = await axiosInstance.patch<CommissionSingleResponse>(
    "/settings/commission/active-model/toggle",
  );
  return data.data;
};

// PATCH /settings/commission/{id}/active-model/toggle — admin only,
// toggles the model for one specific commission settings record
export const toggleCommissionActiveModel = async (id: string): Promise<ApiCommission> => {
  const { data } = await axiosInstance.patch<CommissionSingleResponse>(
    `/settings/commission/${id}/active-model/toggle`,
  );
  return data.data;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Accepts any of these and always returns a full ISO 8601 string:
 *   - Already ISO:  "2026-05-19T14:30:00Z"        → "2026-05-19T14:30:00.000Z"
 *   - Date-only:    "2026-05-19"                   → "2026-05-19T00:00:00.000Z"
 *   - Date object:  new Date("2026-05-19")          → "2026-05-19T00:00:00.000Z"
 */
export function toISOString(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid effectiveDate value: "${value}"`);
  }
  return d.toISOString(); // always "YYYY-MM-DDTHH:mm:ss.sssZ"
}