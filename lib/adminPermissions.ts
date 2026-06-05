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