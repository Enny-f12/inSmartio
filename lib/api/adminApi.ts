// lib/api/adminApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  twoFactorAuth: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminsResponse {
  status: boolean;
  message: string;
  data: Admin[];
}

export interface AdminResponse {
  status: boolean;
  message: string;
  data: Admin;
}

export interface RegisterAdminPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateAdminPayload {
  name?: string;
  email?: string;
}

export const getAllAdmins = async (): Promise<Admin[]> => {
  const { data } = await axiosInstance.get<AdminsResponse>("/admin");
  return data.data ?? [];
};

export const getAdminById = async (id: string): Promise<Admin> => {
  const { data } = await axiosInstance.get<AdminResponse>(`/admin/${id}`);
  return data.data;
};

export const registerAdmin = async (payload: RegisterAdminPayload): Promise<Admin> => {
  const { data } = await axiosInstance.post<AdminResponse>("/admin/register", payload);
  return data.data;
};

export const updateAdmin = async (id: string, payload: UpdateAdminPayload): Promise<Admin> => {
  const { data } = await axiosInstance.put<AdminResponse>(`/admin/${id}`, payload);
  return data.data;
};

export const deleteAdmin = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/admin/${id}`);
};

export const toggle2FA = async (id: string): Promise<Admin> => {
  const { data } = await axiosInstance.get<AdminResponse>(`/admin/toggle-2fa/${id}`);
  return data.data;
};