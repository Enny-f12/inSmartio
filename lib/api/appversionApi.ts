import axiosInstance from "@/lib/api/axiosInstance";

export interface AppVersion {
  id:          string;
  version:     string;
  releaseNote: string;
  fileUrl:     string;
  publicId:    string;
  status:      boolean;
  force:       boolean;
  createdAt:   string;
  updatedAt:   string;
}

export interface AppVersionsResponse {
  status:  boolean;
  message: string;
  data:    AppVersion[];
}

export interface AppVersionResponse {
  status:  boolean;
  message: string;
  data:    AppVersion;
}

export interface UploadAppVersionPayload {
  file:        File;
  version:     string;
  releaseNote: string;
  force:       boolean;
  status?:     boolean;
}

// Backend doesn't return fileName/fileSize — derive a display name from the Cloudinary URL
export const fileNameFromUrl = (url: string): string => {
  try {
    const last = decodeURIComponent(url.split("/").pop() ?? "");
    return last || url;
  } catch {
    return url;
  }
};

export const getAllAppVersions = async (): Promise<AppVersion[]> => {
  const { data } = await axiosInstance.get<AppVersionsResponse>("/app-version");
  return data.data ?? [];
};

export const getLatestAppVersion = async (): Promise<AppVersion | null> => {
  const { data } = await axiosInstance.get<AppVersionResponse>("/app-version/latest");
  return data.data ?? null;
};

export const uploadAppVersion = async (
  payload: UploadAppVersionPayload,
  onProgress?: (pct: number) => void
): Promise<AppVersion> => {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("version", payload.version);
  formData.append("releaseNote", payload.releaseNote);
  formData.append("force", String(payload.force));
  formData.append("status", String(payload.status ?? true));

  const { data } = await axiosInstance.post<AppVersionResponse>(
    "/app-version/upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    }
  );
  return data.data;
};

export const deleteAppVersion = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/app-version/${id}`);
};