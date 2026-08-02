"use client";

import { useState } from "react";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch } from "@/hooks/redux";
import { addUser, fetchUsers } from "@/lib/redux/usersSlice";
import type { RegisterUserPayload } from "@/lib/api/usersApi";

import { Role, RoleSelector, StepBar } from "./Shared";
import ClientForm, { defaultClient, ClientFormState } from "./ClientForm";
import ExpertMultiStep, { defaultExpert, ExpertState, EXPERT_STEPS, validateExpertStep } from "./ExpertForm";
import TasMultiStep, { defaultTas, TasState, TAS_STEPS, validateTasStep } from "./TASForm";

interface AddUserModalProps { open: boolean; onClose: () => void; }

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const dispatch = useAppDispatch();

  const [stage,      setStage]      = useState<"role" | "form">("role");
  const [role,       setRole]       = useState<Role>("client");
  const [step,       setStep]       = useState(0);
  const [clientF,    setClientF]    = useState<ClientFormState>(defaultClient());
  const [expertF,    setExpertF]    = useState<ExpertState>(defaultExpert());
  const [tasF,       setTasF]       = useState<TasState>(defaultTas());
  const [showPw,     setShowPw]     = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const expertTotalSteps = EXPERT_STEPS.length;
  const tasTotalSteps    = TAS_STEPS.length;

  const reset = () => {
    setStage("role"); setStep(0);
    setClientF(defaultClient()); setExpertF(defaultExpert()); setTasF(defaultTas());
    setShowPw(false);
  };
  const handleClose      = () => { reset(); onClose(); };
  const handleRoleSelect = (r: Role) => { setRole(r); setStage("form"); setStep(0); };

  const warn = (msg: string) => toast.warning(msg);

  const handleNext = () => {
    if (role === "expert" && !validateExpertStep(expertF, step, warn)) return;
    if (role === "tas"    && !validateTasStep(tasF, step, warn))       return;
    setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = () => {
    let payload: RegisterUserPayload;

    if (role === "client") {
      const f = clientF;
      if (!f.name || !f.email || !f.password || !f.username) {
        toast.warning("Name, email, username and password are required"); return;
      }
      payload = {
        role: "client",
        name: f.name, email: f.email, username: f.username,
        phone: f.phone ? `+234${f.phone}` : "",
        password: f.password,
        avatar: f.avatar ?? undefined,
        location: {
          address: f.locationAddress || undefined,
          city:    f.locationCity    || undefined,
          state:   f.locationState   || undefined,
          country: f.locationCountry || undefined,
        },
      };

    } else if (role === "expert") {
      if (!validateExpertStep(expertF, step, warn)) return;
      const f = expertF;
      payload = {
        role: "expert",
        name: f.name, email: f.email, password: f.password,
        phone: f.phone ? `+234${f.phone}` : "",
        gender: f.gender as "male" | "female" | "other",
        bio: f.bio,
        referral:     f.referral     || undefined,
        verification: (f.verification as "tier1" | "tier2" | "tier3") || "tier1",
        paymentModel: (f.paymentModel as "protected" | "unprotected") || "protected",
        avatar:       f.avatar ?? undefined,
        category: f.categoryName ? [{ name: f.categoryName, sub: f.subCategories }] : [],
        skill: f.skillRole || f.skillExp || f.skillDesc || f.skillArea ? {
          role:        f.skillRole ? f.skillRole.split(",").map((r) => r.trim()).filter(Boolean) : undefined,
          experience:  f.skillExp.trim() !== "" && !isNaN(Number(f.skillExp)) && Number(f.skillExp) >= 0 ? Math.round(Number(f.skillExp)) : undefined,
          description: f.skillDesc || undefined,
          area:        f.skillArea || undefined,
        } : undefined,
        location: { country: f.country, state: f.state, city: f.city, area: f.area },
        bankDetails: {
          bankName:      f.bankName      || undefined,
          accountNumber: f.accountNumber || undefined,
          accountName:   f.accountName   || undefined,
          accountCode:   f.accountCode   || "0000",
          bvn:           f.bvn           || undefined,
        },
        services: f.services
          .filter((s) => s.catalogue && s.price)
          .map((s) => ({ catalogue: s.catalogue, price: Number(s.price) })),
        // Documents — file blobs with type and idNumber
        documentFiles: f.documents.map((d) => ({
          file:      d.file,
          type:      d.type,
          idNumber:  d.idNumber || null,
        })),
      } as RegisterUserPayload;

    } else {
      if (!validateTasStep(tasF, step, warn)) return;
      const f = tasF;
      const allCategories = [
        ...f.selectedCategories,
        ...(f.otherCategory.trim() ? [f.otherCategory.trim()] : []),
      ];
      payload = {
        role: "tas",
        name: f.name, email: f.email, username: f.username, password: f.password,
        phone: f.phone ? `+234${f.phone}` : "",
        gender: f.gender as "male" | "female" | "other",
        dateOfBirth: f.dateOfBirth ? new Date(f.dateOfBirth).toISOString() : "",
        applicationCode: "1234",
        category: allCategories,
        avatar: f.avatar ?? undefined,
        referralCode: f.referralCode || undefined,
        location: {
          address: f.address,
          area:    f.area    || undefined,
          city:    f.city    || undefined,
          state:   f.state   || undefined,
          country: f.country || undefined,
          tier:    f.tier    || undefined,
        },
        bankDetails: {
          bankName:      f.bankName      || undefined,
          accountNumber: f.accountNumber || undefined,
          accountName:   f.accountName   || undefined,
          bvn:           f.bvn           || undefined,
          accountCode:   f.accountCode   || "0000",
        },
        documentFiles: f.documents.map((d) => ({
          file:     d.file,
          type:     d.type,
          idNumber: d.idNumber || null,
        })),
        recruitExpectations: {
          hasRecruitmentExperience:         f.hasRecruitmentExp as "yes" | "no",
          recruitmentExperienceDescription: "",
          selectedCategories:               allCategories,
          recruitCountMonthly:              f.monthlyRecruitment,
          networkSize:                      f.monthlyRecruitment,
          years: f.hasRecruitmentExp === "no" ? "None" : "",
          area:  "",
        },
      };
    }

    setAddLoading(true);
    dispatch(addUser(payload as RegisterUserPayload))
      .unwrap()
      .then(() => { toast.success("User added successfully"); handleClose(); dispatch(fetchUsers()); })
      .catch((err: string) => toast.error("Failed to add user", { description: err }))
      .finally(() => setAddLoading(false));
  };

  const isExpertLast = role === "expert" && step === expertTotalSteps - 1;
  const isTasLast    = role === "tas"    && step === tasTotalSteps - 1;
  const isLastStep   = isExpertLast || isTasLast || role === "client";

  const title = stage === "role" ? "Select User Type"
    : role === "client" ? "Add Client"
    : role === "expert" ? `Add Expert — ${EXPERT_STEPS[step].label}`
    : `Add TAS — ${TAS_STEPS[step].label}`;

  const footer = stage === "role" ? undefined : (
    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
      <button onClick={stage === "form" && step > 0 ? handleBack : handleClose}
        style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #D1D5DB",
          backgroundColor: "var(--color-surface)", fontSize: "13px",
          cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
        {step > 0 ? <><ChevronLeft size={14} />Back</> : "Cancel"}
      </button>
      {isLastStep ? (
        <button onClick={handleSubmit} disabled={addLoading}
          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none",
            backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600,
            cursor: addLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: addLoading ? 0.7 : 1 }}>
          {addLoading ? <><Loader2 size={14} className="animate-spin" />Adding...</> : "Add User"}
        </button>
      ) : (
        <button onClick={handleNext}
          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none",
            backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          Next <ChevronRight size={14} />
        </button>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={handleClose} title={title} size="md" footer={footer}>
      {stage === "role" ? (
        <RoleSelector onSelect={handleRoleSelect} />
      ) : role === "client" ? (
        <ClientForm f={clientF} set={(k, v) => setClientF((p) => ({ ...p, [k]: v }))}
          showPw={showPw} setShowPw={setShowPw} />
      ) : role === "expert" ? (
        <>
          <StepBar steps={EXPERT_STEPS} current={step} />
          <ExpertMultiStep f={expertF} setF={setExpertF} step={step} />
        </>
      ) : (
        <>
          <StepBar steps={TAS_STEPS} current={step} />
          <TasMultiStep f={tasF} setF={setTasF} step={step} />
        </>
      )}
    </Modal>
  );
}