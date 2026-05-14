// ── Types ──────────────────────────────────────────────────
export type AppStatus   = "Approved" | "Pending" | "Rejected";
export type AgentStatus = "Active" | "Suspended";
export type TASTab      = "Applications" | "Active TAS Agents";

export interface Application {
  id: string;
  name: string;
  fullName: string;
  phone: string;
  email: string;
  type: "Expert TAS" | "Dedicated";
  expertId: string;
  expertRating: number;
  jobsCompleted: number;
  submitted: string;
  network: string;
  status: AppStatus;
  recruitmentExperience: string;
  networkSize: string;
  categories: string;
  whyTas: string;
  documents: { name: string; status: "Verified" | "Pending" }[];
}

export interface RecruitedExpert {
  name: string;
  earningsHistory: string;
  subTas: AgentStatus;
  payouts: string;
  notes: string;
}

export interface ActiveAgent {
  id: string;
  name: string;
  fullName: string;
  tasId: string;
  phone: string;
  email: string;
  tier: number;
  tierLabel: string;
  bonus: string;
  joined: string;
  status: AgentStatus;
  experts: number;
  earnings: string;
  activeExperts: number;
  totalEarnings: string;
  thisMonth: string;
  availableBalance: string;
  pendingBalance: string;
  recruitedExperts: RecruitedExpert[];
}

// ── Constants ──────────────────────────────────────────────
export const TAS_TIERS = [
  "Tier 1 (Associate, 0% bonus)",
  "Tier 2 (Senior, +5% bonus)",
  "Tier 3 (Master, +10% bonus)",
  "Tier 4 (Regional Lead, +12% bonus)",
  "Tier 5 (National Director, +15% bonus)",
  "Tier 6 (Elite Ambassador, +20% bonus)",
] as const;

export const PAGE_SIZE = 10;

// ── Mock Data ──────────────────────────────────────────────
export const mockApplications: Application[] = [
  {
    id: "app-1", name: "Peter O.", fullName: "Peter Okafor",
    phone: "+234 801 234 5678", email: "peter@email.com",
    type: "Expert TAS", expertId: "EXP-12345", expertRating: 4.9,
    jobsCompleted: 45, submitted: "25/03/2026", network: "50+",
    status: "Approved",
    recruitmentExperience: "I have recruited 10+ plumbers locally",
    networkSize: "50+ skilled professionals",
    categories: "Repair & Construction, Auto Repair, Housekeeping",
    whyTas: "I want to help my community members find work",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
    ],
  },
  {
    id: "app-2", name: "Mary K.", fullName: "Mary Kalu",
    phone: "+234 802 345 6789", email: "mary@email.com",
    type: "Dedicated", expertId: "EXP-22222", expertRating: 4.7,
    jobsCompleted: 30, submitted: "24/03/2026", network: "100+",
    status: "Pending",
    recruitmentExperience: "Managed a team of 15 cleaners for 2 years",
    networkSize: "100+ skilled professionals",
    categories: "Cleaning, Housekeeping",
    whyTas: "I believe in structured community growth",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Pending" },
    ],
  },
  {
    id: "app-3", name: "John D.", fullName: "John Dada",
    phone: "+234 803 456 7890", email: "john@email.com",
    type: "Expert TAS", expertId: "EXP-33333", expertRating: 4.8,
    jobsCompleted: 60, submitted: "23/03/2026", network: "25+",
    status: "Approved",
    recruitmentExperience: "Recruited 5 electricians in my area",
    networkSize: "25+ professionals",
    categories: "Electrical, Plumbing",
    whyTas: "I want to expand my network and earn more",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
    ],
  },
  {
    id: "app-4", name: "Ngozi E.", fullName: "Ngozi Eze",
    phone: "+234 804 567 8901", email: "ngozi@email.com",
    type: "Dedicated", expertId: "EXP-44444", expertRating: 4.5,
    jobsCompleted: 22, submitted: "22/03/2026", network: "200+",
    status: "Rejected",
    recruitmentExperience: "I run a community group with 200 members",
    networkSize: "200+ community members",
    categories: "General Services",
    whyTas: "I want to monetise my community connections",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
    ],
  },
  {
    id: "app-5", name: "John D.", fullName: "John Doe",
    phone: "+234 805 678 9012", email: "johndoe@email.com",
    type: "Expert TAS", expertId: "EXP-55555", expertRating: 4.6,
    jobsCompleted: 38, submitted: "21/03/2026", network: "150+",
    status: "Approved",
    recruitmentExperience: "Recruited plumbers and carpenters across 3 LGAs",
    networkSize: "150+ professionals",
    categories: "Repair & Construction, Carpentry",
    whyTas: "Building a sustainable network in my LGA",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
    ],
  },
  {
    id: "app-6", name: "James O.", fullName: "James Ojo",
    phone: "+234 806 789 0123", email: "james@email.com",
    type: "Dedicated", expertId: "EXP-66666", expertRating: 4.3,
    jobsCompleted: 18, submitted: "20/03/2026", network: "70+",
    status: "Rejected",
    recruitmentExperience: "Managed informal labour pool for 1 year",
    networkSize: "70+ workers",
    categories: "Cleaning, General Services",
    whyTas: "To formalise my existing network",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Pending" },
    ],
  },
  {
    id: "app-7", name: "Mayowa S.", fullName: "Mayowa Sanni",
    phone: "+234 807 890 1234", email: "mayowa@email.com",
    type: "Expert TAS", expertId: "EXP-77777", expertRating: 4.7,
    jobsCompleted: 52, submitted: "19/03/2026", network: "40+",
    status: "Pending",
    recruitmentExperience: "Recruited 8 plumbers across Lagos",
    networkSize: "40+ professionals",
    categories: "Plumbing, Electrical",
    whyTas: "Passionate about skilled labour empowerment",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
    ],
  },
  {
    id: "app-8", name: "Chidi O.", fullName: "Chidi Obi",
    phone: "+234 808 901 2345", email: "chidi@email.com",
    type: "Expert TAS", expertId: "EXP-88888", expertRating: 4.9,
    jobsCompleted: 70, submitted: "17/03/2026", network: "230+",
    status: "Approved",
    recruitmentExperience: "Built the largest informal plumbing network in Owerri",
    networkSize: "230+ professionals",
    categories: "Plumbing, Repair & Construction",
    whyTas: "Scale the network nationally",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
    ],
  },
];

export const mockAgents: ActiveAgent[] = [
  {
    id: "agent-1", name: "Peter O.", fullName: "Peter Okafor",
    tasId: "TAS-20260301-01", phone: "+234 801 234 5678", email: "peter@email.com",
    tier: 1, tierLabel: "Associate", bonus: "+0%", joined: "01/03/2026",
    status: "Active", experts: 245, earnings: "₦100K",
    activeExperts: 220, totalEarnings: "₦1,250,000", thisMonth: "₦245,000",
    availableBalance: "₦180,000", pendingBalance: "₦65,000",
    recruitedExperts: [
      { name: "Adebayo S.", earningsHistory: "Model 2", subTas: "Active",    payouts: "₦4,800", notes: "earned for TAS" },
      { name: "Funke A.",   earningsHistory: "Model 1", subTas: "Active",    payouts: "₦3,000", notes: "earned for TAS" },
      { name: "Chinedu O.", earningsHistory: "Model 2", subTas: "Suspended", payouts: "₦1,200", notes: "earned for TAS" },
    ],
  },
  {
    id: "agent-2", name: "Chidi E.", fullName: "Chidi Eze",
    tasId: "TAS-20260301-02", phone: "+234 801 234 5678", email: "chidi@email.com",
    tier: 4, tierLabel: "Regional Lead", bonus: "+12%", joined: "01/03/2026",
    status: "Active", experts: 189, earnings: "₦890K",
    activeExperts: 170, totalEarnings: "₦890,000", thisMonth: "₦120,000",
    availableBalance: "₦95,000", pendingBalance: "₦25,000",
    recruitedExperts: [
      { name: "Emeka O.", earningsHistory: "Model 1", subTas: "Active",    payouts: "₦2,500", notes: "earned for TAS" },
      { name: "Grace A.", earningsHistory: "Model 2", subTas: "Active",    payouts: "₦3,800", notes: "earned for TAS" },
      { name: "John D.",  earningsHistory: "Model 1", subTas: "Suspended", payouts: "₦900",   notes: "earned for TAS" },
    ],
  },
  {
    id: "agent-3", name: "Bola A.", fullName: "Bola Adeyemi",
    tasId: "TAS-20260301-03", phone: "+234 803 333 3333", email: "bola@email.com",
    tier: 3, tierLabel: "Master", bonus: "+10%", joined: "01/03/2026",
    status: "Active", experts: 156, earnings: "₦750K",
    activeExperts: 140, totalEarnings: "₦750,000", thisMonth: "₦98,000",
    availableBalance: "₦70,000", pendingBalance: "₦28,000",
    recruitedExperts: [
      { name: "Mary K.",  earningsHistory: "Model 2", subTas: "Active", payouts: "₦3,100", notes: "earned for TAS" },
      { name: "Peter O.", earningsHistory: "Model 1", subTas: "Active", payouts: "₦2,200", notes: "earned for TAS" },
    ],
  },
  {
    id: "agent-4", name: "Emeka O.", fullName: "Emeka Okafor",
    tasId: "TAS-20260301-04", phone: "+234 804 444 4444", email: "emeka@email.com",
    tier: 2, tierLabel: "Senior", bonus: "+5%", joined: "05/03/2026",
    status: "Active", experts: 89, earnings: "₦340K",
    activeExperts: 80, totalEarnings: "₦340,000", thisMonth: "₦45,000",
    availableBalance: "₦30,000", pendingBalance: "₦15,000",
    recruitedExperts: [
      { name: "Ngozi E.", earningsHistory: "Model 1", subTas: "Active", payouts: "₦1,800", notes: "earned for TAS" },
    ],
  },
  {
    id: "agent-5", name: "Funke A.", fullName: "Funke Adeyemi",
    tasId: "TAS-20260301-05", phone: "+234 805 555 5555", email: "funke@email.com",
    tier: 2, tierLabel: "Senior", bonus: "+5%", joined: "08/03/2026",
    status: "Active", experts: 67, earnings: "₦280K",
    activeExperts: 60, totalEarnings: "₦280,000", thisMonth: "₦38,000",
    availableBalance: "₦25,000", pendingBalance: "₦13,000",
    recruitedExperts: [
      { name: "James O.", earningsHistory: "Model 2", subTas: "Active", payouts: "₦2,000", notes: "earned for TAS" },
    ],
  },
  {
    id: "agent-6", name: "Grace A.", fullName: "Grace Adeleke",
    tasId: "TAS-20260301-06", phone: "+234 806 666 6666", email: "grace@email.com",
    tier: 3, tierLabel: "Master", bonus: "+10%", joined: "10/03/2026",
    status: "Active", experts: 90, earnings: "₦1.2M",
    activeExperts: 85, totalEarnings: "₦1,200,000", thisMonth: "₦180,000",
    availableBalance: "₦150,000", pendingBalance: "₦30,000",
    recruitedExperts: [
      { name: "Tunde A.",  earningsHistory: "Model 2", subTas: "Active", payouts: "₦5,000", notes: "earned for TAS" },
      { name: "Chioma K.", earningsHistory: "Model 1", subTas: "Active", payouts: "₦2,800", notes: "earned for TAS" },
    ],
  },
  {
    id: "agent-7", name: "Mary S.", fullName: "Mary Sani",
    tasId: "TAS-20260301-07", phone: "+234 807 777 7777", email: "marys@email.com",
    tier: 1, tierLabel: "Associate", bonus: "+0%", joined: "15/03/2026",
    status: "Active", experts: 20, earnings: "₦180K",
    activeExperts: 18, totalEarnings: "₦180,000", thisMonth: "₦22,000",
    availableBalance: "₦18,000", pendingBalance: "₦4,000",
    recruitedExperts: [
      { name: "Adeola B.", earningsHistory: "Model 1", subTas: "Active", payouts: "₦1,200", notes: "earned for TAS" },
    ],
  },
  {
    id: "agent-8", name: "Mayowa O.", fullName: "Mayowa Ogun",
    tasId: "TAS-20260301-08", phone: "+234 808 888 8888", email: "mayowao@email.com",
    tier: 2, tierLabel: "Senior", bonus: "+5%", joined: "18/03/2026",
    status: "Active", experts: 30, earnings: "₦300K",
    activeExperts: 28, totalEarnings: "₦300,000", thisMonth: "₦40,000",
    availableBalance: "₦32,000", pendingBalance: "₦8,000",
    recruitedExperts: [
      { name: "John D.",  earningsHistory: "Model 2", subTas: "Active", payouts: "₦1,600", notes: "earned for TAS" },
      { name: "Mary K.", earningsHistory: "Model 1", subTas: "Active", payouts: "₦1,100", notes: "earned for TAS" },
    ],
  },
];