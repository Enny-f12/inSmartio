import axiosInstance from "./axiosInstance";

// ─── Response shapes ──────────────────────────────────────────────────────────

interface ApiResponse<T> {
  status:  boolean;
  message: string;
  data:    T;
}

export interface CloudSignatureResponse {
  signature: string;
  timestamp: number;
  apiKey:    string;
  cloudName: string;
  folder:    string;
}

export interface CloudinaryUploadResult {
  publicId:     string;
  secure_url:   string;
  url:          string;
  format:       string;
  resourceType: string;
  bytes:        number;
  [key: string]: unknown;
}

// ─── Step 1: get credentials from your backend ───────────────────────────────

export const generateSignature = async (
  folder: string
): Promise<CloudSignatureResponse> => {
  const { data } = await axiosInstance.post<ApiResponse<CloudSignatureResponse>>(
    "/cloud/signature",
    { folder }
  );
  return data.data;
};

// ─── Step 2a: upload via fetch (no progress) ─────────────────────────────────
// cloudName goes in the URL, NOT as a form field

export const uploadToCloudinaryDirect = async (
  file: File,
  creds: CloudSignatureResponse
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append("file",      file);
  formData.append("api_key",   creds.apiKey);
  formData.append("signature", creds.signature);
  formData.append("timestamp", String(creds.timestamp));
  formData.append("folder",    creds.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${creds.cloudName}/raw/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? "Cloudinary upload failed");
  }

  return res.json();
};

// ─── Step 2b: upload via XHR (with real progress) ────────────────────────────
// cloudName goes in the URL, NOT as a form field

export const uploadToCloudinaryWithProgress = (
  file: File,
  creds: CloudSignatureResponse,
  onProgress: (pct: number) => void
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file",      file);
    formData.append("api_key",   creds.apiKey);
    formData.append("signature", creds.signature);
    formData.append("timestamp", String(creds.timestamp));
    formData.append("folder",    creds.folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${creds.cloudName}/raw/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data?.error?.message ?? "Cloudinary upload failed"));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
};