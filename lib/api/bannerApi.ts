// lib/api/bannerApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

interface CloudinaryImage {
  url:     string;
  bytes?:  number;
  format?: string;
}

export type BannerRole = "all" | "expert" | "tas" | "client";

export interface ApiBanner {
  id:            string;
  image:         string;
  title:         string;
  subTitle:      string;
  ctaButtonText: string;
  ctaLink:       string;
  startDate:     string;
  endDate:       string;
  status:        string;
  role:          BannerRole;
  click:         number;
  createdAt:     string;
  updatedAt:     string;
}

interface RawApiBanner extends Omit<ApiBanner, "image"> {
  image: string | CloudinaryImage;
}

export interface CreateBannerPayload {
  image:         string | Blob;
  title:         string;
  subTitle:      string;
  ctaButtonText: string;
  ctaLink:       string;
  startDate:     string;
  endDate:       string;
  role?:         BannerRole;
}

export interface UpdateBannerPayload extends Partial<CreateBannerPayload> {
  status?: string;
}

export interface BulkCreateBannerPayload {
  banners: CreateBannerPayload[];
}

interface BannersResponse {
  status:  boolean;
  message: string;
  data:    RawApiBanner[];
}

interface BannerResponse {
  status:  boolean;
  message: string;
  data:    RawApiBanner;
}

// ── Normalise image field to always be a URL string ───────
function normalise(raw: RawApiBanner): ApiBanner {
  return {
    ...raw,
    image: typeof raw.image === "string"
      ? raw.image
      : (raw.image as CloudinaryImage)?.url ?? "",
  };
}

// ── API functions ─────────────────────────────────────────

export const getAllBanners = async (role: BannerRole = "all"): Promise<ApiBanner[]> => {
  const { data } = await axiosInstance.get<BannersResponse>("/banner", {
    params: { role },
  });
  return (data.data ?? []).map(normalise);
};

export const getBannerById = async (id: string): Promise<ApiBanner> => {
  const { data } = await axiosInstance.get<BannerResponse>(`/banner/${id}`);
  return normalise(data.data);
};

export const createBanner = async (payload: CreateBannerPayload): Promise<ApiBanner> => {
  const fd = new FormData();

  if (payload.image instanceof Blob) {
    fd.append("image", payload.image, "banner.jpg");
  } else {
    fd.append("image", payload.image);
  }

  fd.append("title",         payload.title);
  fd.append("subTitle",      payload.subTitle);
  fd.append("ctaButtonText", payload.ctaButtonText);
  fd.append("ctaLink",       payload.ctaLink);
  fd.append("startDate",     payload.startDate);
  fd.append("endDate",       payload.endDate);
  fd.append("role",          payload.role ?? "all");

  const { data } = await axiosInstance.post<BannerResponse>("/banner", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalise(data.data);
};

export const bulkCreateBanners = async (payload: BulkCreateBannerPayload): Promise<ApiBanner[]> => {
  const { data } = await axiosInstance.post<BannersResponse>("/banner/upload-many", payload);
  return (data.data ?? []).map(normalise);
};

export const updateBanner = async (id: string, payload: UpdateBannerPayload): Promise<ApiBanner> => {
  const fd = new FormData();

  if (payload.image !== undefined) {
    if (payload.image instanceof Blob) {
      fd.append("image", payload.image, "banner.jpg");
    } else {
      fd.append("image", payload.image);
    }
  }

  if (payload.title         !== undefined) fd.append("title",         payload.title);
  if (payload.subTitle      !== undefined) fd.append("subTitle",      payload.subTitle);
  if (payload.ctaButtonText !== undefined) fd.append("ctaButtonText", payload.ctaButtonText);
  if (payload.ctaLink       !== undefined) fd.append("ctaLink",       payload.ctaLink);
  if (payload.startDate     !== undefined) fd.append("startDate",     payload.startDate);
  if (payload.endDate       !== undefined) fd.append("endDate",       payload.endDate);
  if (payload.status        !== undefined) fd.append("status",        payload.status);
  if (payload.role          !== undefined) fd.append("role",          payload.role);

  const { data } = await axiosInstance.put<BannerResponse>(`/banner/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalise(data.data);
};

export const deleteBanner = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/banner/${id}`);
};

export const recordBannerClick = async (id: string): Promise<ApiBanner> => {
  const { data } = await axiosInstance.patch<BannerResponse>(`/banner/${id}/click`);
  return normalise(data.data);
};