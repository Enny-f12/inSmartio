// lib/permissions.ts

export type AdminRole =
  | "super_admin"
  | "verification_officer"
  | "finance_admin"
  | "support_admin"
  | "view_only_admin";

export interface Permissions {
  canViewDashboard:        boolean;
  canViewUsers:            boolean;
  canViewVerifications:    boolean;
  canViewJobs:             boolean;
  canViewTAS:              boolean;
  canViewPayments:         boolean;
  canViewDisputes:         boolean;
  canViewReports:          boolean;
  canViewSettings:         boolean;
  canManageUsers:          boolean;
  canApproveVerifications: boolean;
  canRejectVerifications:  boolean;
  canProcessPayouts:       boolean;
  canManageDisputes:       boolean;
  canManageAdmins:         boolean;
  canAdjustTAS:            boolean;
  canExportData:           boolean;
  canChangeSettings:       boolean;
}

const ROLE_PERMISSIONS: Record<AdminRole, Permissions> = {
  super_admin: {
    canViewDashboard: true, canViewUsers: true, canViewVerifications: true,
    canViewJobs: true, canViewTAS: true, canViewPayments: true,
    canViewDisputes: true, canViewReports: true, canViewSettings: true,
    canManageUsers: true, canApproveVerifications: true, canRejectVerifications: true,
    canProcessPayouts: true, canManageDisputes: true, canManageAdmins: true,
    canAdjustTAS: true, canExportData: true, canChangeSettings: true,
  },
  verification_officer: {
    canViewDashboard: true, canViewUsers: true, canViewVerifications: true,
    canViewJobs: false, canViewTAS: false, canViewPayments: false,
    canViewDisputes: false, canViewReports: false, canViewSettings: false,
    canManageUsers: false, canApproveVerifications: true, canRejectVerifications: true,
    canProcessPayouts: false, canManageDisputes: false, canManageAdmins: false,
    canAdjustTAS: false, canExportData: false, canChangeSettings: false,
  },
  finance_admin: {
    canViewDashboard: true, canViewUsers: true, canViewVerifications: false,
    canViewJobs: false, canViewTAS: true, canViewPayments: true,
    canViewDisputes: false, canViewReports: true, canViewSettings: false,
    canManageUsers: false, canApproveVerifications: false, canRejectVerifications: false,
    canProcessPayouts: true, canManageDisputes: false, canManageAdmins: false,
    canAdjustTAS: false, canExportData: true, canChangeSettings: false,
  },
  support_admin: {
    canViewDashboard: true, canViewUsers: true, canViewVerifications: false,
    canViewJobs: true, canViewTAS: false, canViewPayments: false,
    canViewDisputes: true, canViewReports: false, canViewSettings: false,
    canManageUsers: false, canApproveVerifications: false, canRejectVerifications: false,
    canProcessPayouts: false, canManageDisputes: true, canManageAdmins: false,
    canAdjustTAS: false, canExportData: false, canChangeSettings: false,
  },
  view_only_admin: {
    canViewDashboard: true, canViewUsers: true, canViewVerifications: true,
    canViewJobs: true, canViewTAS: true, canViewPayments: true,
    canViewDisputes: true, canViewReports: true, canViewSettings: false,
    canManageUsers: false, canApproveVerifications: false, canRejectVerifications: false,
    canProcessPayouts: false, canManageDisputes: false, canManageAdmins: false,
    canAdjustTAS: false, canExportData: false, canChangeSettings: false,
  },
};

// Handles "super admin", "SuperAdmin", "super_admin", "SUPER_ADMIN" etc.
export const normaliseRole = (raw?: string | null): AdminRole => {
  if (!raw) return "view_only_admin";
  const s = raw.toLowerCase().replace(/[\s-]/g, "_");
  if (s.includes("super"))        return "super_admin";
  if (s.includes("verification")) return "verification_officer";
  if (s.includes("finance"))      return "finance_admin";
  if (s.includes("support"))      return "support_admin";
  return "view_only_admin";
};

export const getPermissions = (raw?: string | null): Permissions =>
  ROLE_PERMISSIONS[normaliseRole(raw)];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin:           "Super Admin",
  verification_officer:  "Verification Officer",
  finance_admin:         "Finance Admin",
  support_admin:         "Support Admin",
  view_only_admin:       "View-Only Admin",
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin:           "Full access — system config, all modules, user management",
  verification_officer:  "Process expert verifications, view user documents",
  finance_admin:         "Process payouts, view transactions, manage escrow",
  support_admin:         "View disputes, mediate cases, manage user complaints",
  view_only_admin:       "View reports and analytics only — no write access",
};