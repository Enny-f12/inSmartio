import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiCategory {
  id: string;
  category: string;
  subCategory?: string[];  // ← array
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  status: boolean;
  message: string;
  data: ApiCategory[];
}

export interface CategoryResponse {
  status: boolean;
  message: string;
  data: ApiCategory;
}

export interface CreateCategoryPayload {
  category: string;
  subCategory?: string[];  // ← array
}

export interface UpdateCategoryPayload {
  category?: string;
  subCategory?: string[];  // ← array
}

export const getAllCategories = async (): Promise<ApiCategory[]> => {
  const { data } = await axiosInstance.get<CategoriesResponse>("/categories");
  return data.data;
};

export const getCategoryById = async (id: string): Promise<ApiCategory> => {
  const { data } = await axiosInstance.get<CategoryResponse>(`/categories/${id}`);
  return data.data;
};

export const createCategory = async (payload: CreateCategoryPayload): Promise<ApiCategory> => {
  const { data } = await axiosInstance.post<CategoryResponse>("/categories", payload);
  return data.data;
};

export const updateCategory = async (id: string, payload: UpdateCategoryPayload): Promise<ApiCategory> => {
  const { data } = await axiosInstance.put<CategoryResponse>(`/categories/${id}`, payload);
  return data.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/categories/${id}`);
};

export const uploadManyCategories = async (file: File): Promise<ApiCategory[]> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await axiosInstance.post<CategoriesResponse>(
    "/categories/upload-many",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};