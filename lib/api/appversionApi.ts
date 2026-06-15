// lib/api/appVersionApi.ts
import axiosInstance from "./axiosInstance";

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface AppVersion {
  id:          string;
  version:     string;       // e.g. "1.0.4"
  releaseNotes: string;
  fileName:    string;       // e.g. "insmartio-1.0.4.apk"
  fileUrl:     string;       // download URL
  fileSize:    number;       // bytes
  uploadedBy:  string;       // adminId
  createdAt:   string;
  updatedAt:   string;
}

export interface UploadAppVersionPayload {
  version:      string;
  releaseNotes: string;
  file:         File;
}

interface Envelope<T> { status: boolean; message: string; data: T; }

// ── API ───────────────────────────────────────────────────────────────────────

// GET /api/app-version/latest  — public, used by website too
export const getLatestAppVersion = async (): Promise<AppVersion | null> => {
  try {
    const { data } = await axiosInstance.get<Envelope<AppVersion>>("/app-version/latest");
    return data.data ?? null;
  } catch {
    return null;
  }
};

// GET /api/app-version  — all versions (admin only)
export const getAllAppVersions = async (): Promise<AppVersion[]> => {
  try {
    const { data } = await axiosInstance.get<Envelope<AppVersion[]>>("/app-version");
    return data.data ?? [];
  } catch {
    return [];
  }
};

// POST /api/app-version/upload  — multipart/form-data (admin only)
export const uploadAppVersion = async (
  payload: UploadAppVersionPayload,
  onProgress?: (pct: number) => void
): Promise<AppVersion> => {
  const form = new FormData();
  form.append("version",      payload.version);
  form.append("releaseNotes", payload.releaseNotes);
  form.append("file",         payload.file, payload.file.name);

  const { data } = await axiosInstance.post<Envelope<AppVersion>>(
    "/app-version/upload",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }
  );
  return data.data;
};

// DELETE /api/app-version/{id}  — admin only
export const deleteAppVersion = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/app-version/${id}`);
};