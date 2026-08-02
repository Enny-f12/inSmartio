import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  generateSignature,
  uploadToCloudinaryWithProgress,
  CloudSignatureResponse,
  CloudinaryUploadResult,
} from "../api/cloudApi";

// ─── State ────────────────────────────────────────────────────────────────────

interface CloudState {
  signature:        CloudSignatureResponse | null;
  signatureLoading: boolean;
  signatureError:   string | null;

  uploadResult:     CloudinaryUploadResult | null;
  uploadLoading:    boolean;
  uploadProgress:   number;
  uploadError:      string | null;
}

const initialState: CloudState = {
  signature:        null,
  signatureLoading: false,
  signatureError:   null,

  uploadResult:     null,
  uploadLoading:    false,
  uploadProgress:   0,
  uploadError:      null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const generateSignatureThunk = createAsyncThunk(
  "cloud/generateSignature",
  async (folder: string, { rejectWithValue }) => {
    try {
      return await generateSignature(folder);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? "Failed to generate signature";
      return rejectWithValue(message);
    }
  }
);

export const uploadToCloudinaryThunk = createAsyncThunk(
  "cloud/uploadToCloudinary",
  async (
    { file, creds, onProgress }: {
      file: File;
      creds: CloudSignatureResponse;
      onProgress?: (pct: number) => void;
    },
    { rejectWithValue }
  ) => {
    try {
      return await uploadToCloudinaryWithProgress(
        file,
        creds,
        onProgress ?? (() => {})
      );
    } catch (err: unknown) {
      const message =
        (err as Error)?.message ?? "Upload to Cloudinary failed";
      return rejectWithValue(message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const cloudSlice = createSlice({
  name: "cloud",
  initialState,
  reducers: {
    resetCloud: () => initialState,
    setUploadProgress(state, action: PayloadAction<number>) {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateSignatureThunk.pending, (state) => {
        state.signatureLoading = true;
        state.signatureError   = null;
        state.signature        = null;
      })
      .addCase(generateSignatureThunk.fulfilled, (state, action) => {
        state.signatureLoading = false;
        state.signature        = action.payload;
      })
      .addCase(generateSignatureThunk.rejected, (state, action) => {
        state.signatureLoading = false;
        state.signatureError   = action.payload as string;
      });

    builder
      .addCase(uploadToCloudinaryThunk.pending, (state) => {
        state.uploadLoading  = true;
        state.uploadError    = null;
        state.uploadResult   = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadToCloudinaryThunk.fulfilled, (state, action) => {
        state.uploadLoading  = false;
        state.uploadProgress = 100;
        state.uploadResult   = action.payload;
      })
      .addCase(uploadToCloudinaryThunk.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError   = action.payload as string;
      });
  },
});

export const { resetCloud, setUploadProgress } = cloudSlice.actions;
export default cloudSlice.reducer;