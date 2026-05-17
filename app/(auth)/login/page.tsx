"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { login, resetAuthStatus } from "@/lib/redux/authSlice";

import cleanerImage1 from "@/public/login/login-1.jpg";
import cleanerImage2 from "@/public/login/login-2.png";

const slides = [cleanerImage1, cleanerImage2];

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();

  const { status, error: authError } = useAppSelector((state) => state.auth);
  const isLoading = status === "loading";

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [twoFa,        setTwoFa]        = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating,  setIsAnimating]  = useState(false);

  // Slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsAnimating(false);
      }, 2000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Login outcome
  useEffect(() => {
    if (status === "succeeded") {
      toast.success("Welcome back!", { description: "Redirecting to dashboard..." });
      router.push("/dashboard");
    }
    if (status === "failed" && authError) {
      toast.error("Login failed", { description: authError });
      dispatch(resetAuthStatus());
    }
  }, [status, authError, router, dispatch]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Missing fields", { description: "Please fill in your email and password." });
      return;
    }
    dispatch(login({ email, password }));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-8 sm:p-6">
      <div
        className="flex w-full max-w-6xl rounded-2xl overflow-hidden sm:shadow-ambient sm:border sm:border-border"
        style={{ minHeight: "min(600px, 90vh)" }}
      >
        {/* ── LEFT: Slideshow — hidden on mobile, shows md+ ── */}
        <div className="relative hidden md:flex flex-col justify-end flex-[0_0_52%] overflow-hidden">
          {slides.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-2000 ease-in-out"
              style={{ opacity: i === currentSlide ? 1 : 0 }}
            >
              <Image
                src={src}
                alt={`Slide ${i + 1}`}
                fill
                className="object-cover"
                style={{
                  animation: i === currentSlide
                    ? isAnimating ? "swayOut 2s ease-in-out forwards" : "swayIn 2s ease-in-out forwards"
                    : "none",
                }}
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* ── RIGHT: Form Panel — full width on mobile ── */}
        <div className="flex flex-1 flex-col justify-center items-center px-5 py-10 sm:px-10 sm:py-14 bg-surface">

          {/* Brand */}
          <div className="text-center mb-6 sm:mb-8">
             <Link href="/" className="shrink-0">
              <Image src="/logo/insmartio.png" alt="inSmartio Logo" width={120} height={35} style={{ height: "auto", width: "auto" }} priority />
            </Link>
          </div>

          {/* Card — no border/shadow on mobile, card style on sm+ */}
          <div className="w-full max-w-md rounded-2xl p-0 sm:p-9 sm:bg-white sm:border sm:border-border sm:shadow-sm">
            <h1 className="text-base sm:text-lg font-bold text-center mb-5 sm:mb-7 text-text-main">
              Admin Dashboard
            </h1>

            <form onSubmit={handleLogin} noValidate>

              {/* Email */}
              <div className="mb-4 sm:mb-5">
                <label htmlFor="email" className="block text-[13px] font-medium mb-1.5 text-text-main">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@helpme.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-background border border-border text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Password */}
              <div className="mb-1">
                <label htmlFor="password" className="block text-[13px] font-medium mb-1.5 text-text-main">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="help1234"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all bg-background border border-border text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end mb-4 sm:mb-5">
                <a href="#" className="text-xs text-primary opacity-80 hover:opacity-100 transition-opacity">
                  Forgot password?
                </a>
              </div>

              {/* 2FA */}
              <div className="mb-6 sm:mb-7">
                <label htmlFor="twofa" className="block text-[13px] font-medium mb-1.5 text-text-main">
                  2FA Code{" "}
                  <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  id="twofa"
                  type="text"
                  placeholder="Enter 2FA code..."
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={twoFa}
                  onChange={(e) => setTwoFa(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-background border border-border text-text-main placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full rounded-xl py-3.5 text-[15px] font-semibold tracking-wide disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-4 sm:mt-0 gap-2"
              >
                {isLoading
                  ? <><Loader2 size={16} className="animate-spin" /> Logging in...</>
                  : "Login"
                }
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}