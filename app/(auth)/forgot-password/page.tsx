// components/auth/ForgotPasswordScreen.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { forgotPassword } from "@/lib/api/authApi";



interface Props {
  onBackToLogin?: () => void;
  
  onCodeSent?: (email: string) => void;
}

export default function ForgotPasswordScreen({ onCodeSent }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [apiError, setApiError] = useState<string | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showError = touched && !isValidEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setApiError(null);
    if (!isValidEmail || status === "loading") return;

    setStatus("loading");
    try {
      await forgotPassword({ email });
      setStatus("sent");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ??
          "Something went wrong. Please try again."
        : "Something went wrong. Please try again.";
      setApiError(message);
      setStatus("idle");
    }
  };

  const handleProceedToReset = () => {
    if (onCodeSent) {
      onCodeSent(email);
    } else {
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#F4F5F7] p-6 box-border">
      <div className="mt-6 w-full max-w-100 sm:mt-0">

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

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

          {status !== "sent" ? (
            <>
              <h1 className="mb-1.5 text-center text-[19px] font-bold text-gray-900">
                Forgot your password?
              </h1>
              <p className="mb-7 text-center text-[13.5px] leading-relaxed text-gray-500">
                Enter the email address linked to your account and we&apos;ll send you a code to reset your password.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-semibold text-gray-700">
                  Email address
                </label>

                <div className={`relative ${showError ? "mb-1.5" : "mb-5.5"}`}>
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (apiError) setApiError(null);
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder="you@company.com"
                    className={`w-full rounded-[10px] border bg-white py-2.5 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10 ${
                      showError ? "border-red-600" : "border-gray-300"
                    }`}
                  />
                </div>

                {showError && (
                  <p className="mb-4 text-xs text-red-600">Enter a valid email address.</p>
                )}

                {apiError && (
                  <p className="mb-4 text-xs text-red-600">{apiError}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className={`flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-semibold text-white transition-colors ${
                    status === "loading" ? "cursor-default bg-blue-300" : "cursor-pointer bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {status === "loading" && <Loader2 size={16} className="animate-spin" />}
                  {status === "loading" ? "Sending code…" : "Send reset code"}
                </button>
              </form>
            </>
          ) : (
            <div className="py-2 text-center">
              <div className="mx-auto mb-4.5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <h1 className="mb-2 text-lg font-bold text-gray-900">Check your email</h1>
              <p className="mb-6 text-[13.5px] leading-relaxed text-gray-500">
                We&apos;ve sent a password reset code to
                <br />
                <span className="font-semibold text-gray-900">{email}</span>
              </p>

              <button
                onClick={handleProceedToReset}
                className="mb-3 w-full cursor-pointer rounded-[10px] bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Enter code
              </button>

              <button
                onClick={() => setStatus("idle")}
                className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold text-blue-600"
              >
                Didn&apos;t get it? Try another email
              </button>
            </div>
          )}
        </div>

        <Link
          href="/login"
          className="mt-5 flex w-full cursor-pointer items-center justify-center gap-1.5 border-none bg-transparent text-[13px] font-medium text-gray-500"
        >
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
}