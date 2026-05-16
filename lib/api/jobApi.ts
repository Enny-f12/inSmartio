import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiJob {
  id: string;
  [key: string]: unknown;
}

export interface JobsPaginatedResponse {
  status: boolean;
  message: string;
  data: {
    data: ApiJob[];   // ← nested array
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface JobByIdResponse {
  status: boolean;
  message: string;
  data: ApiJob;
}

export const getAllJobs = async (): Promise<ApiJob[]> => {
  const { data } = await axiosInstance.get<JobsPaginatedResponse>("/jobs");
  return data.data.data;  // ← unwrap nested array
};

export const getJobById = async (id: string): Promise<ApiJob> => {
  const { data } = await axiosInstance.get<JobByIdResponse>(`/jobs/${id}`);
  return data.data;
};

export const closeJob = async (id: string): Promise<void> => {
  await axiosInstance.put(`/jobs/${id}/close`);
};

export const deleteJob = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/jobs/${id}`);
};