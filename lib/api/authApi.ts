import axiosInstance from "./axiosInstance";

export interface LoginPayload {
  email: string;
  password: string;
 
  code?: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  status: boolean;
  message: string;
  data: Admin;
  token: string;
}

export const adminLogin = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await axiosInstance.post<LoginResponse>("/admin/login", payload);
  return data;
};

// ─────────────────────────────────────────────────────────
// Forgot password — POST /admin/forgot-password

// ─────────────────────────────────────────────────────────
export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  status: boolean;
  message: string;
  data: Record<string, never>;
}

export const forgotPassword = async (
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> => {
  const { data } = await axiosInstance.post<ForgotPasswordResponse>(
    "/admin/forgot-password",
    payload
  );
  return data;
};

// ─────────────────────────────────────────────────────────
// Reset password — POST /admin/reset-password/{id}
// Resets the password using the OTP `code` emailed by forgot-password.
//

export interface ResetPasswordPayload {
  newPassword: string;
  confirmPassword: string;
  code: string;
}

export interface ResetPasswordResponse {
  status: boolean;
  message: string;
  data: Record<string, unknown> | string | null;
}

export const resetPassword = async (
  id: string,
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> => {
  const { data } = await axiosInstance.post<ResetPasswordResponse>(
    `/admin/reset-password/${encodeURIComponent(id)}`,
    payload
  );
  return data;
};