// lib/adminPermissions.ts

// ── Role types ────────────────────────────────────────────

export type AdminRole =
  | "admin"
  | "verification"
  | "support"
  | "finance"
  | "view";

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin:        "Super Admin",
  verification: "Verification Officer",
  finance:      "Finance Admin",
  support:      "Support Admin",
  view:         "View Only",
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  admin:        "Full access to all platform features, settings, and admin management.",
  verification: "Can review and approve or reject user verification requests.",
  finance:      "Can view and manage financial records, payouts, and transactions.",
  support:      "Can access support tickets and assist users with account issues.",
  view:         "Read-only access to the dashboard. Cannot make any changes.",
};

// ── Permissions map ───────────────────────────────────────

export interface Permissions {
  // Dashboard
  canViewDashboard:         boolean;

  // Users
  canViewUsers:             boolean;
  canCreateUser:            boolean;
  canEditUser:              boolean;
  canDeleteUser:            boolean;
  canSuspendUser:           boolean;

  // Verifications
  canViewVerifications:     boolean;
  canApproveVerification:   boolean;
  canRejectVerification:    boolean;

  // Jobs
  canViewJobs:              boolean;
  canDeleteJob:             boolean;
  canFlagJob:               boolean;

  // TAS Management
  canViewTas:               boolean;
  canManageTas:             boolean;
  canAdjustTasTier:         boolean;

  // Payments & Payouts
  canViewPayments:          boolean;
  canProcessPayouts:        boolean;
  canRejectPayouts:         boolean;

  // Disputes
  canViewDisputes:          boolean;
  canResolveDisputes:       boolean;

  // Reports
  canViewReports:           boolean;
  canExportReports:         boolean;

  // Announcements & Banners
  canViewAnnouncements:     boolean;
  canManageAnnouncements:   boolean;

  // Notifications
  canViewNotifications:     boolean;
  canManageNotifications:   boolean;

  // Settings
  canViewSettings:          boolean;
  canManageSettings:        boolean;

  // Commission
  canViewCommission:        boolean;
  canManageCommission:      boolean;

  // FAQ
  canViewFaq:               boolean;
  canManageFaq:             boolean;

  // Admin management
  canViewAdmins:            boolean;
  canCreateAdmin:           boolean;
  canDeleteAdmin:           boolean;
  canManageRoles:           boolean;

  // Audit logs
  canViewAuditLogs:         boolean;
  canExportAuditLogs:       boolean;
}

// ── Permission definitions per role ───────────────────────

const PERMISSION_MAP: Record<AdminRole, Permissions> = {

  // ── Super Admin — full access ─────────────────────────
  admin: {
    canViewDashboard:         true,
    canViewUsers:             true,
    canCreateUser:            true,
    canEditUser:              true,
    canDeleteUser:            true,
    canSuspendUser:           true,
    canViewVerifications:     true,
    canApproveVerification:   true,
    canRejectVerification:    true,
    canViewJobs:              true,
    canDeleteJob:             true,
    canFlagJob:               true,
    canViewTas:               true,
    canManageTas:             true,
    canAdjustTasTier:         true,
    canViewPayments:          true,
    canProcessPayouts:        true,
    canRejectPayouts:         true,
    canViewDisputes:          true,
    canResolveDisputes:       true,
    canViewReports:           true,
    canExportReports:         true,
    canViewAnnouncements:     true,
    canManageAnnouncements:   true,
    canViewNotifications:     true,
    canManageNotifications:   true,
    canViewSettings:          true,
    canManageSettings:        true,
    canViewCommission:        true,
    canManageCommission:      true,
    canViewFaq:               true,
    canManageFaq:             true,
    canViewAdmins:            true,
    canCreateAdmin:           true,
    canDeleteAdmin:           true,
    canManageRoles:           true,
    canViewAuditLogs:         true,
    canExportAuditLogs:       true,
  },

  // ── Verification Officer ──────────────────────────────
  verification: {
    canViewDashboard:         true,
    canViewUsers:             true,
    canCreateUser:            false,
    canEditUser:              false,
    canDeleteUser:            false,
    canSuspendUser:           false,
    canViewVerifications:     true,
    canApproveVerification:   true,
    canRejectVerification:    true,
    canViewJobs:              true,
    canDeleteJob:             false,
    canFlagJob:               false,
    canViewTas:               true,
    canManageTas:             false,
    canAdjustTasTier:         false,
    canViewPayments:          false,
    canProcessPayouts:        false,
    canRejectPayouts:         false,
    canViewDisputes:          false,
    canResolveDisputes:       false,
    canViewReports:           false,
    canExportReports:         false,
    canViewAnnouncements:     false,
    canManageAnnouncements:   false,
    canViewNotifications:     false,
    canManageNotifications:   false,
    canViewSettings:          false,
    canManageSettings:        false,
    canViewCommission:        false,
    canManageCommission:      false,
    canViewFaq:               false,
    canManageFaq:             false,
    canViewAdmins:            false,
    canCreateAdmin:           false,
    canDeleteAdmin:           false,
    canManageRoles:           false,
    canViewAuditLogs:         false,
    canExportAuditLogs:       false,
  },

  // ── Finance Admin ─────────────────────────────────────
  finance: {
    canViewDashboard:         true,
    canViewUsers:             true,
    canCreateUser:            false,
    canEditUser:              false,
    canDeleteUser:            false,
    canSuspendUser:           false,
    canViewVerifications:     false,
    canApproveVerification:   false,
    canRejectVerification:    false,
    canViewJobs:              true,
    canDeleteJob:             false,
    canFlagJob:               false,
    canViewTas:               true,
    canManageTas:             false,
    canAdjustTasTier:         false,
    canViewPayments:          true,
    canProcessPayouts:        true,
    canRejectPayouts:         true,
    canViewDisputes:          true,
    canResolveDisputes:       false,
    canViewReports:           true,
    canExportReports:         true,
    canViewAnnouncements:     false,
    canManageAnnouncements:   false,
    canViewNotifications:     false,
    canManageNotifications:   false,
    canViewSettings:          false,
    canManageSettings:        false,
    canViewCommission:        true,
    canManageCommission:      true,
    canViewFaq:               false,
    canManageFaq:             false,
    canViewAdmins:            false,
    canCreateAdmin:           false,
    canDeleteAdmin:           false,
    canManageRoles:           false,
    canViewAuditLogs:         true,
    canExportAuditLogs:       true,
  },

  // ── Support Admin ─────────────────────────────────────
  support: {
    canViewDashboard:         true,
    canViewUsers:             true,
    canCreateUser:            false,
    canEditUser:              false,
    canDeleteUser:            false,
    canSuspendUser:           true,
    canViewVerifications:     false,
    canApproveVerification:   false,
    canRejectVerification:    false,
    canViewJobs:              true,
    canDeleteJob:             false,
    canFlagJob:               true,
    canViewTas:               false,
    canManageTas:             false,
    canAdjustTasTier:         false,
    canViewPayments:          false,
    canProcessPayouts:        false,
    canRejectPayouts:         false,
    canViewDisputes:          true,
    canResolveDisputes:       true,
    canViewReports:           false,
    canExportReports:         false,
    canViewAnnouncements:     true,
    canManageAnnouncements:   false,
    canViewNotifications:     true,
    canManageNotifications:   false,
    canViewSettings:          false,
    canManageSettings:        false,
    canViewCommission:        false,
    canManageCommission:      false,
    canViewFaq:               true,
    canManageFaq:             true,
    canViewAdmins:            false,
    canCreateAdmin:           false,
    canDeleteAdmin:           false,
    canManageRoles:           false,
    canViewAuditLogs:         false,
    canExportAuditLogs:       false,
  },

  // ── View Only ─────────────────────────────────────────
  view: {
    canViewDashboard:         true,
    canViewUsers:             true,
    canCreateUser:            false,
    canEditUser:              false,
    canDeleteUser:            false,
    canSuspendUser:           false,
    canViewVerifications:     true,
    canApproveVerification:   false,
    canRejectVerification:    false,
    canViewJobs:              true,
    canDeleteJob:             false,
    canFlagJob:               false,
    canViewTas:               true,
    canManageTas:             false,
    canAdjustTasTier:         false,
    canViewPayments:          true,
    canProcessPayouts:        false,
    canRejectPayouts:         false,
    canViewDisputes:          true,
    canResolveDisputes:       false,
    canViewReports:           true,
    canExportReports:         false,
    canViewAnnouncements:     true,
    canManageAnnouncements:   false,
    canViewNotifications:     true,
    canManageNotifications:   false,
    canViewSettings:          true,
    canManageSettings:        false,
    canViewCommission:        true,
    canManageCommission:      false,
    canViewFaq:               true,
    canManageFaq:             false,
    canViewAdmins:            false,
    canCreateAdmin:           false,
    canDeleteAdmin:           false,
    canManageRoles:           false,
    canViewAuditLogs:         false,
    canExportAuditLogs:       false,
  },
};

// ── Exported helpers ──────────────────────────────────────

const VALID_ROLES = new Set<string>(["admin", "verification", "finance", "support", "view"]);

/** Coerces any raw string from the auth store to a valid AdminRole.
 *  Falls back to "view" (most restrictive) if the value is unknown. */
export const normaliseRole = (raw: string | null | undefined): AdminRole => {
  if (raw && VALID_ROLES.has(raw)) return raw as AdminRole;
  return "view";
};

/** Returns the full Permissions object for any raw role string. */
export const getPermissions = (raw: string | null | undefined): Permissions => {
  const role = normaliseRole(raw);
  return PERMISSION_MAP[role];
};