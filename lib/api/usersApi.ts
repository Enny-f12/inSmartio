/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from "@/lib/api/axiosInstance";

// ── Document shape (from real API response) ───────────────
export interface ApiDocument {
  id?:        string;
  url:        string;
  publicId?:  string;
  secureUrl?: string;
  date?:      string;
  type:       string;
  reason?:    string | null;
  reject?:    boolean;
  verify?:    boolean;
  adminId?:   string | null;
}

// ── TAS recruitExpectations shape ─────────────────────────
export interface RecruitExpectations {
  area?:                             string;
  years?:                            string;
  networkSize?:                      string;
  selectedCategories?:               string[];
  recruitCountMonthly?:              string;
  hasRecruitmentExperience?:         "yes" | "no" | string;
  recruitmentExperienceDescription?: string;
}

export interface ApiUser {
  id:           string;
  email:        string;
  name:         string;
  phone?:       string;
  status:       string;
  verify:       boolean | string;
  role:         string;
  roles?:       string[];
  avatar:       string | null | { url?: string; secureUrl?: string; publicId?: string; [key: string]: unknown };
  createdAt:    string;
  updatedAt:    string;
  gender?:      string;
  bio?:         string;
  verification?: string;
  tier?:        number;
  category?:    Record<string, unknown> | Array<{ name?: string; sub?: string[] }> | string[];
  skill?:       Record<string, unknown>;
  services?:    unknown;
  bankDetails?: {
    bvn?:           string;
    bankName?:      string;
    accountCode?:   string;
    accountName?:   string;
    accountNumber?: string;
    accountNo?:     string;
  };
  document?:    ApiDocument[];
  paymentModel?: string;
  dob?:          string;
  dateOfBirth?:  string;
  referral?:     string | null;
  username?:     string;
  applicationCode?: string;
  recruitExpectations?: RecruitExpectations | string;
  parentTasId?: string | null;
  account?:     {
    bvn?:           string;
    bankName?:      string;
    accountCode?:   string;
    accountName?:   string;
    accountNumber?: string;
  } | null;
  location?:    {
    area?:    string;
    city?:    string;
    state?:   string;
    country?: string;
    address?: string;
  };
  currentMode?: string;
  pushToken?:   string;
  commission?:  number | null;
  rating?:      number;
  mode?:        string;
}

// ── Response shapes ───────────────────────────────────────
interface AdminUsersData {
  clients:  ApiUser[];
  experts:  ApiUser[];
  tas:      ApiUser[];
  allUsers: ApiUser[];
}

interface AdminUsersResponse {
  status:  boolean;
  message: string;
  data:    AdminUsersData;
}

export interface UserByIdResponse {
  status:  boolean;
  message: string;
  data:    {
    user:  ApiUser;
    jobs?: unknown[];
    bids?: unknown[];
  };
}

// ── Get all users ─────────────────────────────────────────
export const getAllUsers = async (): Promise<ApiUser[]> => {
  const { data } = await axiosInstance.get<AdminUsersResponse>("/admin/users");
  return data.data?.allUsers ?? [];
};

// ── Get user by type + id ─────────────────────────────────
export const getUserById = async (id: string, type: string = "client"): Promise<ApiUser> => {
  const { data } = await axiosInstance.get<UserByIdResponse>(
    `/admin/users/${type.toLowerCase()}/${encodeURIComponent(id)}`
  );
  return data.data.user;
};

// ── Registration payloads ─────────────────────────────────

export interface RegisterClientPayload {
  name:      string;
  email:     string;
  username:  string;
  phone:     string;
  password:  string;
  referral?: string;
}

// POST /experts/register — multipart/form-data
// category is sent as category[] array entries (same as TAS)
// bankDetails.accountCode must always be a string
export interface RegisterExpertPayload {
  name:          string;
  email:         string;
  phone:         string;
  password:      string;
  gender:        "male" | "female" | "other";
  bio:           string;
  referral?:     string;
  avatar?:       Blob;
  ninSlip?:      Blob;
  passport?:     Blob;
  addressProof?: Blob;
  location?: {
    country?: string;
    state?:   string;
    city?:    string;
    area?:    string;
  };
  skill?: {
    experience?:  number | string;
    description?: string;
    role?:        string[];
    area?:        string;
  };
  // category sent as string[] — appended as category[] in FormData
  category?: string[];
  verification?: "tier1" | "tier2" | "tier3";
  paymentModel?: "protected" | "unprotected";
  bankDetails?: {
    bankName?:      string;
    accountNumber?: string;
    bvn?:           string;
    accountCode:    string; // required, default "0000"
    accountName?:   string;
  };
  services?: unknown[];
}

// POST /tas/register — multipart/form-data
export interface RegisterTasPayload {
  username:        string;
  name:            string;
  email:           string;
  phone:           string;
  password:        string;
  gender:          "male" | "female" | "other";
  dateOfBirth:     string;
  applicationCode: string;
  category?:       string[];
  referral?:       string;
  avatar?:         Blob;
  location: {
    address:  string;
    area?:    string;
    city?:    string;
    state?:   string;
    country?: string;
  };
  bankDetails?: {
    bankName?:      string;
    accountNumber?: string;
    accountName?:   string;
    accountCode:    string; // required, default "0000"
  };
  ninSlip?:        Blob;
  bvnConsent?:     Blob;
  governmentId?:   Blob;
  guarantorForm?:  Blob;
  policeClearing?: Blob;
  recruitExpectations?: {
    hasRecruitmentExperience?:         "yes" | "no";
    recruitmentExperienceDescription?: string;
    selectedCategories?:               string[];
    recruitCountMonthly?:              string;
    networkSize?:                      string;
    area?:                             string;
    years?:                            string;
  };
}

export type RegisterUserPayload =
  | (RegisterClientPayload & { role: "client" })
  | (RegisterExpertPayload & { role: "expert" })
  | (RegisterTasPayload    & { role: "tas" });

export interface RegisterUserResponse {
  status:  boolean;
  message: string;
  data:    ApiUser;
}

// ── Build FormData for expert registration ────────────────
function buildExpertFormData(p: RegisterExpertPayload): FormData {
  const fd = new FormData();
  fd.append("name",     p.name);
  fd.append("email",    p.email);
  fd.append("phone",    p.phone);
  fd.append("password", p.password);
  fd.append("gender",   p.gender);
  fd.append("bio",      p.bio);
  if (p.referral)     fd.append("referral",     p.referral);
  if (p.verification) fd.append("verification", p.verification);
  if (p.paymentModel) fd.append("paymentModel", p.paymentModel);
  if (p.avatar)       fd.append("avatar",       p.avatar, "avatar.jpg");

  // Files
  if (p.ninSlip)      fd.append("ninSlip",      p.ninSlip,      "nin_slip.jpg");
  if (p.passport)     fd.append("passport",     p.passport,     "passport.jpg");
  if (p.addressProof) fd.append("addressProof", p.addressProof, "address_proof.jpg");

  // category — must be an array, send as category[]
  if (p.category?.length) {
    p.category.forEach((c) => fd.append("category[]", c));
  }

  // Nested objects → JSON strings
  if (p.location) fd.append("location", JSON.stringify(p.location));
  if (p.skill)    fd.append("skill",    JSON.stringify(p.skill));

  // bankDetails — accountCode must always be a string
  if (p.bankDetails) {
    fd.append("bankDetails", JSON.stringify({
      ...p.bankDetails,
      accountCode: p.bankDetails.accountCode ?? "0000",
    }));
  }

  return fd;
}

// ── Build FormData for TAS registration ──────────────────
function buildTasFormData(p: RegisterTasPayload): FormData {
  const fd = new FormData();
  fd.append("name",            p.name);
  fd.append("email",           p.email);
  fd.append("username",        p.username);
  fd.append("phone",           p.phone);
  fd.append("password",        p.password);
  fd.append("gender",          p.gender);
  fd.append("dateOfBirth",     p.dateOfBirth);
  fd.append("applicationCode", p.applicationCode);
  if (p.referral) fd.append("referral", p.referral);
  if (p.avatar)   fd.append("avatar",   p.avatar, "avatar.jpg");

  fd.append("location", JSON.stringify(p.location));

  if (p.category?.length) {
    p.category.forEach((c) => fd.append("category[]", c));
  }

  if (p.bankDetails) {
    fd.append("bankDetails", JSON.stringify({
      ...p.bankDetails,
      accountCode: p.bankDetails.accountCode ?? "0000",
    }));
  }

  if (p.recruitExpectations) {
    fd.append("recruitExpectations", JSON.stringify(p.recruitExpectations));
  }

  if (p.ninSlip)        fd.append("ninSlip",        p.ninSlip,        "nin_slip.jpg");
  if (p.bvnConsent)     fd.append("bvnConsent",     p.bvnConsent,     "bvn_consent.jpg");
  if (p.governmentId)   fd.append("governmentId",   p.governmentId,   "government_id.jpg");
  if (p.guarantorForm)  fd.append("guarantorForm",  p.guarantorForm,  "guarantor_form.jpg");
  if (p.policeClearing) fd.append("policeClearing", p.policeClearing, "police_clearing.jpg");

  return fd;
}

export const registerUser = async (payload: RegisterUserPayload): Promise<ApiUser> => {
  if (payload.role === "expert") {
    const { role: _, ...expertPayload } = payload as RegisterExpertPayload & { role: "expert" };
    const fd = buildExpertFormData(expertPayload);
    const { data } = await axiosInstance.post<RegisterUserResponse>("/experts/register", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  }

  if (payload.role === "tas") {
    const { role: _, ...tasPayload } = payload as RegisterTasPayload & { role: "tas" };
    const fd = buildTasFormData(tasPayload);
    const { data } = await axiosInstance.post<RegisterUserResponse>("/tas/register", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  }

  // client — plain JSON
  const { role, ...rest } = payload as RegisterClientPayload & { role: "client" };
  void role;
  const { data } = await axiosInstance.post<RegisterUserResponse>("/clients/register", rest);
  return data.data;
};

// ── Admin user actions ────────────────────────────────────
export const adminDeleteUser = async (type: string, id: string): Promise<void> => {
  await axiosInstance.delete(`/admin/users/${type}/${encodeURIComponent(id)}`);
};

export const suspendUser = async (type: string, id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/suspend/${type}/${encodeURIComponent(id)}`);
};

export const activateUser = async (type: string, id: string): Promise<void> => {
  await axiosInstance.put(`/admin/users/activate/${type}/${encodeURIComponent(id)}`);
};

// ── Admin stats ───────────────────────────────────────────
export interface AdminStats {
  [key: string]: unknown;
}

export interface AdminStatsResponse {
  status:  boolean;
  message: string;
  data:    AdminStats;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await axiosInstance.get<AdminStatsResponse>("/admin/stats");
  return data.data;
};