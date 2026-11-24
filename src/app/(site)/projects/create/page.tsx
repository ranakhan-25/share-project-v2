"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Upload,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Lock,
  LogIn,
  UserPlus,
  Check,
  Building2,
  Users,
  User,
  Sparkles,
  FileCheck,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/lib/i18n";
import {
  createPublicShareProject,
  getPublicCategories,
  getPublicLocations,
  LocationDivision,
} from "@/lib/share-project-api";
import { BANGLADESH_DIVISIONS_DATA } from "@/lib/locations-data";
import {
  getStoredAccessToken,
  getStoredUser,
} from "@/lib/admin-auth/adminAuthStorage";

interface UploadedFileItem {
  url: string;
  title: string;
  fileName: string;
}

export default function CreatePublicProjectPage() {
  const router = useRouter();
  const { t } = useLang();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [divisions, setDivisions] = useState<LocationDivision[]>(BANGLADESH_DIVISIONS_DATA);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Project Form State (Purely Project Specific - User/Creator data comes from registration profile)
  const [form, setForm] = useState({
    name: "",
    categoryId: 0,
    description: "",
    location: "",
    totalInvestmentAmount: 0,
    totalShares: 0,
    pricePerShare: 0,
    minimumInvestment: 0,
    expectedAnnualReturn: 0,
    startDate: "",
    endDate: "",
  });

  // Project Documents & Media State
  const [slotFiles, setSlotFiles] = useState<Record<string, UploadedFileItem[]>>({});

  useEffect(() => {
    // Check if user is logged in
    const token = getStoredAccessToken();
    if (!token) {
      setIsLoggedIn(false);
      setShowLoginModal(true);
    } else {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      const user = getStoredUser();
      setCurrentUser(user);
    }

    void getPublicCategories()
      .then((rows) => setCategories(rows.map((row) => ({ id: row.id, name: row.name }))))
      .catch(() => setCategories([]));

    setLoadingLocations(true);
    void getPublicLocations()
      .then((res: any) => {
        const list = res?.divisions || res?.data?.divisions || (Array.isArray(res) ? res : []);
        if (list && list.length > 0) {
          setDivisions(list);
        }
      })
      .catch((err) => {
        console.warn("Locations API fallback used:", err);
      })
      .finally(() => {
        setLoadingLocations(false);
      });
  }, []);

  const isBuyer = useMemo(() => {
    if (!currentUser) return false;
    const email = String(currentUser.email || "").toLowerCase();
    if (email === "owner@shareproject.com") return false;
    const role = String(currentUser.role || "").toLowerCase();
    const uType = String(currentUser.userType || currentUser.user_type || "").toLowerCase();
    const profileRole = String(currentUser.profile?.role || "").toLowerCase();
    return (
      role === "investor" ||
      role === "buyer" ||
      role.includes("buyer") ||
      role.includes("investor") ||
      uType === "investor" ||
      uType === "buyer" ||
      profileRole === "buyer" ||
      profileRole === "investor" ||
      email === "sharetest@realbiz.com"
    );
  }, [currentUser]);

  // Handler for uploading files into specific card slots
  const handleSlotFiles = (
    slotKey: string,
    slotTitle: string,
    files: FileList | null,
    isMultiple: boolean = false
  ) => {
    if (!files?.length) return;
    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const asset: UploadedFileItem = {
          url: String(reader.result || ""),
          title: `${slotTitle} (${file.name})`,
          fileName: file.name,
        };
        setSlotFiles((prev) => {
          const current = prev[slotKey] || [];
          return {
            ...prev,
            [slotKey]: isMultiple ? [...current, asset] : [asset],
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSlotFiles = (slotKey: string) => {
    setSlotFiles((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  // Helper for auto-calculating price per share
  const handleInvestmentChange = (field: "target" | "shares", val: number) => {
    setForm((prev) => {
      const next = { ...prev };
      if (field === "target") next.totalInvestmentAmount = val;
      if (field === "shares") next.totalShares = val;

      if (next.totalShares > 0 && next.totalInvestmentAmount > 0) {
        next.pricePerShare = Math.round(next.totalInvestmentAmount / next.totalShares);
        if (!next.minimumInvestment) {
          next.minimumInvestment = next.pricePerShare;
        }
      }
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!getStoredAccessToken()) {
      setShowLoginModal(true);
      return;
    }

    if (isBuyer) {
      toast.error(
        t({
          bn: "বায়ার অ্যাকাউন্ট থেকে প্রজেক্ট তৈরি করার অনুমতি নেই।",
          en: "Buyer accounts are not permitted to create projects.",
        })
      );
      return;
    }

    // 1. General Project Details Validation
    if (!form.name || !form.categoryId || !form.description || !form.location) {
      toast.error(
        t({
          bn: "প্রজেক্টের সাধারণ তথ্য (নাম, ক্যাটাগরি, লোকেশন ও বিবরণ) পূরণ করুন",
          en: "Please fill in all basic project fields (Name, Category, Location, Description)",
        })
      );
      return;
    }

    // 2. Investment Structure Validation
    if (form.totalShares <= 0 || form.pricePerShare <= 0 || form.totalInvestmentAmount <= 0) {
      toast.error(
        t({
          bn: "সঠিক বিনিয়োগ ও শেয়ার সংখ্যা প্রদান করুন",
          en: "Please provide valid investment and share details",
        })
      );
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error(
        t({
          bn: "প্রজেক্টের শুরুর ও সমাপ্তির তারিখ নির্বাচন করুন",
          en: "Please specify start and end dates",
        })
      );
      return;
    }

    // 3. Project Media Validation
    const projectImages = slotFiles["projectImages"] || [];
    if (projectImages.length === 0) {
      toast.error(
        t({
          bn: "অনুগ্রহ করে কমপক্ষে ১টি প্রজেক্ট ছবি আপলোড করুন (ছবি কার্ড আবশ্যক)",
          en: "Please upload at least 1 project image (Images card is required)",
        })
      );
      return;
    }

    // Bundle all document slots into documents payload
    const allDocs: Array<{ url: string; title: string }> = [];
    Object.entries(slotFiles).forEach(([key, items]) => {
      if (key !== "projectImages") {
        items.forEach((item) => allDocs.push({ url: item.url, title: item.title }));
      }
    });

    setSaving(true);
    try {
      const u = (currentUser as Record<string, any>) || {};
      const p = (u.profile as Record<string, any>) || {};

      await createPublicShareProject({
        ...form,
        // Auto-supplied from logged-in user profile saved during registration
        creatorName: u.name || "Seller",
        creatorEmail: u.email || "seller@realbiz.com",
        creatorPhone: u.phone || u.mobileNo || p.phone || "01700000000",
        companyName: p.companyName || p.communityName || "",
        userType: p.entityType || u.userType || "individual",
        nidNumber: p.nidNumber || "",
        profession: p.profession || "",
        designation: p.designation || p.signatoryDesignation || p.communityDesignation || "",
        memberCount: Number(p.memberCount || 0),
        communityRegNo: p.communityRegNo || "",
        businessType: p.businessType || "Private Limited Company",
        tradeLicenseNo: p.tradeLicense || p.tradeLicenseNo || "",
        websiteUrl: p.website || "",
        officeAddress: p.officeAddress || p.presentAddress || p.communityAddress || "",
        images: projectImages.map((i) => ({ url: i.url, title: i.title })),
        documents: allDocs,
      });

      setSubmitted(true);
      toast.success(
        t({
          bn: "প্রজেক্ট সাবমিট হয়েছে ও পর্যালোচনার জন্য জমা হয়েছে",
          en: "Project submitted and is pending Admin review",
        })
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : t({ bn: "প্রজেক্ট তৈরি করা যায়নি", en: "Could not create project" })
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20";
  const labelStyle = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide";

  // Reusable Document / Media Upload Card Component
  const renderUploadCard = (
    slotKey: string,
    title: string,
    subtitle: string,
    isRequired: boolean,
    icon: React.ReactNode,
    accept: string = ".pdf,.doc,.docx,image/*",
    isMultiple: boolean = false
  ) => {
    const currentFiles = slotFiles[slotKey] || [];
    const hasFiles = currentFiles.length > 0;

    return (
      <div
        key={slotKey}
        className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition duration-200 ${
          hasFiles
            ? "border-emerald-400 bg-emerald-50/25 shadow-xs"
            : isRequired
            ? "border-slate-300 bg-slate-50/70 hover:border-emerald-300 hover:bg-slate-50"
            : "border-dashed border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`grid h-8.5 w-8.5 shrink-0 place-items-center rounded-xl transition ${
                  hasFiles
                    ? "bg-emerald-600 text-white"
                    : isRequired
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {icon}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                {title}
              </h4>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isRequired
                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {isRequired ? t({ bn: "আবশ্যক *", en: "Required *" }) : t({ bn: "ঐচ্ছিক", en: "Optional" })}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
            {subtitle}
          </p>
        </div>

        <div>
          <label className="block cursor-pointer">
            <input
              type="file"
              multiple={isMultiple}
              accept={accept}
              onChange={(e) => handleSlotFiles(slotKey, title, e.target.files, isMultiple)}
              className="block w-full text-xs text-slate-500 file:mr-2.5 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
          </label>

          {hasFiles && (
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5">
              <span className="truncate text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="h-3 w-3 shrink-0" />
                <span>
                  {currentFiles.length} {t({ bn: "টি ফাইল সংযুক্ত", en: "file(s) attached" })}
                  {currentFiles[0] && ` — ${currentFiles[0].fileName}`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeSlotFiles(slotKey)}
                className="shrink-0 text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
              >
                {t({ bn: "মুছুন", en: "Remove" })}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (submitted) {
    return (
      <main className="bg-slate-50 pb-20 pt-28 min-h-[70vh] flex items-center">
        <div className="mx-auto max-w-xl px-5 text-center">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {t({ bn: "প্রজেক্ট সফলভাবে জমা হয়েছে!", en: "Project Submitted Successfully!" })}
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              {t({
                bn: "আপনার প্রজেক্টটি অ্যাডমিন রিভিউ করবেন। অনুমোদিত হলে এটি পাবলিক প্রজেক্ট তালিকায় দৃশ্যমান হবে।",
                en: "Your project has been submitted for Admin review. Once approved, it will be published to the public portal.",
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/projects"
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                {t({ bn: "অন্যান্য প্রজেক্ট দেখুন", en: "Browse Projects" })}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: "",
                    categoryId: 0,
                    description: "",
                    location: "",
                    totalInvestmentAmount: 0,
                    totalShares: 0,
                    pricePerShare: 0,
                    minimumInvestment: 0,
                    expectedAnnualReturn: 0,
                    startDate: "",
                    endDate: "",
                  });
                  setSlotFiles({});
                }}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                {t({ bn: "আরেকটি প্রজেক্ট তৈরি করুন", en: "Create Another Project" })}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isBuyer) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-28">
        <div className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-white p-8 sm:p-10 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Lock className="h-8 w-8" />
          </div>
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            {t({ bn: "অনুমতি নেই", en: "Access Restricted" })}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {t({ bn: "বায়ার অ্যাকাউন্ট থেকে প্রজেক্ট তৈরি করা যাবে না", en: "Buyers cannot create projects" })}
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {t({
              bn: "আপনার অ্যাকাউন্টটি বায়ার হিসেবে নিবন্ধিত। শুধুমাত্র সেলার (বিক্রেতা) অ্যাকাউন্ট থেকে নতুন প্রজেক্ট তৈরি ও তালিকাভুক্ত করা যায়।",
              en: "Your account is registered as a Buyer. Only Seller accounts can create and list projects.",
            })}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/investments"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              {t({ bn: "বায়ার পোর্টাল দেখুন", en: "Go to Buyer Portal" })}
            </Link>
            <Link
              href="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {t({ bn: "প্রজেক্টসমূহ ব্রাউজ করুন", en: "Browse Projects" })}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const userProfile = currentUser?.profile || {};
  const userRole = String(currentUser?.role || currentUser?.userType || "Seller");
  const entityType = String(userProfile.entityType || currentUser?.userType || "individual");

  return (
    <main className="bg-slate-50 pb-20 pt-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Link
          href="/projects"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t({ bn: "সকল প্রজেক্টে ফিরে যান", en: "Back to projects" })}
        </Link>

        <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="h-4 w-4" />
              {t({ bn: "পাবলিক প্রজেক্ট সাবমিশন পোর্টাল", en: "Public Project Submission Portal" })}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t({ bn: "নতুন প্রজেক্ট তৈরি ও প্রস্তাব করুন", en: "Create and Submit a New Project" })}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {t({
                bn: "প্রজেক্টের তথ্য, বিনিয়োগ পরিকল্পনা এবং প্রয়োজনীয় নথিপত্র প্রদান করুন। উদ্যোক্তার প্রোফাইল তথ্য আপনার রেজিস্ট্রেশন অ্যাকাউন্ট থেকে স্বয়ংক্রিয়ভাবে যুক্ত হবে।",
                en: "Provide project specifications, investment structure, and documents. Creator profile is automatically linked from your registered account.",
              })}
            </p>
          </div>

          {/* ══════════════ REGISTERED USER PROFILE BADGE ══════════════ */}
          {currentUser && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  {entityType === "organisation" ? (
                    <Building2 className="h-5 w-5" />
                  ) : entityType === "community" ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {currentUser.name || t({ bn: "রেজিস্টার্ড উদ্যোক্তা", en: "Registered Creator" })}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 capitalize">
                      {entityType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {currentUser.email} {currentUser.phone ? `• ${currentUser.phone}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-xs text-emerald-700 font-semibold bg-white/80 border border-emerald-200/80 rounded-xl px-3 py-1.5 w-fit">
                ✓ {t({ bn: "রেজিস্ট্রেশনের প্রোফাইল সংযুক্ত", en: "Profile details linked from registration" })}
              </div>
            </div>
          )}

          {/* ══════════════ SECTION 1: BASIC INFORMATION ══════════════ */}
          <div className="mb-10">
            <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                1
              </span>
              {t({ bn: "প্রজেক্টের সাধারণ তথ্য (Basic Information)", en: "Basic Project Information" })}
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Field: Project Name */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্টের নাম (Project Name)", en: "Project Name" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  placeholder={t({ bn: "যেমন: ধানমন্ডি কমার্শিয়াল স্কয়ার", en: "e.g., Dhanmondi Commercial Square" })}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Category */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্ট ক্যাটাগরি (Category)", en: "Project Category" })} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                  className={inputStyle}
                >
                  <option value={0}>{t({ bn: "-- ক্যাটাগরি নির্বাচন করুন --", en: "-- Select Category --" })}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field: Location / District with Division */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    {t({ bn: "লোকেশন  (District)", en: "Location (District & Division)" })}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {loadingLocations ? t({ bn: "API লোড হচ্ছে...", en: "API Loading..." }) : ``}
                  </span>
                </div>
                <select
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={inputStyle}
                >
                  <option value="">{t({ bn: "-- জেলা নির্বাচন করুন --", en: "-- Select District --" })}</option>
                  {divisions.map((division) => (
                    <optgroup key={division.id} label={`${division.name} Division (${division.bnName})`}>
                      {division.districts.map((district) => (
                        <option
                          key={district.id}
                          value={`${district.name}, ${division.name}`}
                        >
                          {district.name} ({district.bnName})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Field: Description */}
              <div className="md:col-span-3">
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্টের বিস্তারিত বিবরণ (Overview & Description)", en: "Project Overview & Details" })}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={t({
                    bn: "প্রজেক্টের অবস্থান, সুবিধা, সম্ভাব্য ভবিষ্যৎ রিটার্ন এবং ব্যবসায়িক পরিকল্পনার বিস্তারিত বিবরণ লিখুন...",
                    en: "Write detailed overview, location advantages, potential returns, and business plans...",
                  })}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputStyle} min-h-28`}
                />
              </div>
            </div>
          </div>

          {/* ══════════════ SECTION 2: INVESTMENT & TIMELINE ══════════════ */}
          <div className="mb-10 border-t border-slate-100 pt-8">
            <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                2
              </span>
              {t({ bn: "বিনিয়োগ ও মেয়াদ পরিকল্পনা (Investment & Timeline)", en: "Investment & Timeline" })}
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Field: Total Investment */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "মোট বিনিয়োগ লক্ষ্য (টাকা)", en: "Total Target (BDT)" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  min={1}
                  type="number"
                  placeholder="5000000"
                  value={form.totalInvestmentAmount || ""}
                  onChange={(e) => handleInvestmentChange("target", Number(e.target.value))}
                  className={inputStyle}
                />
              </div>

              {/* Field: Total Shares */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "মোট শেয়ার সংখ্যা (Total Shares)", en: "Total Shares" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  min={1}
                  type="number"
                  placeholder="100"
                  value={form.totalShares || ""}
                  onChange={(e) => handleInvestmentChange("shares", Number(e.target.value))}
                  className={inputStyle}
                />
              </div>

              {/* Field: Price Per Share */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    {t({ bn: "প্রতি শেয়ারের মূল্য (টাকা)", en: "Price Per Share (BDT)" })} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {t({ bn: "অটো হিসাব", en: "Auto calculated" })}
                  </span>
                </div>
                <input
                  required
                  min={1}
                  type="number"
                  placeholder="50000"
                  value={form.pricePerShare || ""}
                  onChange={(e) => setForm({ ...form, pricePerShare: Number(e.target.value) })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Minimum Investment */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "সর্বনিম্ন বিনিয়োগ (টাকা)", en: "Minimum Investment (BDT)" })}
                </label>
                <input
                  min={0}
                  type="number"
                  placeholder="50000"
                  value={form.minimumInvestment || ""}
                  onChange={(e) => setForm({ ...form, minimumInvestment: Number(e.target.value) })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Expected Return */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রত্যাশিত বাৎসরিক রিটার্ন (%)", en: "Expected Return (%)" })}
                </label>
                <input
                  min={0}
                  max={100}
                  step="0.1"
                  type="number"
                  placeholder="18.5"
                  value={form.expectedAnnualReturn || ""}
                  onChange={(e) => setForm({ ...form, expectedAnnualReturn: Number(e.target.value) })}
                  className={inputStyle}
                />
              </div>

              {/* Spacer */}
              <div className="hidden md:block" />

              {/* Field: Start Date */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্ট শুরুর তারিখ (Start Date)", en: "Start Date" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className={inputStyle}
                />
              </div>

              {/* Field: End Date */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্ট সমাপ্তির তারিখ (End Date)", en: "End Date" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* ══════════════ SECTION 3: PROJECT MEDIA & DOCUMENTS ══════════════ */}
          <div className="mb-10 border-t border-slate-100 pt-8">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    3
                  </span>
                  {t({ bn: "প্রজেক্টের ছবি ও কাগজপত্র (Media & Documents)", en: "Project Media & Documents" })}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t({
                    bn: "প্রজেক্টের ছবি ও প্রাসঙ্গিক নথিপত্র যুক্ত করুন। ছবি কার্ড আবশ্যক, বাকি ডকুমেন্টস ঐচ্ছিক।",
                    en: "Upload project photos and relevant proposal files. Images card is required, other documents are optional.",
                  })}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-100">
                <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>{t({ bn: "মোট ৪টি কার্ড", en: "Total 4 Cards" })}</span>
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Card 1: Project Images (Multiple, Required) */}
              {renderUploadCard(
                "projectImages",
                t({ bn: "১. প্রজেক্টের ছবি সমূহ (Project Images)", en: "1. Project Images (Multiple)" }),
                t({
                  bn: "উচ্চমানের প্রজেক্ট বা সাইটের ছবি যুক্ত করুন (PNG, JPG, WEBP)। একাধিক ছবি নির্বাচন করা যাবে।",
                  en: "Upload high-quality project & site photos (PNG, JPG, WEBP). Multiple files allowed.",
                }),
                true,
                <ImagePlus className="h-4 w-4" />,
                "image/*",
                true
              )}

              {/* Card 2: Brochure / Pitch Deck (Optional) */}
              {renderUploadCard(
                "brochureDoc",
                t({ bn: "২. প্রজেক্ট ব্রোশিউর ও প্রসপেক্টাস (Brochure)", en: "2. Project Brochure / Proposal" }),
                t({
                  bn: "প্রজেক্টের পরিচিতি ব্রোশিউর, প্রেজেন্টেশন বা পিচ ডেক ফাইল যুক্ত করুন (PDF, DOCX)।",
                  en: "Attach detailed project brochure, prospectus or proposal document (PDF, DOCX).",
                }),
                false,
                <FileText className="h-4 w-4" />,
                ".pdf,.doc,.docx"
              )}

              {/* Card 3: Legal Clearances & Approvals (Optional) */}
              {renderUploadCard(
                "legalDoc",
                t({ bn: "৩. অনুমোদন ও আইনি কাগজপত্র (Legal Clearances)", en: "3. Legal Approvals & Clearances" }),
                t({
                  bn: "প্রজেক্ট সংক্রান্ত অনুমোদন, পরিবেশ ছাড়পত্র, রাজউক/পৌরসভা প্ল্যান বা দলিল কপি (PDF/ছবি)।",
                  en: "Govt / municipal approval letters, clearance certificates, or land documents (PDF/JPG).",
                }),
                false,
                <ShieldCheck className="h-4 w-4" />,
                ".pdf,.doc,.docx,image/*",
                true
              )}

              {/* Card 4: Business Plan & Projections (Optional) */}
              {renderUploadCard(
                "financialDoc",
                t({ bn: "৪. আর্থিক পরিকল্পনা ও প্রক্ষেপণ (Financials)", en: "4. Business Plan & Financials" }),
                t({
                  bn: "প্রজেক্টের আয়ের প্রক্ষেপণ, রিটার্ন হিসাব ও ব্যবসায়িক পরিকল্পনা নথি (PDF, Excel)।",
                  en: "Financial projections, revenue model, and estimated cashflow documents (Optional).",
                }),
                false,
                <Briefcase className="h-4 w-4" />,
                ".pdf,.doc,.docx,.xls,.xlsx"
              )}
            </div>
          </div>

          {/* ══════════════ SUBMIT BUTTON ══════════════ */}
          <div className="border-t border-slate-100 pt-6">
            <button
              disabled={saving}
              className="w-full rounded-2xl bg-ink-950 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t({ bn: "প্রজেক্ট সাবমিট হচ্ছে...", en: "Submitting Project..." })}
                </>
              ) : (
                t({ bn: "প্রজেক্ট সাবমিট করুন", en: "Submit Project for Approval" })
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              {t({
                bn: "সাবমিট করার পর আপনার সেলার ড্যাশবোর্ড থেকে প্রজেক্টের স্ট্যাটাস ট্র্যাক করতে পারবেন।",
                en: "After submission, you can track your project review status from your seller dashboard.",
              })}
            </p>
          </div>
        </form>
      </div>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 mb-5">
                <Lock className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900">
                {t({ bn: "লগইন প্রয়োজন", en: "Login Required" })}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                {t({
                  bn: "নতুন শেয়ার প্রজেক্ট তৈরি ও সাবমিট করতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।",
                  en: "Please sign in to your account first to create and submit a new share project.",
                })}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                href="/login?redirect=/projects/create"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-emerald-600 active:scale-[0.99] transition"
              >
                <LogIn className="h-4 w-4" />
                {t({ bn: "লগইন করুন", en: "Sign in to Account" })}
              </Link>

              <Link
                href="/register?redirect=/projects/create"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <UserPlus className="h-4 w-4" />
                {t({ bn: "নতুন অ্যাকাউন্ট তৈরি করুন", en: "Create an Account" })}
              </Link>

              <button
                type="button"
                onClick={() => router.push("/projects")}
                className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 pt-1 transition cursor-pointer"
              >
                ← {t({ bn: "প্রজেক্ট তালিকায় ফিরে যান", en: "Return to projects list" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
