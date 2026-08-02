/* eslint-disable @typescript-eslint/no-unused-vars */
import axiosInstance from "@/lib/api/axiosInstance";

// ── Document shape (from real API response) ───────────────
export interface ApiDocument {
  id?:         string;
  url:         string;
  publicId?:   string;
  secureUrl?:  string;
  date?:       string | null;
  type:        string;
  idNumber?:   string | null;
  reason?:     string | null;
  reject?:     boolean;
  verify?:     boolean;
  verifiedBy?: string | null;
  adminId?:    string | null;
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
  account?: {
    bvn?:           string;
    bankName?:      string;
    accountCode?:   string;
    accountName?:   string;
    accountNumber?: string;
  } | null;
  document?:    ApiDocument[];
  documents?:   ApiDocument[];
  paymentModel?: string;
  dob?:          string;
  dateOfBirth?:  string;
  referral?:     string | null;
  referralCode?: string | null;
  username?:     string;
  applicationCode?: string;
  recruitExpectations?: RecruitExpectations | string;
  parentTasId?: string | null;
  location?:    {
    area?:    string;
    city?:    string;
    state?:   string;
    country?: string;
    address?: string;
    tier?:    string;
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
  avatar?:   Blob;
  location?: {
    address?: string;
    city?:    string;
    state?:   string;
    country?: string;
  };
}

// ── Expert document item (structured, not blob) ───────────
export interface ExpertDocumentItem {
  type:       string;        // e.g. "National ID", "Passport", "Utility Bill"
  idNumber:   string | null;
  url:        string;        // real URL (Cloudinary or placeholder — backend resolves)
  verify:     boolean;
  reject:     boolean;
  reason:     string | null;
  date:       string | null;
  verifiedBy: string | null;
}

// POST /experts/register — multipart/form-data
export interface RegisterExpertPayload {
  name:          string;
  email:         string;
  phone:         string;
  password:      string;
  gender:        "male" | "female" | "other";
  bio:           string;
  referral?:     string;
  avatar?:       Blob;
  location?: {
    country?: string;
    state?:   string;
    city?:    string;
    area?:    string;
  };
  skill?: {
    role?:        string[];
    experience?:  number;
    description?: string;
    area?:        string;
  };
  category?: { name: string; sub?: string[] }[];
  verification?: "tier1" | "tier2" | "tier3";
  paymentModel?: "protected" | "unprotected";
  bankDetails?: {
    bankName?:      string;
    accountNumber?: string;
    bvn?:           string;
    accountCode:    string;
    accountName?:   string;
  };
  services?: { catalogue: string; price: number }[];
  // Document files — paired with metadata
  documentFiles?: {
    file:       Blob;
    type:       string;
    idNumber?:  string | null;
  }[];
}

// POST /tas/register — multipart/form-data
export interface RegisterTasPayload {
  name:            string;
  email:           string;
  username:        string;
  phone:           string;
  password:        string;
  gender:          "male" | "female" | "other";
  dateOfBirth:     string;          // ISO 8601 date string
  applicationCode: string;
  category?:       string[];        // string array e.g. ["Electrical Services"]
  avatar?:         Blob;
  referralCode?:   string;
  location: {
    address:  string;
    area?:    string;
    city?:    string;
    state?:   string;
    country?: string;
    tier?:    string;
  };
  bankDetails?: {
    bankName?:      string;
    accountNumber?: string;
    accountName?:   string;
    bvn?:           string;
    accountCode:    string;
  };
  // Documents sent as blob URLs with type metadata
  documentFiles?: {
    file:      Blob;
    type:      string;
    idNumber?: string | null;
  }[];
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

// ── Build FormData for client registration ────────────────
function buildClientFormData(p: RegisterClientPayload): FormData {
  const fd = new FormData();

  fd.append("name",     p.name);
  fd.append("email",    p.email);
  fd.append("username", p.username);
  fd.append("phone",    p.phone);
  fd.append("password", p.password);

  if (p.avatar) fd.append("avatar", p.avatar, (p.avatar as File).name ?? "avatar.jpg");

  // location — bracket notation
  if (p.location) {
    Object.entries(p.location).forEach(([k, v]) => {
      if (v !== undefined && v !== "") fd.append(`location[${k}]`, String(v));
    });
  }

  return fd;
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

  if (p.avatar) fd.append("avatar", p.avatar, (p.avatar as File).name ?? "avatar.jpg");

  // category — bracket notation
  if (p.category?.length) {
    p.category.forEach(({ name, sub }, i) => {
      fd.append(`category[${i}][name]`, name);
      (sub ?? []).forEach((s) => fd.append(`category[${i}][sub][]`, s));
    });
  }

  // location — bracket notation
  if (p.location) {
    Object.entries(p.location).forEach(([k, v]) => {
      if (v !== undefined && v !== "") fd.append(`location[${k}]`, String(v));
    });
  }

  // skill — bracket notation; experience is optional, only sent when a valid non-negative number
  if (p.skill) {
    const { role, experience, description, area } = p.skill;
    if (role?.length) role.forEach((r) => fd.append("skill[role][]", r));
    if (description) fd.append("skill[description]", description);
    if (area)        fd.append("skill[area]", area);
    const expNum = Number(experience);
    if (experience !== undefined && experience !== null && Number.isFinite(expNum) && expNum >= 0) {
      fd.append("skill[experience]", String(Math.round(expNum)));
    }
  }

  // bankDetails — bracket notation
  if (p.bankDetails) {
    const bd = { ...p.bankDetails, accountCode: p.bankDetails.accountCode ?? "0000" };
    Object.entries(bd).forEach(([k, v]) => {
      if (v !== undefined && v !== "") fd.append(`bankDetails[${k}]`, String(v));
    });
  }

  // services — bracket notation
  if (p.services?.length) {
    p.services.forEach((svc, i) => {
      fd.append(`services[${i}][catalogue]`, svc.catalogue);
      fd.append(`services[${i}][price]`,     String(svc.price));
    });
  }

  // Documents: same shape as TAS — "documents" carries { type, idNumber, url },
  // files go in a separate index-aligned "files" array. `url` is a placeholder
  // (the backend's DTO requires the field to be a string) — the real file
  // bytes/URL come from the matching entry in "files", not from this value.
  // (Assuming this matches TAS since the 409 we hit explicitly said "Expert
  // must upload..." — flag this to the backend dev if Expert actually differs.)
  if (p.documentFiles?.length) {
    const docMeta = p.documentFiles.map((doc) => ({
      type:     doc.type,
      idNumber: doc.idNumber ?? null,
      url:      URL.createObjectURL(doc.file),
    }));
    fd.append("documents", JSON.stringify(docMeta));
    p.documentFiles.forEach((doc) => {
      fd.append("files[]", doc.file, (doc.file as File).name ?? `${doc.type}.jpg`);
    });
  }

  return fd;
}

// ── Build FormData for TAS registration ──────────────────
function buildTasFormData(p: RegisterTasPayload): FormData {
  const fd = new FormData();

  fd.append("name",            p.name);
  fd.append("email",           p.email);
  fd.append("username",        p.username);
  fd.append("phone",            p.phone);
  fd.append("password",        p.password);
  fd.append("gender",          p.gender);
  fd.append("dateOfBirth",     p.dateOfBirth);
  fd.append("applicationCode", p.applicationCode);

  if (p.avatar) fd.append("avatar", p.avatar, "avatar.jpg");

  // referralCode — top-level
  if (p.referralCode) fd.append("referralCode", p.referralCode);

  // category — string array
  if (p.category?.length) {
    p.category.forEach((c) => fd.append("category[]", c));
  }

  // location — bracket notation
  Object.entries(p.location).forEach(([k, v]) => {
    if (v !== undefined && v !== "") fd.append(`location[${k}]`, String(v));
  });

  // bankDetails — bracket notation
  if (p.bankDetails) {
    const bd = { ...p.bankDetails, accountCode: p.bankDetails.accountCode ?? "0000" };
    Object.entries(bd).forEach(([k, v]) => {
      if (v !== undefined && v !== "") fd.append(`bankDetails[${k}]`, String(v));
    });
  }

  // recruitExpectations — JSON string
  if (p.recruitExpectations) {
    fd.append("recruitExpectations", JSON.stringify(p.recruitExpectations));
  }

  // Documents: the "documents" field carries { type, idNumber, url } per entry.
  // `url` is a placeholder (the backend's DTO requires it as a string) — the
  // real file bytes come from the matching entry in the separate "files"
  // array, index-aligned with "documents" (documents[0]'s type corresponds
  // to files[0], and so on).
  if (p.documentFiles?.length) {
    const docMeta = p.documentFiles.map((doc) => ({
      type:     doc.type,
      idNumber: doc.idNumber ?? null,
      url:      URL.createObjectURL(doc.file),
    }));
    fd.append("documents", JSON.stringify(docMeta));
    p.documentFiles.forEach((doc) => {
      fd.append("files[]", doc.file, (doc.file as File).name ?? `${doc.type}.jpg`);
    });
  }

  return fd;
}

export const registerUser = async (payload: RegisterUserPayload): Promise<ApiUser> => {
  if (payload.role === "expert") {
    const { role: _, ...expertPayload } = payload as RegisterExpertPayload & { role: "expert" };
    const fd = buildExpertFormData(expertPayload);
    const { data } = await axiosInstance.post<RegisterUserResponse>("/experts/register", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return data.data;
  }

  if (payload.role === "tas") {
    const { role: _, ...tasPayload } = payload as RegisterTasPayload & { role: "tas" };
    const fd = buildTasFormData(tasPayload);
    const { data } = await axiosInstance.post<RegisterUserResponse>("/tas/register", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return data.data;
  }

  // client — multipart/form-data (needed so `avatar` actually reaches the backend;
  // it was previously sent as plain JSON, which silently drops File/Blob values)
  const { role: _, ...clientPayload } = payload as RegisterClientPayload & { role: "client" };
  const fd = buildClientFormData(clientPayload);
  const { data } = await axiosInstance.post<RegisterUserResponse>("/clients/register", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
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

// ── Bank list + account resolution ────────────────────────
// Backs the "Verify Account Details" flow in the admin's Bank Details step,
// matching the mobile app (select bank → enter account number → resolve
// name from the backend, rather than typing it manually).

export interface BankListItem {
  name: string;
  code: string;
}

interface BankListResponse {
  status:  boolean;
  message: string;
  // NOTE: assumed shape — adjust the `.data` access below if the real
  // /tas/banks response nests the array differently or uses other key names.
  data:    BankListItem[];
}

export const getBankList = async (): Promise<BankListItem[]> => {
  const { data } = await axiosInstance.get<BankListResponse>("/tas/banks");
  return data.data ?? [];
};

export interface ResolvedBankAccount {
  accountNumber: string;
  accountName:   string;
  bankCode:      string;
}

interface ResolveBankResponse {
  status:  boolean;
  message: string;
  data?: {
    accountNumber?: string;
    account_number?: string;
    accountName?:   string;
    account_name?:  string;
    [key: string]: unknown;
  };
}

export const resolveBankAccount = async (
  accountNumber: string,
  bankCode: string
): Promise<ResolvedBankAccount> => {
  const { data } = await axiosInstance.post<ResolveBankResponse>("/tas/resolve-bank", {
    accountNumber,
    bankCode,
  });
  const d = data.data ?? {};
  return {
    accountNumber: (d.accountNumber ?? d.account_number ?? accountNumber) as string,
    accountName:   (d.accountName ?? d.account_name ?? "") as string,
    bankCode,
  };
};