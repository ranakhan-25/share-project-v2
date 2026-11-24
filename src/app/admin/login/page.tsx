"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { loginSuperAdminSession } from "@/lib/admin-share-project-api";
import { getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";
import { useLang, type Bi } from "@/lib/i18n";
import { LangSwitch } from "@/components/site/LangSwitch";
import { Logo, LogoMark } from "@/components/site/Logo";
import { Navbar } from "@/components/site/Navbar";

const SLIDE_MS = 5500;

const slides: { image: string; badge: Bi; title: Bi; description: Bi }[] = [
  {
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=90",
    badge: { bn: "এডমিন কন্ট্রোল", en: "Admin Control" },
    title: {
      bn: "শেয়ার প্রজেক্টের সামগ্রিক পরিচালনা ও নিরীক্ষা।",
      en: "Complete oversight and governance of share projects.",
    },
    description: {
      bn: "প্রজেক্ট অনুমোদন, বাতিল, বিনিয়োগ যাচাই ও ব্যবহারকারী নিয়ন্ত্রণ—সবকিছু এক সেন্ট্রাল কনসোলে।",
      en: "Review project approvals, rejections, investment audits and shareholder management from one unified console.",
    },
  },
  {
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=90",
    badge: { bn: "নিরাপদ পরিচালনা", en: "Secure Operations" },
    title: {
      bn: "রিয়েলবিজ প্রো অ্যাডমিন ইন্টিগ্রেশন।",
      en: "Realbiz Pro Admin Integration.",
    },
    description: {
      bn: "আপনার সিস্টেম অ্যাডমিনিস্ট্রেটর ক্রেডেনশিয়াল দিয়ে সরাসরি শেয়ার প্রজেক্টের গভর্ন্যান্সে প্রবেশ করুন।",
      en: "Direct access into Share Project administrative controls using your primary Realbiz Pro credentials.",
    },
  },
  {
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=90",
    badge: { bn: "রিয়েল-টাইম অডিট", en: "Real-time Auditing" },
    title: {
      bn: "স্বচ্ছ বিনিয়োগ ও নির্ভরযোগ্য রিপোর্ট।",
      en: "Transparent investments & reliable reports.",
    },
    description: {
      bn: "ইনভেস্টমেন্ট রিকোয়েস্ট যাচাই, ক্যাটাগরি কনফিগারেশন এবং প্ল্যাটফর্ম অ্যাক্টিভিটি ট্র্যাক করুন।",
      en: "Verify investment submissions, manage project categories, and trace platform activity effortlessly.",
    },
  },
];

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { t } = useLang();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (getStoredAccessToken()) {
      router.replace("/admin");
    }
  }, [router]);

  useEffect(() => {
    const id = setInterval(
      () => setCurrentSlide((p) => (p + 1) % slides.length),
      SLIDE_MS,
    );
    return () => clearInterval(id);
  }, [currentSlide]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = identifier.trim();
    if (!clean || password.length < 8) {
      setError(
        t({
          bn: "এডমিন ইমেইল/ইউজারনেম এবং কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন।",
          en: "Please enter your Admin email/username and a password of at least 8 characters.",
        }),
      );
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await loginSuperAdminSession(clean, password);
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t({
              bn: "লগইন ব্যর্থ হয়েছে। সঠিক এডমিন তথ্য দিয়ে আবার চেষ্টা করুন।",
              en: "Admin authentication failed. Please verify your credentials and try again.",
            }),
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
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity }}
        className="pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald-100/60 blur-[100px]"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="pointer-events-none absolute -right-32 bottom-10 h-[28rem] w-[28rem] rounded-full bg-teal-100/50 blur-[100px]"
      />

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
              <img
                src={slide.image}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/45" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/15" />
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
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-md"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                {t(slide.badge)}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-30 p-10">
            <div className="mb-6 flex items-center gap-3 text-white">
              <LogoMark size={36} />
              <span className="text-lg font-bold">
                Share Project{" "}
                <span className="ml-1 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                  Admin
                </span>
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="max-w-md"
              >
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                  {t(slide.title)}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  {t(slide.description)}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* indicators */}
            <div className="mt-8 flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Slide ${index + 1}`}
                  className="group py-2"
                >
                  <span
                    className={`relative block h-1 overflow-hidden rounded-full bg-white/30 transition-all duration-500 ${
                      currentSlide === index
                        ? "w-12"
                        : "w-5 group-hover:bg-white/50"
                    }`}
                  >
                    {currentSlide === index && (
                      <motion.span
                        key={`p-${currentSlide}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: SLIDE_MS / 1000,
                          ease: "linear",
                        }}
                        className="absolute inset-y-0 left-0 bg-emerald-400"
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4 text-[10px] uppercase tracking-wider text-white/50">
              <span>{t({ bn: "এডমিন গেটওয়ে", en: "Admin Gateway" })}</span>
              <span>{t({ bn: "রিয়েলবিজ প্রো", en: "Realbiz Pro" })}</span>
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="relative flex flex-col justify-center bg-white p-7 sm:p-12">
          <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
            <LangSwitch id="admin-login-lang" tone="light" />
          </div>

          <div className="mx-auto w-full max-w-md pt-10 lg:pt-0">
            <div className="lg:hidden flex items-center justify-between mb-4">
              <Logo tone="dark" />
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                Admin
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 space-y-2 lg:mt-0"
            >
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t({
                  bn: "রিয়েলবিজ প্রো এডমিন",
                  en: "Realbiz Pro Admin",
                })}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {t({ bn: "এডমিন লগইন", en: "Admin Login" })}
              </h1>
              <p className="text-sm text-slate-500">
                {t({
                  bn: "রিয়েলবিজ প্রো এডমিন ক্রেডেনশিয়াল দিয়ে সাইন ইন করুন।",
                  en: "Sign in with your Realbiz Pro Admin credentials to access the console.",
                })}
              </p>
            </motion.div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {t({ bn: "ইমেইল বা ইউজারনেম", en: "Email or Username" })}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    disabled={isSubmitting}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={inputCls}
                    placeholder="admin@realbiz.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {t({ bn: "পাসওয়ার্ড", en: "Password" })}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputCls} pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label="Toggle password"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Demo Credentials Quick Fill Button */}
              <div
                onClick={() => {
                  setIdentifier("fleek_bd");
                  setPassword("Password@123");
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
                        {t({ bn: "এডমিন ডেমো লগইন", en: "Admin Demo" })}
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
                      setIdentifier("fleek_bd");
                      setPassword("Password@123");
                      setError("");
                    }}
                    className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                  >
                    {t({ bn: "অটো ফিল", en: "Auto Fill" })}
                  </button>
                </div>
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
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t({ bn: "যাচাই করা হচ্ছে…", en: "Authenticating…" })}
                    </>
                  ) : (
                    <>
                      {t({ bn: "এডমিন লগইন", en: "Admin Sign In" })}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-2 text-center text-sm">
              <p className="text-slate-600">
                {t({
                  bn: "নতুন এডমিন?",
                  en: "New Admin?",
                })}{" "}
                <Link
                  href="/admin/register"
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {t({
                    bn: "রেজিস্ট্রেশন করুন",
                    en: "Register here",
                  })}
                </Link>
              </p>

              <div className="border-t border-slate-100 pt-3">
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  {t({
                    bn: "শেয়ার ইউজার বা ইনভেস্টর লগইন করতে চান? এখানে ক্লিক করুন",
                    en: "Looking for Share User or Investor Login? Click here",
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
