import axiosInstance from "@/lib/api/axiosInstance"; // adjust path as needed
import type {
  SubscriptionPlan,
  CreateSubscriptionPayload,
  UpdateSubscriptionPayload,
  ApiResponse,
  ApiListResponse,
} from "@/lib/redux/subscriptionSlice";

export const subscriptionApi = {
  getAll: () =>
    axiosInstance.get<ApiListResponse<SubscriptionPlan>>("/subscribe"),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<SubscriptionPlan>>(`/subscribe/${id}`),

  getCurrent: () =>
    axiosInstance.get<ApiResponse<SubscriptionPlan>>("/subscribe/current"),

  create: (payload: CreateSubscriptionPayload) =>
    axiosInstance.post<ApiResponse<SubscriptionPlan>>("/subscribe", payload),

  update: (id: string, payload: UpdateSubscriptionPayload) =>
    axiosInstance.put<ApiResponse<SubscriptionPlan>>(`/subscribe/${id}`, payload),

  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/subscribe/${id}`),
};