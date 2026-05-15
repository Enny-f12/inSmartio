// components/verifications/types.ts

export type Tier = "Tier 1" | "Tier 2" | "Tier 3";
export type VerifStatus = "Pending" | "Approved" | "Rejected";

export interface VerifDocument {
  name: string;
  status: "Verified" | "Pending";
}

export interface Expert {
  id: number;
  name: string;
  phone: string;
  email: string;
  appliedTier: Tier;
  submitted: string;
  verificationFee?: string;
  feePaidOn?: string;
  status: VerifStatus;
  docsTotal: number;
  docsVerified: number;
  documents: VerifDocument[];
  nin?: {
    number: string;
    status: "Verified" | "Pending";
    nameMatch: boolean;
    dobMatch: boolean;
  };
  guarantor?: {
    name: string;
    phone: string;
    occupation: string;
    status: string;
  };
  policeClearance?: {
    certificate: string;
    issued: string;
    issuingState: string;
  };
}