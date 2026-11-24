"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Sparkles, User } from "lucide-react";

import { loginUniversalSession } from "@/lib/admin-auth/adminAuthApi";
import { getStoredAccessToken, setStoredTokens } from "@/lib/admin-auth/adminAuthStorage";
import { useLang, type Bi } from "@/lib/i18n";
import { LangSwitch } from "@/components/site/LangSwitch";
import { Logo, LogoMark } from "@/components/site/Logo";
import { Navbar } from "@/components/site/Navbar";

const SLIDE_MS = 5500;

const slides: { image: string; badge: Bi; title: Bi; description: Bi }[] = [
  {
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=90",
    badge: { bn: "টিম ও প্রজেক্ট", en: "Teams & Projects" },
    title: { bn: "প্রতিটি শেয়ার, এক ড্যাশবোর্ডে।", en: "Every share, one dashboard." },
    description: {
      bn: "শেয়ার বরাদ্দ, কালেকশন ও রিপোর্ট — সবকিছু একটি নিরাপদ ওয়ার্কস্পেস থেকে পরিচালনা করুন।",
      en: "Manage share allocation, collection and reports from one secure workspace.",
    },
  },
  {
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=90",
    badge: { bn: "স্মার্ট অপারেশন", en: "Smart Operations" },
    title: { bn: "কিস্তি থেকে রিটার্ন — সবকিছু ট্র্যাকে।", en: "From instalments to returns — on track." },
    description: {
      bn: "বকেয়া, পেনাল্টি ও পয়েন্ট স্বয়ংক্রিয়ভাবে হিসাব হয়, আপনি শুধু সিদ্ধান্ত নেন।",
      en: "Dues, penalties and points are calculated automatically — you just decide.",
    },
  },
  {
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=90",
    badge: { bn: "বিজনেস ইন্টেলিজেন্স", en: "Business Intelligence" },
    title: { bn: "ডেটা থেকে সঠিক সিদ্ধান্ত।", en: "Better decisions from your data." },
    description: {
      bn: "রিয়েল-টাইম চার্ট ও ইনসাইটে আপনার পোর্টফোলিওর প্রতিটি পরিবর্তন বুঝে নিন।",
      en: "Understand every change in your portfolio with real-time charts and insights.",
    },
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"owner" | "investor">("owner");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (getStoredAccessToken()) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [currentSlide]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = identifier.trim();
    if (!clean || password.length < 8) {
      setError(
        t({
          bn: "আপনার ইমেইল এবং কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন।",
          en: "Please enter your email and a password of at least 8 characters.",
        }),
      );
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      // ── Login API call ──
      const session = await loginUniversalSession(clean, password);
      const isOwnerAccount = clean === "owner@shareproject.com" || userType === "owner";
      const backendUserType = String(session.user?.userType || session.user?.user_type || session.user?.role || "").toLowerCase();
      const isBuyerAccount =
        backendUserType === "buyer" ||
        backendUserType === "investor" ||
        userType === "investor" ||
        clean === "buyer@shareproject.com" ||
        clean === "sharetest@realbiz.com";
      const finalRole = isBuyerAccount && !isOwnerAccount ? "buyer" : isOwnerAccount ? "seller" : (session.user?.role || "buyer");
      const userToStore = {
        ...(session.user || {}),
        role: finalRole,
        userType: finalRole,
      };
      setStoredTokens(session.accessToken, session.refreshToken, userToStore);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t({ bn: "লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।", en: "Authentication failed. Please verify your credentials and try again." }),
      );
      setIsSubmitting(false);
    }
  };

  const slide = slides[currentSlide];
  const inputCls =
    "w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 pt-28 pb-14 text-slate-800 antialiased">
      <Navbar />

      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-75" />
      <motion.div animate={{ x: [0, 40, 0], y: [0, 20, 0] }} transition={{ duration: 16, repeat: Infinity }} className="pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald-100/60 blur-[100px]" />
      <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity }} className="pointer-events-none absolute -right-32 bottom-10 h-[28rem] w-[28rem] rounded-full bg-teal-100/50 blur-[100px]" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200/90 bg-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] lg:grid lg:grid-cols-2"
      >
        {/* LEFT — image slider */}
        <div className="relative hidden min-h-[700px] overflow-hidden bg-slate-900 lg:block">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={currentSlide}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-slate-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-slate-950/45" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`badge-${currentSlide}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {t(slide.badge)}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-30 p-10">
            <div className="mb-6 flex items-center gap-3 text-white">
              <LogoMark size={36} />
              <span className="text-lg font-bold">Share Project</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md"
              >
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">{t(slide.title)}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{t(slide.description)}</p>
              </motion.div>
            </AnimatePresence>

            {/* indicators with progress */}
            <div className="mt-8 flex items-center gap-2">
              {slides.map((_, index) => (
                <button key={index} type="button" onClick={() => setCurrentSlide(index)} aria-label={`Slide ${index + 1}`} className="group py-2">
                  <span className={`relative block h-1 overflow-hidden rounded-full bg-white/30 transition-all duration-500 ${currentSlide === index ? "w-12" : "w-5 group-hover:bg-white/50"}`}>
                    {currentSlide === index && (
                      <motion.span
                        key={`p-${currentSlide}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                        className="absolute inset-y-0 left-0 bg-white"
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4 text-[10px] uppercase tracking-wider text-white/50">
              <span>{t({ bn: "নিরাপদ অ্যাক্সেস", en: "Secure access" })}</span>
              <span>{t({ bn: "শেয়ার ওয়ার্কস্পেস", en: "Share workspace" })}</span>
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="relative flex flex-col justify-center bg-white p-7 sm:p-12">
          <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
            <LangSwitch id="login-lang" tone="light" />
          </div>

          <div className="mx-auto w-full max-w-md pt-10 lg:pt-0">
            <div className="lg:hidden">
              <Logo tone="dark" />
            </div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 space-y-2 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t({ bn: "স্বাগতম!", en: "Welcome back" })}</h1>
              <p className="text-sm text-slate-500">
                {t({ bn: "আপনার ওয়ার্কস্পেসে প্রবেশ করতে অ্যাকাউন্টে লগইন করুন।", en: "Sign in with your account to access your workspace." })}
              </p>
            </motion.div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t({ bn: "ইউজারনেম", en: "Username" })}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="identifier" type="text" autoComplete="username" required disabled={isSubmitting} value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={inputCls} placeholder="name@company.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t({ bn: "পাসওয়ার্ড", en: "Password" })}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" required disabled={isSubmitting} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-12`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Short Compact User Type under password */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {t({ bn: "ইউজারের ধরন:", en: "User Type:" })}
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <label
                      onClick={() => setUserType("owner")}
                      className="flex cursor-pointer items-center gap-1.5 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={userType === "owner"}
                        onChange={() => setUserType("owner")}
                        className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-500"
                      />
                      <span className={userType === "owner" ? "font-bold text-emerald-800" : "text-slate-600"}>
                        {t({ bn: "সেলার (Seller)", en: "Seller" })}
                      </span>
                    </label>

                    <label
                      onClick={() => setUserType("investor")}
                      className="flex cursor-pointer items-center gap-1.5 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={userType === "investor"}
                        onChange={() => setUserType("investor")}
                        className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-500"
                      />
                      <span className={userType === "investor" ? "font-bold text-emerald-800" : "text-slate-600"}>
                        {t({ bn: "বায়ার (Buyer)", en: "Buyer" })}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Demo Credentials Quick Fill Button */}
              <div
                onClick={() => {
                  if (userType === "owner") {
                    setIdentifier("owner@shareproject.com");
                    setPassword("12345678");
                  } else {
                    setIdentifier("buyer@shareproject.com");
                    setPassword("Password@123");
                  }
                  setError("");
                }}
                className="cursor-pointer rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 p-3 transition hover:border-emerald-400 hover:bg-emerald-100/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">
                        {userType === "owner"
                          ? t({ bn: "সেলার ডেমো লগইন", en: "Seller Demo Login" })
                          : t({ bn: "বায়ার ডেমো লগইন", en: "Buyer Demo Login" })}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium truncate">
                        {t({ bn: "ক্লিক করলে অটো ফিল হবে", en: "Click to auto-fill credentials" })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (userType === "owner") {
                        setIdentifier("owner@shareproject.com");
                        setPassword("12345678");
                      } else {
                        setIdentifier("buyer@shareproject.com");
                        setPassword("Password@123");
                      }
                      setError("");
                    }}
                    className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                  >
                    {t({ bn: "অটো ফিল", en: "Auto Fill" })}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-emerald-500" />
                  {t({ bn: "মনে রাখুন", en: "Remember me" })}
                </label>
                <Link href="/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-700">
                  {t({ bn: "পাসওয়ার্ড ভুলে গেছেন?", en: "Forgot password?" })}
                </Link>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    role="alert"
                    className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-ink-950 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-ink-950/20 transition hover:bg-ink-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-sky-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t({ bn: "যাচাই করা হচ্ছে…", en: "Authenticating…" })}
                    </>
                  ) : (
                    <>
                      {t({ bn: "লগইন করুন", en: "Sign in" })}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-2 text-center text-sm">
              <p className="text-slate-600">
                {t({ bn: "নতুন অ্যাকাউন্ট?", en: "New to Share Project?" })}{" "}
                <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                  {t({ bn: "নিবন্ধন করুন", en: "Create account" })}
                </Link>
              </p>

              <div className="border-t border-slate-100 pt-3">
                <Link
                  href="/admin/login"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  {t({
                    bn: "এডমিন লগইন করতে চান? এখানে ক্লিক করুন",
                    en: "Looking for Admin Login? Click here",
                  })}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
