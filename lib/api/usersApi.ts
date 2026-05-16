import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  name: string;
  phone?: string;
  status: string;
  verify: boolean;
  mode: string;
  referral: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  status: boolean;
  message: string;
  data: ApiUser[];      // GET /api/users returns array
}

export interface UserByIdResponse {
  status: boolean;
  message: string;
  data: ApiUser;        // GET /api/users/me/{id} returns single object
}

export const getAllUsers = async (): Promise<ApiUser[]> => {
  const { data } = await axiosInstance.get<UsersListResponse>("/users");
  return data.data;
};

export const getUserById = async (id: string): Promise<ApiUser> => {
  const { data } = await axiosInstance.get<UserByIdResponse>(`/users/me/${id}`);
  return data.data;   // ← single object, not array
};

export interface RegisterUserPayload {
  email: string;
  username: string;
  name: string;
  phone: string;
  password: string;
  referral?: string;
  mode: "client" | "expert" | "tas";
}

export interface RegisterUserResponse {
  status: boolean;
  message: string;
  data: ApiUser;
}

export const registerUser = async (payload: RegisterUserPayload): Promise<ApiUser> => {
  const { data } = await axiosInstance.post<RegisterUserResponse>("/users/register", payload);
  return data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/users/${id}`);
};