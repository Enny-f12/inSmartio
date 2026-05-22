import axiosInstance from "@/lib/api/axiosInstance";

// ── Data Models & Schemas ───────────────────────────────────────────

export interface ApiCategory {
  id: string;
  category: string;
  imageUrl?: string;                         // Base64 or URL string from swagger
  subCategory?: string[];                    // Array of strings
  status?: "active" | "inactive" | string;   // Status indicator
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
  imageUrl: string;                          // Required base64 string
  subCategory?: string[];                    // Array of strings
  status: "active" | "inactive" | string;   // Required state
}

export interface UpdateCategoryPayload {
  category?: string;
  imageUrl?: string;
  subCategory?: string[];
  status?: "active" | "inactive" | string;
}

// ── API Methods ──────────────────────────────────────────────────────

/**
 * GET /api/categories
 * Retrieves all categories seamlessly
 */
export const getAllCategories = async (): Promise<ApiCategory[]> => {
  const { data } = await axiosInstance.get<CategoriesResponse>("/categories");
  return data.data;
};

/**
 * GET /api/categories/{id}
 * Finds a specific category by its unique ID
 */
export const getCategoryById = async (id: string): Promise<ApiCategory> => {
  const { data } = await axiosInstance.get<CategoryResponse>(`/categories/${id}`);
  return data.data;
};

/**
 * POST /api/categories/create
 * Creates a brand new category tracking schema constraints
 */
export const createCategory = async (payload: CreateCategoryPayload): Promise<ApiCategory> => {
  const { data } = await axiosInstance.post<CategoryResponse>("/categories/create", payload);
  return data.data;
};

/**
 * PUT /api/categories/{id}
 * Partially updates an existing category configuration
 */
export const updateCategory = async (id: string, payload: UpdateCategoryPayload): Promise<ApiCategory> => {
  const { data } = await axiosInstance.put<CategoryResponse>(`/categories/${id}`, payload);
  return data.data;
};

/**
 * DELETE /api/categories/{id}
 * Purges a category record safely from the register
 */
export const deleteCategory = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/categories/${id}`);
};

/**
 * POST /api/categories/upload-many
 * Bulk upload wrapper for fast stream updates via file binary processing
 */
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