"use client";

import { Eye, EyeOff } from "lucide-react";
import { inp, lbl, row, PhoneInput, AvatarPick } from "./Shared";

export interface ClientFormState {
  name: string; email: string; username: string; phone: string; password: string;
  avatar: File | null;
}

export const defaultClient = (): ClientFormState => ({
  name: "", email: "", username: "", phone: "", password: "",
  avatar: null,
});

interface ClientFormProps {
  f: ClientFormState;
  set: (k: keyof ClientFormState, v: unknown) => void;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
}

export default function ClientForm({ f, set, showPw, setShowPw }: ClientFormProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <AvatarPick picked={f.avatar} onPick={(file) => set("avatar", file)} />
      <div style={row}><label style={lbl}>Full Name *</label>
        <input style={inp} placeholder="John Doe" value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Email *</label>
        <input style={inp} type="email" placeholder="user@email.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Username *</label>
        <input style={inp} placeholder="johndoe" value={f.username} onChange={(e) => set("username", e.target.value)} />
      </div>
      <div style={row}><label style={lbl}>Phone</label>
        <PhoneInput value={f.phone} onChange={(v) => set("phone", v)} />
      </div>
      <div style={row}><label style={lbl}>Password *</label>
        <div style={{ position: "relative" }}>
          <input style={{ ...inp, paddingRight: "40px" }} type={showPw ? "text" : "password"}
            placeholder="StrongPass123!" value={f.password} onChange={(e) => set("password", e.target.value)} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}