import axiosInstance from "@/lib/api/axiosInstance";

export interface ApiJob {
  id: string;
  [key: string]: unknown;
}

export interface JobsPaginatedResponse {
  status: boolean;
  message: string;
  data: {
    data: ApiJob[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface GetJobsParams {
  limit?: number;
  page?: number;
  verification?: string;
  status?: string;
  search?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  closed?: boolean;
}

export interface JobsListResult {
  jobs: ApiJob[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const getAllJobs = async (
  params?: GetJobsParams
): Promise<JobsListResult> => {
  const { data } = await axiosInstance.get<JobsPaginatedResponse>(
    "/admin/jobs",
    { params }
  );
  const { data: jobs, total, page, limit, pages } = data.data;
  return { jobs, total, page, limit, pages };
};