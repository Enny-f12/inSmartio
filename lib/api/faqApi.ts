// lib/api/faqApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export type FaqCategory = "client" | "expert" | "tas";
export type FaqStatus   = "active" | "inactive";

export interface ApiFaq {
  id:        string;
  question:  string;
  category:  FaqCategory;
  status:    FaqStatus;
  answer:    string;
  createdAt: string;
  updatedAt: string;
}

export interface FaqPayload {
  question: string;
  category: FaqCategory;
  status:   FaqStatus;
  answer:   string;
}

interface FaqListResponse   { status: boolean; message: string; data: ApiFaq[]; }
interface FaqSingleResponse { status: boolean; message: string; data: ApiFaq;   }

// GET /api/faq
export const getAllFaqs = async (): Promise<ApiFaq[]> => {
  const { data } = await axiosInstance.get<FaqListResponse>("/faq");
  return data.data ?? [];
};

// GET /api/faq/{id}
export const getFaqById = async (id: string): Promise<ApiFaq> => {
  const { data } = await axiosInstance.get<FaqSingleResponse>(`/faq/${id}`);
  return data.data;
};

// POST /api/faq
export const createFaq = async (payload: FaqPayload): Promise<ApiFaq> => {
  const { data } = await axiosInstance.post<FaqSingleResponse>("/faq", payload);
  return data.data;
};

// PUT /api/faq/{id}
export const updateFaq = async (id: string, payload: Partial<FaqPayload>): Promise<ApiFaq> => {
  const { data } = await axiosInstance.put<FaqSingleResponse>(`/faq/${id}`, payload);
  return data.data;
};

// DELETE /api/faq/{id}
export const deleteFaq = async (id: string): Promise<ApiFaq> => {
  const { data } = await axiosInstance.delete<FaqSingleResponse>(`/faq/${id}`);
  return data.data;
};

// POST /api/faq/upload-many
export const uploadManyFaqs = async (faqs: FaqPayload[]): Promise<ApiFaq[]> => {
  const { data } = await axiosInstance.post<FaqListResponse>("/faq/upload-many", { faqs });
  return data.data ?? [];
};