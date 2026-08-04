import axiosInstance from "./axiosInstance";

export interface LoginPayload {
  email: string;
  password: string;
  // Sent only once the backend asks for it (401 + 2FA-required message).
  // TODO: confirm exact field name in Swagger — using "code" as a placeholder;
  // backend may expect "twoFactorCode" or "otp" instead.
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