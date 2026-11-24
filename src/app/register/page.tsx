"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  FileBadge,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

import { useLang, type Bi } from "@/lib/i18n";
import { LangSwitch } from "@/components/site/LangSwitch";
import { LogoMark, Logo } from "@/components/site/Logo";
import { Navbar } from "@/components/site/Navbar";

const API_BASE = (
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : "http://localhost:5002"
).replace(/\/+$/, "");

const SLIDE_MS = 5500;

const slides: { image: string; badge: Bi; title: Bi; description: Bi }[] = [
  {
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=90",
    badge: { bn: "সেলার নেটওয়ার্ক", en: "Seller Network" },
    title: {
      bn: "আপনার প্রজেক্টের বিস্তার এবং শেয়ার বিক্রয়।",
      en: "Expand your projects and sell shares.",
    },
    description: {
      bn: "সেলার হিসেবে শেয়ার প্রজেক্ট তৈরি করুন এবং ক্রেতাদের (Buyers) সাথে সরাসরি সংযুক্ত হোন।",
      en: "Create share projects as a seller and connect directly with verified buyers.",
    },
  },
  {
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=90",
    badge: { bn: "স্মার্ট বায়ার পোর্টাল", en: "Smart Buyer Portal" },
    title: {
      bn: "স্বচ্ছতা ও নিরাপত্তার সাথে নির্ভরযোগ্য ক্রয়।",
      en: "Transparent and secure trusted investments.",
    },
    description: {
      bn: "যাচাইকৃত রিয়েল এস্টেট ও এগ্রো শেয়ারে বায়ার হিসেবে অংশ নিন এবং লভ্যাংশ ট্র্যাক করুন সহজে।",
      en: "Buy verified real estate and agriculture shares, tracking returns seamlessly.",
    },
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLang();

  // Primary account state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<"seller" | "buyer">("seller");
  const [showPw, setShowPw] = useState(false);

  // Seller-specific fields
  const [sellerNid, setSellerNid] = useState("");
  const [sellerTradeLicense, setSellerTradeLicense] = useState("");
  const [sellerMdName, setSellerMdName] = useState("");
  const [sellerOfficeAddress, setSellerOfficeAddress] = useState("");
  const [sellerPhoneAlt, setSellerPhoneAlt] = useState("");
  const [sellerWebsite, setSellerWebsite] = useState("");
  const [sellerFacebook, setSellerFacebook] = useState("");

  // Buyer-specific fields
  const [buyerProfession, setBuyerProfession] = useState("");
  const [buyerDesignation, setBuyerDesignation] = useState("");
  const [buyerBudget, setBuyerBudget] = useState("");
  const [buyerPreferableCategory, setBuyerPreferableCategory] = useState("");
  const [buyerInterestedLocation, setBuyerInterestedLocation] = useState("");

  // Form handling
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setCurrentSlide((p) => (p + 1) % slides.length),
      SLIDE_MS,
    );
    return () => clearInterval(id);
  }, [currentSlide]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic Account Validations
    if (!name.trim()) {
      setError(t({ bn: "পুরো নাম দিন।", en: "Please enter your full name." }));
      return;
    }
    if (!email.trim()) {
      setError(t({ bn: "ইমেইল ঠিকানা দিন।", en: "Please enter an email address." }));
      return;
    }
    if (password.length < 8) {
      setError(
        t({
          bn: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।",
          en: "Password must be at least 8 characters.",
        }),
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(
        t({
          bn: "পাসওয়ার্ড নিশ্চিতকরণ মিলছে না।",
          en: "Passwords do not match.",
        }),
      );
      return;
    }

    // Role-Specific Validations
    if (userType === "seller") {
      if (!sellerNid.trim()) {
        setError(t({ bn: "সেলার আইডি / এনআইডি নম্বর দিন।", en: "Please provide Seller ID / NID number." }));
        return;
      }
      if (!sellerTradeLicense.trim()) {
        setError(t({ bn: "ট্রেড লাইসেন্স নম্বর দিন।", en: "Please provide Trade License number." }));
        return;
      }
      if (!sellerMdName.trim()) {
        setError(t({ bn: "ম্যানেজিং ডিরেক্টর (MD) এর নাম দিন।", en: "Please provide Managing Director (MD) name." }));
        return;
      }
      if (!sellerOfficeAddress.trim()) {
        setError(t({ bn: "অফিস এড্রেস দিন।", en: "Please provide office address." }));
        return;
      }
    } else {
      if (!buyerProfession.trim()) {
        setError(t({ bn: "আপনার পেশা / প্রফেশন উল্লেখ করুন।", en: "Please provide your profession." }));
        return;
      }
      if (!buyerBudget.trim()) {
        setError(t({ bn: "আপনার বিনিয়োগ বাজেট নির্বাচন বা উল্লেখ করুন।", en: "Please specify your investment budget." }));
        return;
      }
      if (!buyerPreferableCategory.trim()) {
        setError(t({ bn: "পছন্দনীয় ক্যাটাগরি নির্বাচন করুন।", en: "Please select preferable project category." }));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payloadBody = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        userType: userType === "seller" ? "seller" : "buyer",
        profile:
          userType === "seller"
            ? {
                role: "seller",
                nid: sellerNid.trim(),
                tradeLicense: sellerTradeLicense.trim(),
                mdName: sellerMdName.trim(),
                officeAddress: sellerOfficeAddress.trim(),
                sellerPhone: sellerPhoneAlt.trim() || phone.trim() || undefined,
                website: sellerWebsite.trim() || undefined,
                facebookPage: sellerFacebook.trim() || undefined,
              }
            : {
                role: "buyer",
                profession: buyerProfession.trim(),
                designation: buyerDesignation.trim() || undefined,
                budget: buyerBudget.trim(),
                preferableCategory: buyerPreferableCategory.trim(),
                interestedLocation: buyerInterestedLocation.trim() || undefined,
              },
      };

      const res = await fetch(`${API_BASE}/realbizpro/api/v1/share-user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payloadBody),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg =
          (payload && typeof payload.message === "string" ? payload.message : null) ||
          (payload && Array.isArray(payload.message) ? payload.message.join(", ") : null) ||
          "Registration failed. Please try again.";
        throw new Error(errorMsg);
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slide = slides[currentSlide];
  const inputCls =
    "w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60";

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
        className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200/90 bg-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] lg:grid lg:grid-cols-12"
      >
        {/* LEFT — image slider (5 cols) */}
        <div className="relative hidden min-h-[720px] overflow-hidden bg-slate-900 lg:col-span-5 lg:block">
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

          <div className="absolute inset-x-0 bottom-0 z-30 p-8 xl:p-10">
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
                <h2 className="text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
                  {t(slide.title)}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  {t(slide.description)}
                </p>
              </motion.div>
            </AnimatePresence>

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
                      currentSlide === index ? "w-12" : "w-5 group-hover:bg-white/50"
                    }`}
                  >
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
          </div>
        </div>

        {/* RIGHT — form (7 cols) */}
        <div className="relative flex flex-col justify-center bg-white p-6 sm:p-10 lg:col-span-7">
          <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
            <LangSwitch id="register-lang" tone="light" />
          </div>

          <div className="mx-auto w-full max-w-lg pt-6 lg:pt-0">
            <div className="lg:hidden mb-4">
              <Logo tone="dark" />
            </div>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  {t({ bn: "নিবন্ধন সফল হয়েছে!", en: "Registration Successful!" })}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {t({
                    bn: "আপনার শেয়ার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে। লগইন পেজে রিডাইরেক্ট করা হচ্ছে...",
                    en: "Your share user account has been created. Redirecting to login...",
                  })}
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700"
                >
                  {t({ bn: "লগইন করুন", en: "Proceed to Login" })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-1"
                >
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    {t({ bn: "নতুন অ্যাকাউন্ট তৈরি করুন", en: "Create Share Account" })}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {t({
                      bn: "সেলার (বিক্রেতা) অথবা বায়ার (ক্রেতা) হিসেবে প্ল্যাটফর্মে যোগ দিন।",
                      en: "Register to join as a Seller or Buyer.",
                    })}
                  </p>
                </motion.div>

                {/* ══════════════ ROLE SELECTOR (SELLER VS BUYER) ══════════════ */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType("seller")}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      userType === "seller"
                        ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-xl transition ${
                        userType === "seller"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${userType === "seller" ? "text-emerald-950" : "text-slate-800"}`}>
                          {t({ bn: "সেলার (Seller)", en: "Seller" })}
                        </p>
                        {userType === "seller" && (
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t({ bn: "প্রজেক্ট বিক্রয় ও শেয়ার", en: "Sell projects & shares" })}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType("buyer")}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      userType === "buyer"
                        ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-xl transition ${
                        userType === "buyer"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${userType === "buyer" ? "text-emerald-950" : "text-slate-800"}`}>
                          {t({ bn: "বায়ার (Buyer)", en: "Buyer" })}
                        </p>
                        {userType === "buyer" && (
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t({ bn: "শেয়ার ক্রয় ও বিনিয়োগ", en: "Buy shares & invest" })}
                      </p>
                    </div>
                  </button>
                </div>

                <form onSubmit={submit} className="mt-5 space-y-4">
                  {/* Section 1: Basic Credentials */}
                  <div className="space-y-3.5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t({ bn: "পুরো নাম", en: "Full Name" })} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputCls}
                            placeholder="Md. Iqbal Hossain"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t({ bn: "ফোন নম্বর", en: "Phone Number" })} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            required
                            disabled={isSubmitting}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={inputCls}
                            placeholder="017xxxxxxxx"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t({ bn: "ইমেইল", en: "Email" })} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          disabled={isSubmitting}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputCls}
                          placeholder="name@company.com"
                        />
                      </div>
                    </div>

                    {/* Passwords */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t({ bn: "পাসওয়ার্ড", en: "Password" })} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPw ? "text" : "password"}
                            required
                            minLength={8}
                            disabled={isSubmitting}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`${inputCls} pr-10`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            aria-label="Toggle password"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t({ bn: "নিশ্চিত করুন", en: "Confirm Password" })} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPw ? "text" : "password"}
                            required
                            minLength={8}
                            disabled={isSubmitting}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={inputCls}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ══════════════ SECTION 2: DYNAMIC ROLE-BASED FIELDS ══════════════ */}
                  {userType === "seller" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-emerald-100/70 pb-2 text-emerald-800">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          {t({ bn: "সেলার পরিচিতি ও ব্যবসা সংক্রান্ত তথ্য", en: "Seller Business Details" })}
                        </h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* NID / ID */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "আইডি / এনআইডি নম্বর", en: "Seller ID / NID Number" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <FileBadge className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              disabled={isSubmitting}
                              value={sellerNid}
                              onChange={(e) => setSellerNid(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. 19901234567890"
                            />
                          </div>
                        </div>

                        {/* Trade License */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "ট্রেড লাইসেন্স নম্বর", en: "Trade License Number" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <FileBadge className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              disabled={isSubmitting}
                              value={sellerTradeLicense}
                              onChange={(e) => setSellerTradeLicense(e.target.value)}
                              className={inputCls}
                              placeholder="TRAD/DNCC/123456"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* MD Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "MD এর নাম (ব্যবস্থাপনা পরিচালক)", en: "MD Name (Managing Director)" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              disabled={isSubmitting}
                              value={sellerMdName}
                              onChange={(e) => setSellerMdName(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. Engr. Rafiqul Islam"
                            />
                          </div>
                        </div>

                        {/* Seller Alt Phone */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "বিক্রেতার অতিরিক্ত ফোন নম্বর", en: "Seller Alternate Phone" })} <span className="text-slate-400 font-normal">({t({ bn: "ঐচ্ছিক", en: "Optional" })})</span>
                          </label>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="tel"
                              disabled={isSubmitting}
                              value={sellerPhoneAlt}
                              onChange={(e) => setSellerPhoneAlt(e.target.value)}
                              className={inputCls}
                              placeholder="018xxxxxxxx"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Office Address */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          {t({ bn: "অফিস এড্রেস", en: "Office Address" })} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={sellerOfficeAddress}
                            onChange={(e) => setSellerOfficeAddress(e.target.value)}
                            className={inputCls}
                            placeholder="e.g. House 42, Road 11, Banani, Dhaka"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Website */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "ওয়েবসাইট লিঙ্ক", en: "Website URL" })} <span className="text-slate-400 font-normal">({t({ bn: "ঐচ্ছিক", en: "Optional" })})</span>
                          </label>
                          <div className="relative">
                            <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="url"
                              disabled={isSubmitting}
                              value={sellerWebsite}
                              onChange={(e) => setSellerWebsite(e.target.value)}
                              className={inputCls}
                              placeholder="https://mycompany.com"
                            />
                          </div>
                        </div>

                        {/* Facebook Page */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "ফেসবুক পেজ লিঙ্ক", en: "Facebook Page" })} <span className="text-slate-400 font-normal">({t({ bn: "ঐচ্ছিক", en: "Optional" })})</span>
                          </label>
                          <div className="relative">
                            <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="url"
                              disabled={isSubmitting}
                              value={sellerFacebook}
                              onChange={(e) => setSellerFacebook(e.target.value)}
                              className={inputCls}
                              placeholder="https://facebook.com/mycompany"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-sky-100/70 pb-2 text-sky-900">
                        <TrendingUp className="h-4 w-4 text-sky-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          {t({ bn: "বায়ারের তথ্য ও বিনিয়োগ পছন্দ", en: "Buyer Preferences & Profile" })}
                        </h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Profession */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "পেশা / প্রফেশন", en: "Profession" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Briefcase className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              disabled={isSubmitting}
                              value={buyerProfession}
                              onChange={(e) => setBuyerProfession(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. Doctor, Engineer, Businessman"
                            />
                          </div>
                        </div>

                        {/* Designation */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "পদবী / ডেজিগনেশন", en: "Designation" })} <span className="text-slate-400 font-normal">({t({ bn: "ঐচ্ছিক", en: "Optional" })})</span>
                          </label>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              disabled={isSubmitting}
                              value={buyerDesignation}
                              onChange={(e) => setBuyerDesignation(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. Senior Consultant / Manager"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Budget */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "বিনিয়োগ বাজেট (টাকা)", en: "Investment Budget" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
                            <select
                              required
                              disabled={isSubmitting}
                              value={buyerBudget}
                              onChange={(e) => setBuyerBudget(e.target.value)}
                              className={inputCls}
                            >
                              <option value="">{t({ bn: "-- বাজেট নির্বাচন করুন --", en: "-- Select Budget Range --" })}</option>
                              <option value="50k-200k">৳ ৫০,০০০ - ২,০০,০০০ (50K - 200K)</option>
                              <option value="200k-500k">৳ ২,০০,০০০ - ৫,০০,০০০ (200K - 500K)</option>
                              <option value="500k-1500k">৳ ৫,০০,০০০ - ১৫,০০,০০০ (500K - 1.5M)</option>
                              <option value="1500k-5000k">৳ ১৫,০০,০০০ - ৫০,০০,০০০ (1.5M - 5M)</option>
                              <option value="5000k+">৳ ৫০,০০,০০০+ (5M+)</option>
                            </select>
                          </div>
                        </div>

                        {/* Preferable Category */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "পছন্দনীয় ক্যাটাগরি", en: "Preferable Category" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Compass className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                              required
                              disabled={isSubmitting}
                              value={buyerPreferableCategory}
                              onChange={(e) => setBuyerPreferableCategory(e.target.value)}
                              className={inputCls}
                            >
                              <option value="">{t({ bn: "-- ক্যাটাগরি নির্বাচন করুন --", en: "-- Select Category --" })}</option>
                              <option value="Real Estate">Real Estate (রিয়েল এস্টেট)</option>
                              <option value="Agriculture & Agro">Agriculture & Agro (কৃষি ও ডেইরি)</option>
                              <option value="Commercial Plaza">Commercial Plaza (বাণিজ্যিক স্পেস)</option>
                              <option value="Eco Resort & Tourism">Eco Resort & Tourism (ইকো রিসোর্ট ও পর্যটন)</option>
                              <option value="Renewable Energy">Renewable Energy (নবায়নযোগ্য শক্তি)</option>
                              <option value="Tech & Startup">Tech & Startup (আইটি ও স্টার্টআপ)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Interested Location */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          {t({ bn: "আগ্রহী প্রজেক্ট লোকেশন / জেলা", en: "Interested Project Location" })} <span className="text-slate-400 font-normal">({t({ bn: "ঐচ্ছিক", en: "Optional" })})</span>
                        </label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            disabled={isSubmitting}
                            value={buyerInterestedLocation}
                            onChange={(e) => setBuyerInterestedLocation(e.target.value)}
                            className={inputCls}
                            placeholder="e.g. ঢাকা, গাজীপুর, চট্টগ্রাম, কক্সবাজার, সিলেট"
                          />
                        </div>
                      </div>
                    </div>
                  )}

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
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-ink-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-ink-950/20 transition hover:bg-ink-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-sky-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="relative flex items-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t({ bn: "নিবন্ধন করা হচ্ছে…", en: "Registering…" })}
                        </>
                      ) : (
                        <>
                          {t({ bn: "অ্যাকাউন্ট তৈরি করুন", en: "Create Account" })}
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-500">
                  {t({ bn: "ইতিমধ্যে অ্যাকাউন্ট আছে?", en: "Already have an account?" })}{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    {t({ bn: "লগইন করুন", en: "Sign in" })}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
