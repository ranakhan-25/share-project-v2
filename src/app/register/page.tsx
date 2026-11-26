"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  Users,
} from "lucide-react";

import { useLang, type Bi } from "@/lib/i18n";
import { LangSwitch } from "@/components/site/LangSwitch";
import { Logo } from "@/components/site/Logo";
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

type RoleType = "seller" | "buyer";
type EntityType = "individual" | "community" | "organisation";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLang();

  // Primary account state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // User Role & Entity Type
  const [userType, setUserType] = useState<RoleType>("seller");
  const [entityType, setEntityType] = useState<EntityType>("individual");

  // 1. Individual Details
  const [nidNumber, setNidNumber] = useState("");
  const [profession, setProfession] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [phoneAlt, setPhoneAlt] = useState("");

  // 2. Community & Representative Details
  const [communityName, setCommunityName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [communityDesignation, setCommunityDesignation] = useState("");
  const [memberCount, setMemberCount] = useState<number | string>("");
  const [communityRegNo, setCommunityRegNo] = useState("");
  const [communityAddress, setCommunityAddress] = useState("");

  // 3. Organisation & Signatory Details
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("Private Limited Company");
  const [tradeLicense, setTradeLicense] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryDesignation, setSignatoryDesignation] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [facebookPage, setFacebookPage] = useState("");

  // 4. Buyer Preferences (when userType === "buyer")
  const [buyerBudget, setBuyerBudget] = useState("৳৫,০০,০০০ - ৳১০,০০,০০০");
  const [buyerPreferableCategory, setBuyerPreferableCategory] = useState("Commercial Real Estate");
  const [buyerInterestedLocation, setBuyerInterestedLocation] = useState("Dhaka");

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

  const isFormValid = useMemo(() => {
    // 1. Basic credentials
    if (!name.trim()) return false;
    if (!phone.trim()) return false;
    if (!email.trim() || !email.includes("@")) return false;
    if (password.length < 8) return false;
    if (password !== confirmPassword) return false;

    // 2. Entity-specific required fields
    if (entityType === "individual") {
      if (!nidNumber.trim()) return false;
      if (!presentAddress.trim()) return false;
    } else if (entityType === "community") {
      if (!communityName.trim()) return false;
      if (!representativeName.trim()) return false;
      if (!communityDesignation.trim()) return false;
      if (!memberCount || Number(memberCount) <= 0) return false;
    } else if (entityType === "organisation") {
      if (!companyName.trim()) return false;
      if (!tradeLicense.trim()) return false;
      if (!signatoryName.trim()) return false;
      if (!signatoryDesignation.trim()) return false;
      if (!officeAddress.trim()) return false;
    }

    // 3. Buyer preferences
    if (userType === "buyer") {
      if (!buyerBudget.trim()) return false;
      if (!buyerPreferableCategory.trim()) return false;
    }

    return true;
  }, [
    name,
    phone,
    email,
    password,
    confirmPassword,
    entityType,
    nidNumber,
    presentAddress,
    communityName,
    representativeName,
    communityDesignation,
    memberCount,
    companyName,
    tradeLicense,
    signatoryName,
    signatoryDesignation,
    officeAddress,
    userType,
    buyerBudget,
    buyerPreferableCategory,
  ]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic Account Validations
    if (!name.trim()) {
      setError(t({ bn: "আপনার পুরো নাম প্রদান করুন।", en: "Please enter your full name." }));
      return;
    }
    if (!email.trim()) {
      setError(t({ bn: "ইমেইল ঠিকানা প্রদান করুন।", en: "Please enter an email address." }));
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

    // Entity-Specific Validations
    if (entityType === "individual") {
      if (!nidNumber.trim()) {
        setError(t({ bn: "জাতীয় পরিচয়পত্র (NID) নম্বর আবশ্যক।", en: "National ID (NID) number is required." }));
        return;
      }
      if (!presentAddress.trim()) {
        setError(t({ bn: "বর্তমান ঠিকানা প্রদান করুন।", en: "Please enter your present address." }));
        return;
      }
    } else if (entityType === "community") {
      if (!communityName.trim()) {
        setError(t({ bn: "কমিউনিটি বা সমিতির নাম আবশ্যক।", en: "Community / Association name is required." }));
        return;
      }
      if (!representativeName.trim()) {
        setError(t({ bn: "প্রধান প্রতিনিধির নাম উল্লেখ করুন।", en: "Lead representative name is required." }));
        return;
      }
      if (!communityDesignation.trim()) {
        setError(t({ bn: "প্রতিনিধির পদবি উল্লেখ করুন।", en: "Designation in community is required." }));
        return;
      }
      if (!memberCount || Number(memberCount) <= 0) {
        setError(t({ bn: "কমিউনিটি সদস্য সংখ্যা উল্লেখ করুন।", en: "Total community members count is required." }));
        return;
      }
    } else if (entityType === "organisation") {
      if (!companyName.trim()) {
        setError(t({ bn: "প্রতিষ্ঠানের নিবন্ধিত নাম প্রদান করুন।", en: "Registered Company Name is required." }));
        return;
      }
      if (!tradeLicense.trim()) {
        setError(t({ bn: "ট্রেড লাইসেন্স বা আরজেএসসি নম্বর প্রদান করুন।", en: "Trade License / RJSC number is required." }));
        return;
      }
      if (!signatoryName.trim() || !signatoryDesignation.trim()) {
        setError(t({ bn: "অনুমোদিত প্রতিনিধির নাম ও পদবি প্রদান করুন।", en: "Authorized signatory name and designation are required." }));
        return;
      }
      if (!officeAddress.trim()) {
        setError(t({ bn: "প্রতিষ্ঠানের কার্যালয়ের ঠিকানা প্রদান করুন।", en: "Office address is required." }));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const profileData: Record<string, any> = {
        role: userType,
        entityType,
        ...(entityType === "individual"
          ? {
              nid: nidNumber.trim(),
              profession: profession.trim() || undefined,
              presentAddress: presentAddress.trim(),
              phoneAlt: phoneAlt.trim() || undefined,
            }
          : entityType === "community"
          ? {
              communityName: communityName.trim(),
              representativeName: representativeName.trim(),
              designation: communityDesignation.trim(),
              memberCount: Number(memberCount) || 0,
              registrationNo: communityRegNo.trim() || undefined,
              officeAddress: communityAddress.trim() || undefined,
            }
          : {
              companyName: companyName.trim(),
              businessType,
              tradeLicense: tradeLicense.trim(),
              signatoryName: signatoryName.trim(),
              designation: signatoryDesignation.trim(),
              officeAddress: officeAddress.trim(),
              website: website.trim() || undefined,
              facebookPage: facebookPage.trim() || undefined,
            }),
        ...(userType === "buyer"
          ? {
              budget: buyerBudget.trim(),
              preferableCategory: buyerPreferableCategory.trim(),
              interestedLocation: buyerInterestedLocation.trim() || undefined,
            }
          : {}),
      };

      const payloadBody = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        userType: userType === "seller" ? "seller" : "buyer",
        profile: profileData,
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
          t({ bn: "নিবন্ধন ব্যর্থ হয়েছে।", en: "Registration failed." });
        setError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2500);
    } catch {
      setError(
        t({
          bn: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
          en: "Could not connect to the server.",
        }),
      );
      setIsSubmitting(false);
    }
  };

  const inputBase =
    "w-full rounded-2xl border border-slate-200 bg-white py-3 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50";
  const inputCls = `${inputBase} pl-11 pr-4`;
  const inputNoIconCls = `${inputBase} px-4`;

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

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200/90 bg-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] lg:grid lg:grid-cols-12 h-[88vh] max-h-[820px] min-h-[620px]"
      >
        {/* LEFT — photo carousel (5 cols) */}
        <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-slate-900 p-10 lg:flex lg:col-span-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.7]"
              style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
            />
          </AnimatePresence>

          <div className="absolute inset-0 z-1 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />

          <div className="relative z-10 flex items-center justify-between">
            <Logo tone="light" />
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
              Share Platform
            </span>
          </div>

          <div className="relative z-10 space-y-4">
            <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              {t(slides[currentSlide].badge)}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {t(slides[currentSlide].title)}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t(slides[currentSlide].description)}
            </p>

            <div className="flex gap-2 pt-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? "w-8 bg-emerald-400" : "w-2 bg-white/30"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — registration form (7 cols) */}
        <div className="relative flex h-full flex-col bg-white overflow-hidden lg:col-span-7">
          {isSuccess ? (
            <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
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
            </div>
          ) : (
            <>
              {/* STATIC PINNED HEADER */}
              <div className="shrink-0 px-6 pt-5 sm:px-10 sm:pt-7 pb-3 border-b border-slate-100 bg-white z-10 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)]">
                <div className="lg:hidden mb-2">
                  <Logo tone="dark" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {t({ bn: "নতুন অ্যাকাউন্ট তৈরি করুন", en: "Create Share Account" })}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {t({
                      bn: "সেলার (উদ্যোক্তা) অথবা বায়ার (বিনিয়োগকারী) হিসেবে নিবন্ধন করুন।",
                      en: "Register to join as a Seller (Creator) or Buyer (Investor).",
                    })}
                  </p>
                </div>

                {/* 1. ROLE SELECTOR */}
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUserType("seller")}
                    className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition ${
                      userType === "seller"
                        ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                        userType === "seller"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${userType === "seller" ? "text-emerald-950" : "text-slate-800"}`}>
                          {t({ bn: "সেলার (Seller)", en: "Seller" })}
                        </p>
                        {userType === "seller" && (
                          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-600 text-white">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {t({ bn: "প্রজেক্ট বিক্রয় ও শেয়ার", en: "Sell projects & shares" })}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType("buyer")}
                    className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition ${
                      userType === "buyer"
                        ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                    }`}
                  >
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                        userType === "buyer"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${userType === "buyer" ? "text-emerald-950" : "text-slate-800"}`}>
                          {t({ bn: "বায়ার (Buyer)", en: "Buyer" })}
                        </p>
                        {userType === "buyer" && (
                          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-600 text-white">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {t({ bn: "শেয়ার ক্রয় ও বিনিয়োগ", en: "Buy shares & invest" })}
                      </p>
                    </div>
                  </button>
                </div>

                {/* 2. ENTITY TYPE SELECTOR */}
                <div className="mt-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEntityType("individual")}
                      className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border text-center transition ${
                        entityType === "individual"
                          ? "border-emerald-500 bg-emerald-50/90 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20 font-bold"
                          : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100/70 font-medium"
                      }`}
                    >
                      <User className={`h-3.5 w-3.5 mb-0.5 ${entityType === "individual" ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-[11px] leading-tight">
                        {t({ bn: "ইন্ডিভিজুয়াল", en: "Individual" })}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntityType("community")}
                      className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border text-center transition ${
                        entityType === "community"
                          ? "border-emerald-500 bg-emerald-50/90 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20 font-bold"
                          : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100/70 font-medium"
                      }`}
                    >
                      <Users className={`h-3.5 w-3.5 mb-0.5 ${entityType === "community" ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-[11px] leading-tight">
                        {t({ bn: "কমিউনিটি", en: "Community" })}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntityType("organisation")}
                      className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border text-center transition ${
                        entityType === "organisation"
                          ? "border-emerald-500 bg-emerald-50/90 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20 font-bold"
                          : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100/70 font-medium"
                      }`}
                    >
                      <Building2 className={`h-3.5 w-3.5 mb-0.5 ${entityType === "organisation" ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-[11px] leading-tight">
                        {t({ bn: "অর্গানাইজেশন", en: "Organisation" })}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FORM WITH SCROLLABLE MIDDLE & STATIC PINNED FOOTER */}
              <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
                {/* Scrollable Form Fields */}
                <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-10 space-y-4">
                  {/* Section 1: Basic Credentials */}
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t({ bn: "পূর্ণ নাম", en: "Full Name" })} <span className="text-rose-500">*</span>
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
                            placeholder="e.g. Md. Rafiqul Islam"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t({ bn: "মোবাইল নম্বর", en: "Mobile Phone Number" })} <span className="text-rose-500">*</span>
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
                        {t({ bn: "ইমেইল ঠিকানা", en: "Email Address" })} <span className="text-rose-500">*</span>
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
                          placeholder="name@example.com"
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
                          {t({ bn: "পাসওয়ার্ড নিশ্চিতকরণ", en: "Confirm Password" })} <span className="text-rose-500">*</span>
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

                  {/* ══════════════ SECTION 2: DYNAMIC CREATOR / ENTITY DETAILS ══════════════ */}

                  {/* ── 2A. INDIVIDUAL CREATOR DETAILS ── */}
                  {entityType === "individual" && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-emerald-100/70 pb-2 text-emerald-800">
                        <User className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          {t({
                            bn: "উদ্যোক্তার ব্যক্তিগত পরিচিতি (Individual Creator Details)",
                            en: "Individual Creator Details",
                          })}
                        </h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* NID */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "জাতীয় পরিচয়পত্র (NID) নম্বর", en: "National ID (NID) Number" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <FileBadge className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              disabled={isSubmitting}
                              value={nidNumber}
                              onChange={(e) => setNidNumber(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. 1987654321098"
                            />
                          </div>
                        </div>

                        {/* Profession */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "পেশা / কর্মসংস্থান (Profession)", en: "Profession / Occupation" })}
                          </label>
                          <div className="relative">
                            <Briefcase className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              disabled={isSubmitting}
                              value={profession}
                              onChange={(e) => setProfession(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. Businessman / Engineer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Present Address */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          {t({ bn: "বর্তমান ঠিকানা (Present Address)", en: "Present Address" })} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={presentAddress}
                            onChange={(e) => setPresentAddress(e.target.value)}
                            className={inputCls}
                            placeholder="e.g. House 12, Road 5, Dhanmondi, Dhaka"
                          />
                        </div>
                      </div>

                      {/* Alternate Phone */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          {t({ bn: "বিকল্প ফোন নম্বর (Alternate Phone)", en: "Alternate Phone Number" })}{" "}
                          <span className="text-slate-400 font-normal">({t({ bn: "ঐচ্ছিক", en: "Optional" })})</span>
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            disabled={isSubmitting}
                            value={phoneAlt}
                            onChange={(e) => setPhoneAlt(e.target.value)}
                            className={inputCls}
                            placeholder="018xxxxxxxx"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 2B. COMMUNITY & REPRESENTATIVE DETAILS ── */}
                  {entityType === "community" && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-emerald-100/70 pb-2 text-emerald-800">
                        <Users className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          {t({
                            bn: "কমিউনিটি ও প্রতিনিধির তথ্য (Community & Representative Details)",
                            en: "Community & Representative Details",
                          })}
                        </h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Community Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "সমিতি বা ক্লাবের নাম (Community Name)", en: "Community / Group Name" })}{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={communityName}
                            onChange={(e) => setCommunityName(e.target.value)}
                            className={inputNoIconCls}
                            placeholder="e.g. Dhaka Green Investors Club"
                          />
                        </div>

                        {/* Lead Representative Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "প্রধান প্রতিনিধির নাম", en: "Lead Representative Name" })}{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={representativeName}
                            onChange={(e) => setRepresentativeName(e.target.value)}
                            className={inputNoIconCls}
                            placeholder="e.g. Rafiqul Islam"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Designation in Community */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "প্রতিনিধির পদবি (Designation)", en: "Designation in Community" })}{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={communityDesignation}
                            onChange={(e) => setCommunityDesignation(e.target.value)}
                            className={inputNoIconCls}
                            placeholder="e.g. President / Secretary / Convener"
                          />
                        </div>

                        {/* Member Count */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "কমিউনিটি সদস্য সংখ্যা", en: "Total Community Members" })}{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={2}
                            required
                            disabled={isSubmitting}
                            value={memberCount}
                            onChange={(e) => setMemberCount(e.target.value)}
                            className={inputNoIconCls}
                            placeholder="e.g. 50"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Community Reg No */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "সমিতি বা ক্লাবের নিবন্ধন নং", en: "Association Reg No. (Optional)" })}{" "}
                            <span className="text-slate-400 font-normal">({t({ bn: "ঐচ্ছিক", en: "Optional" })})</span>
                          </label>
                          <input
                            type="text"
                            disabled={isSubmitting}
                            value={communityRegNo}
                            onChange={(e) => setCommunityRegNo(e.target.value)}
                            className={inputNoIconCls}
                            placeholder="e.g. REG-2024-987"
                          />
                        </div>

                        {/* Community Office Address */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "কমিউনিটি কার্যালয় / যোগাযোগের ঠিকানা", en: "Office / Meeting Address" })}
                          </label>
                          <input
                            type="text"
                            disabled={isSubmitting}
                            value={communityAddress}
                            onChange={(e) => setCommunityAddress(e.target.value)}
                            className={inputNoIconCls}
                            placeholder="e.g. Sector 4, Uttara, Dhaka"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 2C. ORGANISATION & SIGNATORY DETAILS ── */}
                  {entityType === "organisation" && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-emerald-100/70 pb-2 text-emerald-800">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          {t({
                            bn: "প্রতিষ্ঠান ও অনুমোদিত প্রতিনিধির তথ্য (Organisation & Signatory Details)",
                            en: "Organisation & Signatory Details",
                          })}
                        </h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Company Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "প্রতিষ্ঠানের পূর্ণ নাম", en: "Company Legal Name" })} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className={inputNoIconCls}
                            placeholder="e.g. Apex Agrotech Limited"
                          />
                        </div>

                        {/* Business Type */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "প্রতিষ্ঠানের ধরন", en: "Business Entity Type" })} <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className={inputNoIconCls}
                          >
                            <option value="Private Limited Company">Private Limited Company (প্রাইভেট লিমিটেড)</option>
                            <option value="Public Limited Company">Public Limited Company (পাবলিক লিমিটেড)</option>
                            <option value="Partnership Firm">Partnership Firm (অংশীদারি কারবার)</option>
                            <option value="Sole Proprietorship">Sole Proprietorship (একমালিকানা প্রতিষ্ঠান)</option>
                            <option value="NGO / Non-Profit / Trust">NGO / Non-Profit / Trust (এনজিও / ট্রাস্ট)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Trade License */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "ট্রেড লাইসেন্স বা আরজেএসসি নং", en: "Trade License / RJSC Reg No." })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <FileBadge className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              disabled={isSubmitting}
                              value={tradeLicense}
                              onChange={(e) => setTradeLicense(e.target.value)}
                              className={inputCls}
                              placeholder="TRAD/DNCC/123456/2025"
                            />
                          </div>
                        </div>

                        {/* Authorized Signatory */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "অনুমোদিত প্রতিনিধির নাম", en: "Authorized Signatory Name" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              disabled={isSubmitting}
                              value={signatoryName}
                              onChange={(e) => setSignatoryName(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. Tanvir Ahmed"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Signatory Designation */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "প্রতিনিধির পদবি", en: "Signatory Designation" })} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={signatoryDesignation}
                            onChange={(e) => setSignatoryDesignation(e.target.value)}
                            className={inputNoIconCls}
                            placeholder="e.g. Managing Director / CEO"
                          />
                        </div>

                        {/* Office Address */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {t({ bn: "কার্যালয়ের ঠিকানা", en: "Office Address" })} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              disabled={isSubmitting}
                              value={officeAddress}
                              onChange={(e) => setOfficeAddress(e.target.value)}
                              className={inputCls}
                              placeholder="e.g. Level 7, Tower 1, Gulshan-2, Dhaka"
                            />
                          </div>
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
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
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
                              value={facebookPage}
                              onChange={(e) => setFacebookPage(e.target.value)}
                              className={inputCls}
                              placeholder="https://facebook.com/mycompany"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════ SECTION 3: BUYER INVESTMENT PREFERENCES ══════════════ */}
                  {userType === "buyer" && (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-sky-100/70 pb-2 text-sky-900">
                        <TrendingUp className="h-4 w-4 text-sky-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          {t({ bn: "বায়ারের বিনিয়োগ পছন্দসমূহ", en: "Buyer Investment Preferences" })}
                        </h3>
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
                              <option value="Commercial Real Estate">Commercial Real Estate (বাণিজ্যিক রিয়েল এস্টেট)</option>
                              <option value="Agriculture & Agro">Agriculture & Agro (কৃষি ও ডেইরি)</option>
                              <option value="Renewable Energy">Renewable Energy (নবায়নযোগ্য শক্তি)</option>
                              <option value="Hotel & Resort">Hotel & Resort (হোটেল ও রিসোর্ট)</option>
                              <option value="Technology">Technology (প্রযুক্তি ও স্টার্টআপ)</option>
                              <option value="Transport">Transport (পরিবহন)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Interested Location */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          {t({ bn: "আগ্রহী প্রজেক্ট লোকেশন / জেলা", en: "Interested Project Location" })}
                        </label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            disabled={isSubmitting}
                            value={buyerInterestedLocation}
                            onChange={(e) => setBuyerInterestedLocation(e.target.value)}
                            className={inputCls}
                            placeholder="e.g. ঢাকা, চট্টগ্রাম, সিলেট, কক্সবাজার"
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

                </div>

                {/* STATIC PINNED FOOTER */}
                <div className="shrink-0 px-6 py-3.5 sm:px-10 sm:py-4 border-t border-slate-100 bg-white/95 backdrop-blur-xs shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.03)]">
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3 text-sm font-semibold transition active:scale-[0.99] ${
                      !isFormValid || isSubmitting
                        ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                        : "bg-ink-950 text-white shadow-xl shadow-ink-950/20 hover:bg-ink-800"
                    }`}
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

                  <p className="mt-2 text-center text-xs text-slate-500">
                    {t({ bn: "ইতিমধ্যে অ্যাকাউন্ট আছে?", en: "Already have an account?" })}{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      {t({ bn: "লগইন করুন", en: "Sign in" })}
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
