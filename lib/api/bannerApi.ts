// lib/api/bannerApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types from Swagger schema ─────────────────────────────

export interface ApiBanner {
  id:            string;
  image:         string;
  title:         string;
  subTitle:      string;
  ctaButtonText: string;
  ctaLink:       string;
  startDate:     string;
  endDate:       string;
  status:        string; // "active" | "inactive"
  click:         number;
  createdAt:     string;
  updatedAt:     string;
}

export interface CreateBannerPayload {
  image:         string;
  title:         string;
  subTitle:      string;
  ctaButtonText: string;
  ctaLink:       string;
  startDate:     string;
  endDate:       string;
}

export interface UpdateBannerPayload extends Partial<CreateBannerPayload> {
  status?: string; // "active" | "inactive"
}

export interface BulkCreateBannerPayload {
  banners: CreateBannerPayload[];
}

interface BannersResponse {
  status:  boolean;
  message: string;
  data:    ApiBanner[];
}

interface BannerResponse {
  status:  boolean;
  message: string;
  data:    ApiBanner;
}

// ── API functions ─────────────────────────────────────────

export const getAllBanners = async (): Promise<ApiBanner[]> => {
  const { data } = await axiosInstance.get<BannersResponse>("/banner");
  console.log("📋 Banners API:", data);
  return data.data ?? [];
};

export const getBannerById = async (id: string): Promise<ApiBanner> => {
  const { data } = await axiosInstance.get<BannerResponse>(`/banner/${id}`);
  return data.data;
};

export const createBanner = async (payload: CreateBannerPayload): Promise<ApiBanner> => {
  const { data } = await axiosInstance.post<BannerResponse>("/banner", payload);
  return data.data;
};

export const bulkCreateBanners = async (payload: BulkCreateBannerPayload): Promise<ApiBanner[]> => {
  const { data } = await axiosInstance.post<BannersResponse>("/banner/upload-many", payload);
  return data.data ?? [];
};

export const updateBanner = async (id: string, payload: UpdateBannerPayload): Promise<ApiBanner> => {
  const { data } = await axiosInstance.put<BannerResponse>(`/banner/${id}`, payload);
  return data.data;
};

export const deleteBanner = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/banner/${id}`);
};

// PATCH /api/banner/{id}/click — increments click count, returns updated banner
export const recordBannerClick = async (id: string): Promise<ApiBanner> => {
  const { data } = await axiosInstance.patch<BannerResponse>(`/banner/${id}/click`);
  return data.data;
};