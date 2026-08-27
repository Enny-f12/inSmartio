// components/auth/ResetPasswordScreen.tsx
"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, Check, X, KeyRound } from "lucide-react";
import { forgotPassword, resetPassword } from "@/lib/api/authApi";


interface Props {
  onGoToLogin?: () => void;

  id?: string;
}

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
];

function RuleRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
        ok ? "text-emerald-600" : "text-gray-400"
      }`}
    >
      <span className="transition-transform duration-200" style={{ transform: ok ? "scale(1.05)" : "scale(1)" }}>
        {ok ? <Check size={13} /> : <X size={13} className="text-gray-300" />}
      </span>
      {label}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  show,
  onToggleShow,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
}) {
  return (
    <div className={error ? "mb-1.5" : "mb-4.5"}>
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-semibold text-gray-700">
        {label}
      </label>
      <div className="relative">
        <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="••••••••"
          className={`w-full rounded-[10px] border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10 ${
            error ? "border-red-600" : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-none bg-transparent text-gray-400 transition-colors duration-150 hover:text-gray-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 animate-[fadeIn_0.2s_ease-out] text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

function ResetPasswordScreenInner({ onGoToLogin, id }: Props) {
  const searchParams = useSearchParams();
  const identifier = id ?? searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  // True once the user has actually clicked "Reset password" — separate
  // from `touched` (which fires on blur) so we only show the blocked-
  // submission summary after a real attempt, not while still typing.
  const [attempted, setAttempted] = useState(false);

  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Simple 30s cooldown after a successful resend, so the resend button
  // can't be hammered.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!identifier || resendStatus === "loading" || cooldown > 0) return;
    setResendStatus("loading");
    setResendError(null);
    try {
      await forgotPassword({ email: identifier });
      setResendStatus("sent");
      setCooldown(30);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ??
          "Couldn't resend the code. Please try again."
        : "Couldn't resend the code. Please try again.";
      setResendError(message);
      setResendStatus("idle");
    }
  };

  const allRulesPass = RULES.every((r) => r.test(password));
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const confirmError = touched && confirm.length > 0 && !passwordsMatch ? "Passwords don't match." : undefined;
  const codeError = touched && code.trim().length === 0 ? "Enter the code we emailed you." : undefined;

  const canSubmit = allRulesPass && passwordsMatch && code.trim().length > 0 && !!identifier;

  // Why the button won't submit yet, in priority order — shown only after
  // a real submit attempt so the click never appears to "do nothing".
  const blockedReason = !identifier
    ? "We couldn't find the email for this reset. Please request a new code."
    : code.trim().length === 0
    ? "Enter the code we emailed you."
    : !allRulesPass
    ? "Your new password doesn't meet all the requirements above."
    : !passwordsMatch
    ? "Passwords don't match."
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setAttempted(true);
    setApiError(null);
    if (!canSubmit || status === "loading") return;

    setStatus("loading");
    try {
      await resetPassword(identifier, {
        newPassword: password,
        confirmPassword: confirm,
        code: code.trim(),
      });
      setStatus("done");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ??
          "Something went wrong. Please try again."
        : "Something went wrong. Please try again.";
      setApiError(message);
      setStatus("idle");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#F4F5F7] p-6 box-border">
      <div className="mt-6 w-full max-w-100 animate-[fadeInUp_0.35s_ease-out] sm:mt-0">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow duration-300">
          {/* Brand */}
          <div className="mb-6 flex justify-center">
            <Link href="/" className="shrink-0">
              <Image
                src="/insmartio.png"
                alt="inSmartio Logo"
                width={200}
                height={65}
                className="w-auto -mt-15 h-35 -mb-10 sm:-mb-10"
                priority
              />
            </Link>
          </div>

          <div
            key={status === "done" ? "done" : "form"}
            className="animate-[fadeIn_0.3s_ease-out]"
          >
            {status !== "done" ? (
              <>
                <h1 className="mb-1.5 text-center text-[19px] font-bold text-gray-900">Set a new password</h1>
                <p className="mb-6 text-center text-[13.5px] text-gray-500">
                  Enter the code we emailed you and choose a strong new password.
                </p>

                {!identifier && (
                  <p className="mb-4 text-center text-xs text-red-600">
                    We couldn&apos;t find the email for this reset. Please request a new code.
                  </p>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className={codeError ? "mb-1.5" : "mb-4.5"}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="code" className="block text-[12.5px] font-semibold text-gray-700">
                        Reset code
                      </label>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendStatus === "loading" || cooldown > 0 || !identifier}
                        className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-semibold text-blue-600 transition-colors duration-150 hover:text-blue-700 disabled:cursor-default disabled:text-gray-400"
                      >
                        {resendStatus === "loading"
                          ? "Sending…"
                          : cooldown > 0
                          ? `Resend in ${cooldown}s`
                          : "Resend code"}
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          if (apiError) setApiError(null);
                        }}
                        onBlur={() => setTouched(true)}
                        placeholder="123456"
                        className={`w-full rounded-[10px] border bg-white py-2.5 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10 ${
                          codeError ? "border-red-600" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {codeError && <p className="mt-1.5 animate-[fadeIn_0.2s_ease-out] text-xs text-red-600">{codeError}</p>}
                    {resendStatus === "sent" && cooldown > 0 && (
                      <p className="mt-1.5 animate-[fadeIn_0.2s_ease-out] text-xs text-emerald-600">
                        New code sent to {identifier}.
                      </p>
                    )}
                    {resendError && <p className="mt-1.5 animate-[fadeIn_0.2s_ease-out] text-xs text-red-600">{resendError}</p>}
                  </div>

                  <PasswordField
                    id="password"
                    label="New password"
                    value={password}
                    onChange={setPassword}
                    onBlur={() => setTouched(true)}
                    show={showPw}
                    onToggleShow={() => setShowPw((s) => !s)}
                  />

                  <div className="mb-4.5 flex flex-col gap-1">
                    {RULES.map((r) => (
                      <RuleRow key={r.label} ok={r.test(password)} label={r.label} />
                    ))}
                  </div>

                  <PasswordField
                    id="confirm"
                    label="Confirm new password"
                    value={confirm}
                    onChange={setConfirm}
                    onBlur={() => setTouched(true)}
                    show={showConfirm}
                    onToggleShow={() => setShowConfirm((s) => !s)}
                    error={confirmError}
                  />

                  {attempted && !canSubmit && blockedReason && (
                    <p className="mb-4 animate-[fadeIn_0.2s_ease-out] text-xs text-red-600">{blockedReason}</p>
                  )}

                  {apiError && (
                    <p className="mb-4 animate-[fadeIn_0.2s_ease-out] text-xs text-red-600">{apiError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className={`mt-1.5 flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
                      status === "loading"
                        ? "cursor-default bg-blue-300"
                        : "cursor-pointer bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                    }`}
                  >
                    {status === "loading" && <Loader2 size={16} className="animate-spin" />}
                    {status === "loading" ? "Updating…" : "Reset password"}
                  </button>
                </form>
              </>
            ) : (
              <div className="py-2 text-center">
                <div className="mx-auto mb-4.5 flex h-12 w-12 animate-[scaleIn_0.3s_ease-out] items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 size={24} className="text-emerald-600" />
                </div>
                <h1 className="mb-2 text-lg font-bold text-gray-900">Password reset</h1>
                <p className="mb-6 text-[13.5px] leading-relaxed text-gray-500">
                  Your password has been updated. You can now log in with your new password.
                </p>
                <button
                  onClick={onGoToLogin}
                  className="w-full cursor-pointer rounded-[10px] bg-blue-600 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
                >
                  Back to login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F4F5F7] p-6">
      <div className="w-full max-w-100 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="h-12 w-40 animate-pulse rounded-md bg-gray-100" />
        </div>
        <div className="mx-auto mb-1.5 h-4 w-40 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto mb-6 h-3 w-56 animate-pulse rounded bg-gray-100" />
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-[10px] bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded-[10px] bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded-[10px] bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded-[10px] bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordScreen(props: Props) {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordScreenInner {...props} />
    </Suspense>
  );
}