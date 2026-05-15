// app/(dashboard)/settings/types.ts

export type SettingsView =
  | "main"
  | "categories"
  | "faq"
  | "banners"
  | "announcements"
  | "commission"
  | "notifications";

// ── Categories ───────────────────────────────────────────
export interface SubCategory { name: string; icon: string; }
export interface Category {
  id: string;
  name: string;
  icon: string;
  subCategories: number;
  status: "Active" | "Draft";
  subs: SubCategory[];
}

export const initialCategories: Category[] = [
  { id: "cat-1", name: "Repair & Construction", icon: "🔧", subCategories: 5, status: "Active", subs: [{ name: "Plumbing", icon: "" }, { name: "Carpentry", icon: "" }, { name: "Painting", icon: "" }] },
  { id: "cat-2", name: "Moving Services",       icon: "📦", subCategories: 3, status: "Active", subs: [{ name: "Local Move", icon: "" }, { name: "Interstate", icon: "" }] },
  { id: "cat-3", name: "Auto Repair",           icon: "🔩", subCategories: 4, status: "Active", subs: [{ name: "Mechanic", icon: "" }, { name: "Car Wash", icon: "" }] },
  { id: "cat-4", name: "Housekeeping",          icon: "🧹", subCategories: 4, status: "Draft",  subs: [{ name: "Cleaning", icon: "" }, { name: "Laundry", icon: "" }] },
  { id: "cat-5", name: "Creativity",            icon: "🎨", subCategories: 5, status: "Active", subs: [{ name: "Photography", icon: "" }, { name: "Design", icon: "" }] },
  { id: "cat-6", name: "Designer",              icon: "👗", subCategories: 3, status: "Draft",  subs: [{ name: "Fashion", icon: "" }] },
];

// ── FAQ ──────────────────────────────────────────────────
export type FaqCategory = "All" | "Clients" | "Experts" | "TAS";
export interface Faq { id: string; question: string; category: Exclude<FaqCategory, "All">; }

export const initialFaqs: Faq[] = [
  { id: "f1", question: "How do i post a job?",            category: "Clients"  },
  { id: "f2", question: "How do i become an expert?",      category: "Experts"  },
  { id: "f3", question: "What is the TAS program?",        category: "TAS"      },
  { id: "f4", question: "How does payment protection work?", category: "Clients" },
];

// ── Banners ──────────────────────────────────────────────
export type BannerStatus = "Active" | "Offline";
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  dateRange: string;
  clicks: number;
  status: BannerStatus;
  image?: string;
}

export const initialBanners: Banner[] = [
  { id: "b1", title: "Get Multiple Offers in Minutes", subtitle: "Post your job and receive competitive bids from verified experts near you.", dateRange: "2026-04-01 - 2026-05-31", clicks: 1247, status: "Active" },
  { id: "b2", title: "Hire Verified Experts",          subtitle: "Work with trusted professionals reviewed by real users.",                   dateRange: "2026-04-01 - 2026-05-31", clicks: 980,  status: "Active" },
  { id: "b3", title: "100% Payment Protected",         subtitle: "Your money is safe until the job is done.",                                 dateRange: "2026-04-01 - 2026-05-31", clicks: 754,  status: "Active" },
  { id: "b4", title: "Post Your Job Free",             subtitle: "Describe what you need and get offers in less than 60 seconds",             dateRange: "2026-05-01 - 2026-05-31", clicks: 500,  status: "Offline"},
];

// ── Announcements ────────────────────────────────────────
export type AnnouncementStatus = "Sent" | "Scheduled" | "Draft";
export type AudienceType = "All users" | "Clients Only" | "Experts Only" | "TAS Only";
export interface Announcement {
  id: string;
  title: string;
  audience: AudienceType;
  date: string;
  status: AnnouncementStatus;
}

export const initialAnnouncements: Announcement[] = [
  { id: "a1", title: "New Category Added",  audience: "All users",  date: "25/03/2026", status: "Sent"      },
  { id: "a2", title: "TAS Program Launch",  audience: "TAS Only",   date: "20/03/2026", status: "Sent"      },
  { id: "a3", title: "Maintenance Notice",  audience: "All users",  date: "15/03/2026", status: "Scheduled" },
];

// ── Notification Templates ───────────────────────────────
export type TemplateKey = "New Bid Received" | "Job Accepted" | "Payment Released" | "Dispute Opened";
export interface NotificationTemplate {
  subject: string;
  body: string;
  fields: { label: string; placeholder: string }[];
}

export const notificationTemplates: Record<TemplateKey, NotificationTemplate> = {
  "New Bid Received": {
    subject: "New bid received for your job",
    body: 'Hello Sarah Okoro,\n\nYou have received a new bid from Adebayo Kunle for your job "Fix kitchen sink"',
    fields: [
      { label: "Bid amount:",   placeholder: "₦ 15,000"      },
      { label: "View all bids:", placeholder: "www.inSmartio" },
    ],
  },
  "Job Accepted": {
    subject: "Your bid has been accepted",
    body: "Hello {expert_name},\n\nYour bid for the job \"{job_title}\" has been accepted by {client_name}.",
    fields: [
      { label: "Job details:", placeholder: "www.inSmartio/jobs/{id}" },
    ],
  },
  "Payment Released": {
    subject: "Payment has been released",
    body: "Hello {expert_name},\n\nPayment of {amount} has been released to your account.",
    fields: [
      { label: "Amount:",      placeholder: "₦ 18,500"       },
      { label: "View wallet:", placeholder: "www.inSmartio"  },
    ],
  },
  "Dispute Opened": {
    subject: "A dispute has been opened on your job",
    body: "Hello {user_name},\n\nA dispute has been opened for job \"{job_title}\". Our team will review within 24 hours.",
    fields: [
      { label: "Case ID:",     placeholder: "CASE-001"        },
      { label: "View case:",   placeholder: "www.inSmartio"   },
    ],
  },
};

export const TEMPLATE_KEYS: TemplateKey[] = [
  "New Bid Received", "Job Accepted", "Payment Released", "Dispute Opened",
];