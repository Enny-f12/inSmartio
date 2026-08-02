"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, CheckCircle2, User, FileText } from "lucide-react";
import { getBankList, resolveBankAccount, type BankListItem } from "@/lib/api/usersApi";

// ── Styles ────────────────────────────────────────────────
export const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid #D1D5DB", backgroundColor: "var(--color-background)",
  fontSize: "13px", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box",
};
export const lbl: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500,
  color: "var(--color-text-muted)", marginBottom: "5px",
};
export const row: React.CSSProperties   = { display: "flex", flexDirection: "column", gap: "4px" };
export const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" };

// ── Categories ────────────────────────────────────────────
export const CATEGORIES: Record<string, string[]> = {
  "Home Repair":              ["Plumbing Repairs","Electrical Repairs","Carpentry & Woodwork","Painting & Drywall Repair","Roofing & Gutter Repairs","HVAC & Appliance Repairs"],
  "Entertainment":            ["Movies & Cinema","Music","Television & Streaming","Gaming","Live Events & Shows","Celebrity & Pop Culture"],
  "Electrical Services":      ["Electrical Installation","Electrical Repairs","Lighting Services","Generator & Backup Power Systems","Panel & Circuit Breaker Services","Electrical Inspection & Maintenance"],
  "Web Development":          ["Website Design","Frontend Development","Backend Development","E-commerce Development","CMS Development","Website Maintenance & Support"],
  "Plumbing Services":        ["Leak Detection & Repair","Drain Cleaning","Pipe Installation & Replacement","Water Heater Services","Bathroom & Kitchen Plumbing","Emergency Plumbing Services"],
  "Legal Services":           ["Family Law","Corporate & Business Law","Real Estate Law","Criminal Defense","Immigration Law","Civil Litigation"],
  "Design Services":          ["Graphic Design","Web Design","Interior Design","Fashion Design","Product Design","Motion Graphics & Animation"],
  "Events Services":          ["Wedding Planning","Corporate Events","Birthday & Private Parties","Event Decoration & Styling","Catering Services","Entertainment & MC Services"],
  "Creative Services":        ["Graphic Design","Content Writing","Photography","Videography & Editing","Illustration & Digital Art","Animation & Motion Graphics"],
  "Repair & Construction":    ["Building Construction","Home Renovation & Remodeling","Masonry & Concrete Work","Roofing Services","Painting & Finishing","General Repairs & Maintenance"],
  "Photo & Videography":      ["Event Photography & Videography","Portrait Photography","Commercial Photography","Cinematic Videography","Editing & Post-Production","Drone & Aerial Coverage"],
  "Beauty Services":          ["Hair Styling & Care","Makeup Services","Skincare & Facials","Nail Care Services","Spa & Body Treatments","Barber Services"],
  "Computer & IT Services":   ["IT Support & Maintenance","Software Development","Network & Security Services","Hardware Services","Web & App Development","Data Services"],
  "Moving Services":          ["Residential Moving","Commercial Moving","Packing & Unpacking Services","Loading & Unloading Services","Local & Long-Distance Moving","Storage Services"],
  "Auto Repair (Automobile)": ["Engine Repair & Diagnostics","Brake & Suspension Services","Electrical & Battery Services","Transmission Services","Oil Change & Routine Maintenance","Body Work & Painting"],
  "Appliance Repair Services":["Refrigerator Repair","Washing Machine Repair","Air Conditioner Repair","Microwave Oven Repair","Television Repair","Small Appliance Repair"],
  "Housekeeping Services":    ["Residential Cleaning","Commercial Cleaning","Deep Cleaning Services","Laundry & Ironing Services","Sanitization & Disinfection","Janitorial Services"],
};
export const TAS_CATEGORIES = Object.keys(CATEGORIES);

// ── Document type options ─────────────────────────────────
export const EXPERT_DOC_TYPES = ["National ID", "Passport", "Utility Bill", "Driver's License", "Voter's Card"];

// TAS documents are fixed, named slots (mirroring the mobile app's "Required
// Documents" screen), not a free-form add-any-type list. The backend rejects
// registrations where the document count doesn't match the declared type
// count, so exact type strings + a 1-file-per-slot UI matter here.
export interface DocSlotDef { type: string; label: string; required: boolean; }

export const TAS_DOCUMENT_SLOTS: DocSlotDef[] = [
  { type: "NIN slip",         label: "NIN slip",         required: true },
  { type: "BVN consent",      label: "BVN consent",      required: true },
  { type: "Government ID",    label: "Government ID",    required: true },
  { type: "Guarantor form",   label: "Guarantor form",   required: false },
  { type: "Police clearance", label: "Police clearance", required: false },
];

// Kept for any code still referencing a flat list of TAS document types.
export const TAS_DOC_TYPES = TAS_DOCUMENT_SLOTS.map((s) => s.type);

// ── Document entry (file + type + idNumber) ───────────────
export interface DocEntry { file: File; type: string; idNumber: string; }

// ── Shared widgets ────────────────────────────────────────
export function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ padding: "10px 12px", borderRadius: "10px 0 0 10px", border: "1px solid #D1D5DB",
        borderRight: "none", fontSize: "13px", color: "var(--color-text-muted)",
        flexShrink: 0, backgroundColor: "var(--color-background)" }}>+234</div>
      <input style={{ ...inp, borderRadius: "0 10px 10px 0", borderLeft: "none" }}
        placeholder="801 234 5678" maxLength={10} value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))} />
    </div>
  );
}

export function DocListPicker({
  docs, onChange, typeOptions,
}: {
  docs: DocEntry[];
  onChange: (docs: DocEntry[]) => void;
  typeOptions: string[];
}) {
  const ref = useRef<HTMLInputElement>(null);

  const addDoc = (file: File) => {
    onChange([...docs, { file, type: typeOptions[0], idNumber: "" }]);
  };

  const removeDoc = (i: number) => {
    onChange(docs.filter((_, idx) => idx !== i));
  };

  const updateDoc = (i: number, field: "type" | "idNumber", value: string) => {
    const next = docs.map((d, idx) => idx === i ? { ...d, [field]: value } : d);
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {docs.map((doc, i) => (
        <div key={i} style={{ border: "1px solid #D1D5DB", borderRadius: "10px", padding: "12px",
          display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "var(--color-background)" }}>
          {/* File name row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#15803d", flex: 1, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file.name}</span>
            <button type="button" onClick={() => removeDoc(i)}
              style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fee2e2",
                border: "none", cursor: "pointer", padding: 0, flexShrink: 0, color: "#dc2626",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
              ✕
            </button>
          </div>
          {/* Type + ID number */}
          <div style={grid2}>
            <div style={row}>
              <label style={lbl}>Document Type</label>
              <select style={inp} value={doc.type} onChange={(e) => updateDoc(i, "type", e.target.value)}>
                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={row}>
              <label style={lbl}>ID Number (optional)</label>
              <input style={inp} placeholder="e.g. A12345678" value={doc.idNumber}
                onChange={(e) => updateDoc(i, "idNumber", e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      {/* Add file button */}
      <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addDoc(f); e.target.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "9px 14px", borderRadius: "10px", border: "1px dashed #D1D5DB",
          backgroundColor: "var(--color-background)", fontSize: "12px", color: "#6B7280",
          cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
        <Upload size={13} /> Add Document
      </button>
    </div>
  );
}

/**
 * Fixed set of named document upload slots (NIN slip, BVN consent, Government
 * ID, plus optional Guarantor form / Police clearance for Tier 3), matching
 * the mobile app's "Required Documents" screen. Unlike DocListPicker, the
 * admin can't add arbitrary types or duplicates — each slot holds at most one
 * file, so the resulting `documents` array is always exactly one entry per
 * declared type, which is what the backend enforces.
 */
export function FixedDocSlots({
  slots, docs, onChange,
}: {
  slots:    DocSlotDef[];
  docs:     DocEntry[];
  onChange: (docs: DocEntry[]) => void;
}) {
  const fileFor = (type: string) => docs.find((d) => d.type === type);

  const setFile = (type: string, file: File) => {
    onChange([...docs.filter((d) => d.type !== type), { file, type, idNumber: "" }]);
  };

  const removeFile = (type: string) => {
    onChange(docs.filter((d) => d.type !== type));
  };

  let printedOptionalHeader = false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {slots.map((slot, i) => {
        const doc = fileFor(slot.type);
        const inputId = `tas-doc-slot-${i}`;
        const showOptionalHeader = !slot.required && !printedOptionalHeader;
        // eslint-disable-next-line react-hooks/immutability
        if (showOptionalHeader) printedOptionalHeader = true;

        return (
          <div key={slot.type}>
            {showOptionalHeader && (
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 8px" }}>
                Optional (for Tier 3 eligibility):
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
              border: "1px solid #D1D5DB", borderRadius: "10px", padding: "12px 14px",
              backgroundColor: "var(--color-background)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <FileText size={18} color={doc ? "#16a34a" : "#2563EB"} style={{ flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: "13px", color: "var(--color-text-main)" }}>
                    {slot.label}{slot.required && <span style={{ color: "#dc2626" }}> *</span>}
                  </span>
                  {doc && (
                    <span style={{ fontSize: "11px", color: "#15803d", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                      {doc.file.name}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <input id={inputId} type="file" accept="image/*,.pdf" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(slot.type, f); e.target.value = ""; }} />
                <label htmlFor={inputId} style={{ display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 12px", borderRadius: "8px", backgroundColor: "#EFF6FF",
                  color: "#2563EB", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Upload size={13} /> {doc ? "Replace" : "Upload"}
                </label>
                {doc && (
                  <button type="button" onClick={() => removeFile(slot.type)}
                    style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#fee2e2",
                      border: "none", cursor: "pointer", padding: 0, color: "#dc2626", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AvatarPick({ picked, onPick }: { picked: File | null; onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = picked ? URL.createObjectURL(picked) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{ width: "90px", height: "90px", borderRadius: "50%", border: "2px dashed #D1D5DB",
          backgroundColor: "var(--color-background)", cursor: "pointer", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <User size={32} color="#9CA3AF" />}
      </button>
      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
        {picked ? picked.name : "Tap to upload photo"}
      </span>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────
export function StepBar({ steps, current }: { steps: { label: string; icon: React.ReactNode }[]; current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              backgroundColor: i < current ? "#16a34a" : i === current ? "#2563EB" : "#E5E7EB",
              color: i <= current ? "#fff" : "#9CA3AF",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600,
            }}>
              {i < current ? <CheckCircle2 size={16} /> : s.icon}
            </div>
            <span style={{ fontSize: "10px", color: i === current ? "#2563EB" : "var(--color-text-muted)",
              fontWeight: i === current ? 600 : 400, whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: "2px", backgroundColor: i < current ? "#16a34a" : "#E5E7EB",
              margin: "0 6px", marginBottom: "14px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Role type ─────────────────────────────────────────────
export type Role = "client" | "expert" | "tas";

// ── Role Selector ─────────────────────────────────────────
export function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
  const roles: { value: Role; label: string; desc: string }[] = [
    { value: "client", label: "Client",  desc: "Can post jobs and hire experts" },
    { value: "expert", label: "Expert",  desc: "Provides services on the platform" },
    { value: "tas",    label: "TAS",     desc: "Talent Acquisition Specialist" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>Select the type of user to create:</p>
      {roles.map((r) => (
        <button key={r.value} onClick={() => onSelect(r.value)}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",
            padding: "14px 16px", borderRadius: "12px", border: "1px solid #D1D5DB",
            backgroundColor: "var(--color-background)", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{r.label}</span>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{r.desc}</span>
        </button>
      ))}
    </div>
  );
}

// ── Google Places Autocomplete ─────────────────────────────
// Loads the Maps JS API (places library) once, lazily, and reuses it across
// every AddressAutocomplete instance on the page.

declare global {
  interface Window {
    // Loosely typed — @types/google.maps isn't installed, and we only touch
    // a handful of Places Autocomplete APIs here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

let mapsLoadPromise: Promise<void> | null = null;

// Google appends its suggestion dropdown (.pac-container) directly to <body>
// with its own z-index. Inside a modal/dialog, that can end up rendering
// BELOW the modal's overlay — the suggestions exist but are invisible.
// This pushes it above anything reasonable a modal would use.
function ensurePacContainerZIndex() {
  if (typeof document === "undefined") return;
  if (document.getElementById("pac-container-zfix")) return;
  const style = document.createElement("style");
  style.id = "pac-container-zfix";
  style.textContent = `.pac-container { z-index: 999999 !important; }`;
  document.head.appendChild(style);
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  ensurePacContainerZIndex();
  if (window.google?.maps?.places) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")));
      return;
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

export interface LocationValue {
  address: string;
  area?:    string;
  city?:    string;
  state?:   string;
  country?: string;
  lat?:     number;
  lng?:     number;
}

/**
 * Plain text input backed by Google Places Autocomplete. No map is rendered —
 * this is address-verification-by-suggestion only. Falls back to a normal
 * free-text input if the Maps script fails to load (e.g. missing/invalid key),
 * so the form never gets stuck.
 */
export function AddressAutocomplete({
  value, onSelect, placeholder = "Start typing an address…",
}: {
  value:       string;
  onSelect:    (loc: LocationValue) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText]   = useState(value);
  const [ready, setReady] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setText(value); }, [value]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { /* Maps failed to load — input still works as free text */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "address_components", "geometry"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place) return;

       
      const comps: { long_name: string; types: string[] }[] = place.address_components ?? [];
      const find = (type: string) => comps.find((c) => c.types.includes(type))?.long_name;

      const loc: LocationValue = {
        address: place.formatted_address ?? inputRef.current?.value ?? "",
        // "Area" (e.g. "Opebi", "Yaba") maps most closely to Google's
        // sublocality / neighborhood components — there's no dedicated
        // "area" type in the Places API.
        area:    find("sublocality_level_1") || find("sublocality") || find("neighborhood"),
        city:    find("locality") || find("administrative_area_level_2"),
        state:   find("administrative_area_level_1"),
        country: find("country"),
        lat:     place.geometry?.location?.lat?.(),
        lng:     place.geometry?.location?.lng?.(),
      };
      setText(loc.address);
      onSelect(loc);
    });

    return () => {
      window.google?.maps?.event?.removeListener(listener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <input
      ref={inputRef}
      style={inp}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onSelect({ address: e.target.value });
      }}
    />
  );
}

// ── Bank details + account resolution ──────────────────────
// Shared by any multi-step form (TAS, Expert…) that needs to collect bank
// details and verify the account name via the backend's resolve-bank
// endpoint, matching the mobile app's "Verify Account details" flow.

export interface BankDetailsPatch {
  bankName?:      string;
  bankCode?:      string;
  accountNumber?: string;
  accountName?:   string;
}

interface BankDetailsFieldsProps {
  bankName:      string;
  bankCode?:     string;
  accountNumber: string;
  accountName:   string;
  onChange:      (patch: BankDetailsPatch) => void;
}

export function BankDetailsFields({
  bankCode, accountNumber, accountName, onChange,
}: BankDetailsFieldsProps) {
  const [banks, setBanks]           = useState<BankListItem[]>([]);
  const [loadingBanks, setLoading]  = useState(true);
  const [verifying, setVerifying]   = useState(false);
  const [verified, setVerified]     = useState(!!accountName);
  const [error, setError]           = useState<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    let cancelled = false;
    getBankList()
      .then((list) => { if (!cancelled) setBanks(list); })
      .catch(() => { /* dropdown just falls back to "Select Bank" only */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Any change to bank or account number invalidates a previous verification —
  // mirrors the mobile app, where editing either field clears "Account Verified".
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    setVerified(false);
    setError(null);
    if (accountName) onChange({ accountName: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, accountNumber]);

  const canVerify = !!bankCode && accountNumber.length === 10 && !verifying;

  const handleVerify = async () => {
    if (!bankCode) return;
    setVerifying(true);
    setError(null);
    try {
      const resolved = await resolveBankAccount(accountNumber, bankCode);
      if (!resolved.accountName) throw new Error("No account name returned");
      onChange({ accountName: resolved.accountName });
      setVerified(true);
    } catch {
      setError("Could not verify this account. Check the number and bank, then try again.");
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={row}>
        <label style={lbl}>Bank Name</label>
        <select
          style={inp}
          value={bankCode ?? ""}
          onChange={(e) => {
            const code = e.target.value;
            const bank = banks.find((b) => b.code === code);
            onChange({ bankCode: code, bankName: bank?.name ?? "" });
          }}
        >
          <option value="">{loadingBanks ? "Loading banks…" : "Select Bank"}</option>
          {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
      </div>

      <div style={row}>
        <label style={lbl}>Account Number</label>
        <input
          style={inp}
          placeholder="0123456789"
          maxLength={10}
          value={accountNumber}
          onChange={(e) => onChange({ accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
        />
      </div>

      {verified && accountName ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          padding: "10px 14px", borderRadius: "10px", backgroundColor: "#DCFCE7",
          color: "#15803d", fontSize: "13px", fontWeight: 600 }}>
          <CheckCircle2 size={15} /> Account Verified
        </div>
      ) : (
        <button
          type="button"
          disabled={!canVerify}
          onClick={handleVerify}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "none",
            backgroundColor: canVerify ? "#EFF6FF" : "#F3F4F6",
            color: canVerify ? "#2563EB" : "#9CA3AF",
            fontSize: "13px", fontWeight: 600,
            cursor: canVerify ? "pointer" : "not-allowed" }}
        >
          {verifying ? "Verifying…" : "Verify Account Details"}
        </button>
      )}

      {error && <span style={{ fontSize: "12px", color: "#dc2626" }}>{error}</span>}

      <div style={row}>
        <label style={lbl}>Account Name</label>
        <input
          style={{ ...inp, backgroundColor: "#F3F4F6", color: "var(--color-text-muted)" }}
          placeholder="Auto-filled after verification"
          value={accountName}
          readOnly
        />
      </div>
    </div>
  );
}