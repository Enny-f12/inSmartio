// lib/api/appVersionApi.ts
import axiosInstance from "./axiosInstance";
import axios from "axios";

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface AppVersion {
  id:           string;
  version:      string;       // e.g. "1.0.4"
  releaseNotes: string;
  fileName:     string;       // e.g. "insmartio-1.0.4.apk"
  fileUrl:      string;       // download URL
  fileSize:     number;       // bytes
  uploadedBy:   string;       // adminId
  createdAt:    string;
  updatedAt:    string;
}

export interface UploadAppVersionPayload {
  version:      string;
  releaseNotes: string;
  file:         File;
}

interface Envelope<T> { status: boolean; message: string; data: T; }

interface CloudSignature {
  signature: string;
  timestamp: number;
  apiKey:    string;
  folder:    string;
  cloudName: string;  // backend returns CLOUDINARY_CLOUD_NAME ("prolomon")
}

// ── API ───────────────────────────────────────────────────────────────────────

// GET /api/app-version/latest  — public
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

// POST /api/app-version/upload — three-step: sign → Cloudinary → save metadata
export const uploadAppVersion = async (
  payload: UploadAppVersionPayload,
  onProgress?: (pct: number) => void
): Promise<AppVersion> => {

  // ── Step 1: Get signed upload credentials from backend ────────────────────
  // Backend uses CLOUDINARY_API_SECRET to sign; never exposed to frontend
  const sigRes = await axiosInstance.post<Envelope<CloudSignature>>(
    "/cloud/signature",
    { folder: "app-versions" }
  );
  const { signature, timestamp, apiKey, folder, cloudName } = sigRes.data.data;
  // cloudName === "prolomon" (comes from backend CLOUDINARY_CLOUD_NAME)

  // ── Step 2: Upload APK directly to Cloudinary ─────────────────────────────
  // resource_type=raw is required for non-image/video files like APKs
  const cloudForm = new FormData();
  cloudForm.append("file",          payload.file, payload.file.name);
  cloudForm.append("signature",     signature);
  cloudForm.append("timestamp",     String(timestamp));
  cloudForm.append("api_key",       apiKey);
  cloudForm.append("folder",        folder);
  cloudForm.append("resource_type", "raw");

  const cloudRes = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    cloudForm,
    {
      timeout: 600_000, // 10 min — APKs can be large
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 90)); // 0–90%
        }
      },
    }
  );

  const {
    secure_url,
    public_id,
    bytes,
    original_filename,
  }: {
    secure_url:        string;
    public_id:         string;
    bytes:             number;
    original_filename: string;
  } = cloudRes.data;

  // ── Step 3: Save version metadata to backend ──────────────────────────────
  const { data } = await axiosInstance.post<Envelope<AppVersion>>(
    "/app-version/upload",
    {
      version:     payload.version,
      releaseNote: payload.releaseNotes,
      fileUrl:     secure_url,
      publicId:    public_id,
      fileSize:    bytes,
      fileName:    original_filename ?? payload.file.name,
    }
  );

  onProgress?.(100);
  return data.data;
};

// DELETE /api/app-version/{id}  — admin only
export const deleteAppVersion = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/app-version/${id}`);
};