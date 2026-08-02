// lib/api/categoriesApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// SubCategory now has name + imageUrl (icon)
export interface ApiSubCategory {
  name:     string;
  imageUrl?: string;  // "iconCode|#color" or URL or emoji
}

export interface ApiCategory {
  id:          string;
  category:    string;
  imageUrl?:   string;
  subCategory?: ApiSubCategory[] | string[];  // API returns objects, we send objects
  status?:     "active" | "inactive" | string;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateCategoryPayload {
  category:    string;
  imageUrl:    string;
  subCategory?: ApiSubCategory[];
  status:      "active" | "inactive" | string;
}

export interface UpdateCategoryPayload {
  category?:    string;
  imageUrl?:    string;
  subCategory?: ApiSubCategory[];
  status?:      "active" | "inactive" | string;
}

interface CategoriesResponse { status: boolean; message: string; data: ApiCategory[];  }
interface CategoryResponse   { status: boolean; message: string; data: ApiCategory;    }

export const getAllCategories = async (): Promise<ApiCategory[]> => {
  const { data } = await axiosInstance.get<CategoriesResponse>("/categories");
  return data.data ?? [];
};

export const getCategoryById = async (id: string): Promise<ApiCategory> => {
  const { data } = await axiosInstance.get<CategoryResponse>(`/categories/${id}`);
  return data.data;
};

export const createCategory = async (payload: CreateCategoryPayload): Promise<ApiCategory> => {
  const { data } = await axiosInstance.post<CategoryResponse>("/categories/create", payload);
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
  return data.data ?? [];
};