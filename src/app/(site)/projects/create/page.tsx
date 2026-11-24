"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Upload,
  ShieldCheck,
  Info,
  FileText,
  CheckCircle2,
  Lock,
  LogIn,
  UserPlus,
  User,
  Users,
  Building2,
  Briefcase,
  Sparkles,
  Check,
  MapPin,
  FileBadge,
  Globe,
  Hash,
  FileCheck,
  ScrollText,
  BadgeCheck,
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

type UserType = "individual" | "community" | "organisation";

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

  // User / Role Type
  const [userType, setUserType] = useState<UserType>("individual");

  // Project Form State
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
    // Creator / Contact details
    creatorName: "",
    creatorEmail: "",
    creatorPhone: "",
    companyName: "",
    // Role specific dynamic fields
    nidNumber: "",
    profession: "",
    designation: "",
    memberCount: 0,
    communityRegNo: "",
    businessType: "Private Limited Company",
    tradeLicenseNo: "",
    tinBinNo: "",
    websiteUrl: "",
    officeAddress: "",
  });

  // Role-specific Upload Cards State
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
      if (user) {
        const u = user as Record<string, any>;
        setForm((prev) => ({
          ...prev,
          creatorName: prev.creatorName || String(u.name || ""),
          creatorEmail: prev.creatorEmail || String(u.email || ""),
          creatorPhone: String(prev.creatorPhone || u.phone || u.mobileNo || ""),
        }));
      }
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

  // Handler for uploading files into specific role-based card slots
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

    // 1. General Project Details
    if (!form.name || !form.categoryId || !form.description || !form.location) {
      toast.error(
        t({
          bn: "প্রজেক্টের সাধারণ তথ্য (নাম, ক্যাটাগরি, লোকেশন ও বিবরণ) পূরণ করুন",
          en: "Please fill in all basic project fields (Name, Category, Location, Description)",
        })
      );
      return;
    }

    // 2. Role-Specific Profile Validation
    if (userType === "individual") {
      if (!form.creatorName) {
        toast.error(t({ bn: "উদ্যোক্তার পূর্ণ নাম প্রদান করুন", en: "Please enter creator's full name" }));
        return;
      }
      if (!form.nidNumber) {
        toast.error(t({ bn: "জাতীয় পরিচয়পত্র (NID) নম্বর আবশ্যক", en: "National ID (NID) number is required" }));
        return;
      }
      if (!form.creatorEmail || !form.creatorPhone) {
        toast.error(t({ bn: "ইমেইল ও মোবাইল নম্বর আবশ্যক", en: "Email and phone number are required" }));
        return;
      }
    } else if (userType === "community") {
      if (!form.companyName) {
        toast.error(t({ bn: "কমিউনিটি বা সমিতির নাম আবশ্যক", en: "Community / Association name is required" }));
        return;
      }
      if (!form.creatorName || !form.designation) {
        toast.error(
          t({
            bn: "প্রধান প্রতিনিধির নাম এবং পদবি উল্লেখ করুন",
            en: "Lead representative name and designation are required",
          })
        );
        return;
      }
      if (!form.creatorEmail || !form.creatorPhone) {
        toast.error(t({ bn: "যোগাযোগের ইমেইল ও মোবাইল নম্বর দিন", en: "Contact email and phone are required" }));
        return;
      }
      if (!form.memberCount || form.memberCount <= 0) {
        toast.error(t({ bn: "কমিউনিটির মোট সদস্য সংখ্যা উল্লেখ করুন", en: "Total community members count is required" }));
        return;
      }
    } else if (userType === "organisation") {
      if (!form.companyName) {
        toast.error(t({ bn: "কোম্পানি বা প্রতিষ্ঠানের নিবন্ধিত নাম আবশ্যক", en: "Registered Company Name is required" }));
        return;
      }
      if (!form.tradeLicenseNo) {
        toast.error(
          t({
            bn: "ট্রেড লাইসেন্স বা আরজেএসসি ইনকর্পোরেশন নম্বর দিন",
            en: "Trade License / RJSC Incorporation number is required",
          })
        );
        return;
      }
      if (!form.creatorName || !form.designation) {
        toast.error(
          t({
            bn: "অনুমোদিত পরিচালক বা প্রতিনিধির নাম ও পদবি দিন",
            en: "Authorized signatory name and designation are required",
          })
        );
        return;
      }
      if (!form.creatorEmail || !form.creatorPhone) {
        toast.error(t({ bn: "কর্পোরেট ইমেইল ও মোবাইল নম্বর দিন", en: "Official corporate email and phone are required" }));
        return;
      }
    }

    // 3. Investment Structure Validation
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

    // 4. Section 4 Role-based Card Documents Validation:
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

    if (userType === "individual") {
      // Individual: only 1 card required (projectImages). Necessary PDF document card is optional.
    } else if (userType === "community") {
      if (!slotFiles["resolutionDoc"] || slotFiles["resolutionDoc"].length === 0) {
        toast.error(
          t({
            bn: "সমিতির রেজোলিউশন বা যৌথ সভার কার্যবিবরণী কপি আপলোড করা আবশ্যক",
            en: "Community resolution / minutes copy upload is required",
          })
        );
        return;
      }
      if (!slotFiles["memberListDoc"] || slotFiles["memberListDoc"].length === 0) {
        toast.error(
          t({
            bn: "সদস্য তালিকা ও স্বাক্ষর শিট আপলোড করা আবশ্যক",
            en: "Member list and signatures upload is required",
          })
        );
        return;
      }
    } else if (userType === "organisation") {
      if (!slotFiles["tradeLicenseDoc"] || slotFiles["tradeLicenseDoc"].length === 0) {
        toast.error(
          t({
            bn: "হালনাগাদ ট্রেড লাইসেন্স কপি আপলোড করা আবশ্যক",
            en: "Trade License copy upload is required",
          })
        );
        return;
      }
      if (!slotFiles["incorpDoc"] || slotFiles["incorpDoc"].length === 0) {
        toast.error(
          t({
            bn: "ইনকর্পোরেশন সার্টিফিকেট বা আরজেএসসি নিবন্ধন কপি আপলোড আবশ্যক",
            en: "Incorporation certificate / RJSC registration is required",
          })
        );
        return;
      }
      if (!slotFiles["tinDoc"] || slotFiles["tinDoc"].length === 0) {
        toast.error(
          t({
            bn: "কোম্পানির ই-টিন বা ট্যাক্স রিটার্ন সার্টিফিকেট আপলোড আবশ্যক",
            en: "TIN / Tax return certificate upload is required",
          })
        );
        return;
      }
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
      await createPublicShareProject({
        ...form,
        userType,
        images: projectImages.map((i) => ({ url: i.url, title: i.title })),
        documents: allDocs,
      });
      setSubmitted(true);
      toast.success(
        t({
          bn: "প্রজেক্ট সাবমিট হয়েছে ও অনুমোদনের অপেক্ষায় রয়েছে",
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

  // Reusable Role-Specific Upload Card Component
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
                  setUserType("individual");
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
                    creatorName: "",
                    creatorEmail: "",
                    creatorPhone: "",
                    companyName: "",
                    nidNumber: "",
                    profession: "",
                    designation: "",
                    memberCount: 0,
                    communityRegNo: "",
                    businessType: "Private Limited Company",
                    tradeLicenseNo: "",
                    tinBinNo: "",
                    websiteUrl: "",
                    officeAddress: "",
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
                bn: "প্রজেক্টের তথ্য, বিনিয়োগ পরিকল্পনা এবং ক্রিয়েটার পরিচিতি প্রদান করুন। অ্যাডমিন যাচাই-বাছাইয়ের পর অনুমোদন প্রদান করবেন।",
                en: "Provide project details, investment structure, and creator details. Admin will verify and publish.",
              })}
            </p>
          </div>

          {/* ══════════════ USER / ENTITY TYPE SELECTOR (DROPDOWN ONLY) ══════════════ */}
          <div className="mb-10 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="max-w-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <label htmlFor="userTypeSelect" className="text-sm font-bold text-slate-900">
                    {t({ bn: "উদ্যোক্তা বা ইউজারের ধরন (Select User Role)", en: "User / Creator Role" })}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t({
                    bn: "আপনি কোন ধরনের ইউজার হিসেবে প্রজেক্টটি জমা দিচ্ছেন নির্বাচন করুন (Individual, Community বা Organisation)। রোল অনুযায়ী নিচের তথ্য ও ডকুমেন্টস কার্ড পরিবর্তিত হবে।",
                    en: "Select whether you are submitting as an Individual, Community or Organisation. Required fields and document cards will adapt accordingly.",
                  })}
                </p>
              </div>

              <div className="w-full sm:w-72 shrink-0">
                <select
                  id="userTypeSelect"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserType)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="individual">{t({ bn: "👤 Individual (ব্যক্তিগত উদ্যোগ)", en: "👤 Individual Creator" })}</option>
                  <option value="community">{t({ bn: "👥 Community (কমিউনিটি বা সমবায়)", en: "👥 Community / Group" })}</option>
                  <option value="organisation">{t({ bn: "🏢 Organisation (প্রতিষ্ঠান বা কোম্পানি)", en: "🏢 Organisation / Company" })}</option>
                </select>
              </div>
            </div>
          </div>

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
                  <option value="">
                    {loadingLocations
                      ? t({ bn: "লোকেশন এপিআই থেকে জেলা লোড হচ্ছে...", en: "Loading districts from API..." })
                      : t({
                          bn: "-- জেলা ও বিভাগ নির্বাচন করুন (Select District) --",
                          en: "-- Select District & Division --",
                        })}
                  </option>
                  {divisions.map((div) => (
                    <optgroup
                      key={div.id}
                      label={`${div.name} Division (${div.bnName} বিভাগ) — ${div.districts.length}টি জেলা`}
                    >
                      {div.districts.map((dis) => (
                        <option key={dis.id} value={dis.name}>
                          {dis.name} — {dis.bnName} ({div.name} / {div.bnName} বিভাগ)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Conditional Entity / Venture / Brand Name */}
              <div>
                <label className={labelStyle}>
                  {userType === "individual"
                    ? t({ bn: "উদ্যোগের নাম বা ব্র্যান্ড (ঐচ্ছিক)", en: "Venture / Brand Name (Optional)" })
                    : userType === "community"
                    ? t({ bn: "কমিউনিটি বা সমিতির নাম (Community Name) *", en: "Community / Group Name *" })
                    : t({ bn: "কোম্পানি বা প্রতিষ্ঠানের নিবন্ধিত নাম *", en: "Registered Company Name *" })}
                </label>
                <input
                  type="text"
                  required={userType !== "individual"}
                  placeholder={
                    userType === "individual"
                      ? t({ bn: "যেমন: গ্রিন এগ্রো এন্টারপ্রাইজ", en: "e.g., Green Agro Enterprise" })
                      : userType === "community"
                      ? t({ bn: "যেমন: উত্তরা যুব সমবায় সমিতি", en: "e.g., Uttara Youth Cooperative" })
                      : t({ bn: "যেমন: স্কাইলাইন ডেভেলপার্স লিঃ", en: "e.g., Skyline Developers Ltd." })
                  }
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Description */}
              <div className="md:col-span-2">
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্টের পূর্ণ বিবরণ (Project Description)", en: "Project Description" })}{" "}
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

          {/* ══════════════ SECTION 2: DYNAMIC CREATOR / ENTITY DETAILS ══════════════ */}
          <div className="mb-10 border-t border-slate-100 pt-8">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  2
                </span>
                {userType === "individual"
                  ? t({ bn: "উদ্যোক্তার ব্যক্তিগত পরিচিতি (Creator Profile)", en: "Individual Creator Details" })
                  : userType === "community"
                  ? t({ bn: "কমিউনিটি ও প্রতিনিধির তথ্য (Community & Representative)", en: "Community & Representative Details" })
                  : t({ bn: "প্রতিষ্ঠান ও অনুমোদিত প্রতিনিধির তথ্য (Organisation Details)", en: "Organisation & Signatory Details" })}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 w-fit">
                {userType === "individual" && <User className="h-3.5 w-3.5 text-emerald-600" />}
                {userType === "community" && <Users className="h-3.5 w-3.5 text-emerald-600" />}
                {userType === "organisation" && <Building2 className="h-3.5 w-3.5 text-emerald-600" />}
                <span className="capitalize">{userType} mode</span>
              </span>
            </div>

            {/* Profile Fields Container */}
            <div className="rounded-3xl border border-slate-200/90 bg-slate-50/60 p-6 sm:p-7 shadow-xs">
              {/* ───────────────── 2A. INDIVIDUAL USER FIELDS ───────────────── */}
              {userType === "individual" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl px-3 py-1.5 w-fit border border-emerald-100">
                    <User className="h-3.5 w-3.5" />
                    <span>{t({ bn: "ব্যক্তিগত উদ্যোক্তা ভেরিফিকেশন ফিল্ড", en: "Individual Creator Verification Fields" })}</span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    {/* Full Name */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "আপনার পূর্ণ নাম (Full Name)", en: "Full Name" })} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        placeholder={t({ bn: "যেমন: মোহাম্মদ রহিম", en: "e.g., Mohammad Rahim" })}
                        value={form.creatorName}
                        onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* NID / Passport (Required for Individual) */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "জাতীয় পরিচয়পত্র (NID) নম্বর", en: "National ID (NID) Number" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="1987654321098"
                        value={form.nidNumber}
                        onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Profession / Occupation */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "পেশা / কর্মসংস্থান (Profession)", en: "Profession / Occupation" })}
                      </label>
                      <input
                        type="text"
                        placeholder={t({ bn: "যেমন: সফটওয়্যার ইঞ্জিনিয়ার / ব্যবসায়ী", en: "e.g., Business Owner / Engineer" })}
                        value={form.profession}
                        onChange={(e) => setForm({ ...form, profession: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "ব্যক্তিগত ইমেইল (Email Address)", en: "Personal Email Address" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="name@example.com"
                        value={form.creatorEmail}
                        onChange={(e) => setForm({ ...form, creatorEmail: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "মোবাইল নাম্বার (Mobile Number)", en: "Mobile Number" })} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="017xxxxxxxx"
                        value={form.creatorPhone}
                        onChange={(e) => setForm({ ...form, creatorPhone: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Present Address */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "বর্তমান ঠিকানা (Present Address)", en: "Present Address" })}
                      </label>
                      <input
                        type="text"
                        placeholder={t({ bn: "যেমন: বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা", en: "e.g., House 12, Road 5, Dhanmondi, Dhaka" })}
                        value={form.officeAddress}
                        onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                        className={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ───────────────── 2B. COMMUNITY / COOPERATIVE FIELDS ───────────────── */}
              {userType === "community" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl px-3 py-1.5 w-fit border border-emerald-100">
                    <Users className="h-3.5 w-3.5" />
                    <span>{t({ bn: "কমিউনিটি ও সমবায় পরিচিতি ফিল্ড", en: "Community & Cooperative Entity Fields" })}</span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    {/* Community / Cooperative Name */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "সমিতি বা ক্লাবের নাম (Community Name)", en: "Community / Group Name" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        placeholder={t({ bn: "যেমন: ঢাকা গ্রিন ইনভেস্টরস ক্লাব", en: "e.g., Dhaka Green Investors Club" })}
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Representative Name */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "প্রধান প্রতিনিধির নাম (Lead Representative)", en: "Lead Representative Name" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        placeholder={t({ bn: "যেমন: রফিকুল ইসলাম", en: "e.g., Rafiqul Islam" })}
                        value={form.creatorName}
                        onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Designation in Community */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "প্রতিনিধির পদবি (Designation)", en: "Designation in Community" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        placeholder={t({ bn: "যেমন: সভাপতি / সাধারণ সম্পাদক / কনভেনার", en: "e.g., President / Secretary / Lead" })}
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Total Members */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "কমিউনিটি সদস্য সংখ্যা (Total Members)", en: "Total Community Members" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min={2}
                        placeholder="50"
                        value={form.memberCount || ""}
                        onChange={(e) => setForm({ ...form, memberCount: Number(e.target.value) })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "যোগাযোগের ইমেইল (Contact Email)", en: "Contact Email" })} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="community@example.com"
                        value={form.creatorEmail}
                        onChange={(e) => setForm({ ...form, creatorEmail: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "মোবাইল নাম্বার (Contact Phone)", en: "Contact Phone Number" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="017xxxxxxxx"
                        value={form.creatorPhone}
                        onChange={(e) => setForm({ ...form, creatorPhone: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Community Reg No */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "সমিতি বা ক্লাবের নিবন্ধন নং (ঐচ্ছিক)", en: "Association Reg No. (Optional)" })}
                      </label>
                      <input
                        type="text"
                        placeholder="REG-2024-987"
                        value={form.communityRegNo}
                        onChange={(e) => setForm({ ...form, communityRegNo: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Community Office Address */}
                    <div className="md:col-span-2">
                      <label className={labelStyle}>
                        {t({ bn: "কমিউনিটি কার্যালয়ের ঠিকানা (Office Address)", en: "Office / Meeting Address" })}
                      </label>
                      <input
                        type="text"
                        placeholder={t({ bn: "যেমন: সেক্টর ৪, উত্তরা, ঢাকা", en: "e.g., Sector 4, Uttara, Dhaka" })}
                        value={form.officeAddress}
                        onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                        className={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ───────────────── 2C. ORGANISATION / CORPORATE FIELDS ───────────────── */}
              {userType === "organisation" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl px-3 py-1.5 w-fit border border-emerald-100">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{t({ bn: "প্রতিষ্ঠান ও কর্পোরেট প্রোফাইল ফিল্ড", en: "Organisation & Corporate Verification Fields" })}</span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    {/* Legal Company Name */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "প্রতিষ্ঠানের পূর্ণ নাম (Legal Entity Name)", en: "Company Legal Name" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        placeholder={t({ bn: "যেমন: অ্যাপেক্স অ্যাগ্রোটেক লিমিটেড", en: "e.g., Apex Agrotech Limited" })}
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Entity Business Type */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "প্রতিষ্ঠানের ধরন (Business Type)", en: "Business Entity Type" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.businessType}
                        onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                        className={inputStyle}
                      >
                        <option value="Private Limited Company">{t({ bn: "প্রাইভেট লিমিটেড কোম্পানি", en: "Private Limited Company" })}</option>
                        <option value="Public Limited Company">{t({ bn: "পাবলিক লিমিটেড কোম্পানি", en: "Public Limited Company" })}</option>
                        <option value="Partnership Firm">{t({ bn: "অংশীদারি কারবার (Partnership)", en: "Partnership Firm" })}</option>
                        <option value="Sole Proprietorship">{t({ bn: "একমালিকানা প্রতিষ্ঠান (Proprietorship)", en: "Sole Proprietorship" })}</option>
                        <option value="NGO / Non-Profit / Trust">{t({ bn: "এনজিও / ট্রাস্ট / অলাভজনক", en: "NGO / Trust / Non-Profit" })}</option>
                      </select>
                    </div>

                    {/* Trade License / RJSC Registration No */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "ট্রেড লাইসেন্স বা আরজেএসসি নং", en: "Trade License / RJSC Reg No." })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        placeholder="TRAD/DNCC/123456/2025"
                        value={form.tradeLicenseNo}
                        onChange={(e) => setForm({ ...form, tradeLicenseNo: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Authorized Person Name */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "অনুমোদিত প্রতিনিধির নাম (Signatory)", en: "Authorized Signatory Name" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        placeholder={t({ bn: "যেমন: তানভীর আহমেদ", en: "e.g., Tanvir Ahmed" })}
                        value={form.creatorName}
                        onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Designation */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "প্রতিনিধির পদবি (Designation)", en: "Designation" })} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        placeholder={t({ bn: "যেমন: Managing Director / CEO", en: "e.g., Managing Director / CEO" })}
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Official Email */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "অফিসিয়াল ইমেইল (Official Email)", en: "Official Corporate Email" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="corporate@company.com"
                        value={form.creatorEmail}
                        onChange={(e) => setForm({ ...form, creatorEmail: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Official Phone */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "অফিসিয়াল ফোন (Official Phone)", en: "Official Phone Number" })}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="+88017xxxxxxxx"
                        value={form.creatorPhone}
                        onChange={(e) => setForm({ ...form, creatorPhone: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* TIN / BIN Number */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "TIN বা BIN নম্বর (ঐচ্ছিক)", en: "TIN / BIN Number (Optional)" })}
                      </label>
                      <input
                        type="text"
                        placeholder="TIN: 123456789012"
                        value={form.tinBinNo}
                        onChange={(e) => setForm({ ...form, tinBinNo: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className={labelStyle}>
                        {t({ bn: "অফিসিয়াল ওয়েবসাইট (Website URL)", en: "Official Website URL" })}
                      </label>
                      <input
                        type="url"
                        placeholder="https://company.com"
                        value={form.websiteUrl}
                        onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                        className={inputStyle}
                      />
                    </div>

                    {/* Registered Corporate Office */}
                    <div className="md:col-span-3">
                      <label className={labelStyle}>
                        {t({ bn: "নিবন্ধিত কর্পোরেট অফিসের ঠিকানা", en: "Registered Corporate Office Address" })}
                      </label>
                      <input
                        type="text"
                        placeholder={t({ bn: "লেভেল ৫, গুলশান সেন্টার পয়েন্ট, গুলশান ২, ঢাকা ১২১২", en: "Level 5, Gulshan Center Point, Gulshan 2, Dhaka 1212" })}
                        value={form.officeAddress}
                        onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                        className={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════ SECTION 3: INVESTMENT & TIMELINE ══════════════ */}
          <div className="mb-10 border-t border-slate-100 pt-8">
            <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                3
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

          {/* ══════════════ SECTION 4: ROLE-BASED DYNAMIC MEDIA & DOCUMENTS CARDS ══════════════ */}
          <div className="mb-10 border-t border-slate-100 pt-8">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    4
                  </span>
                  {t({ bn: "প্রজেক্টের ছবি ও কাগজপত্র (Media & Documents)", en: "Project Media & Documents" })}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {userType === "individual"
                    ? t({
                        bn: "ব্যক্তিগত উদ্যোগের জন্য ২টি কার্ড (১টি আবশ্যক ছবি কার্ড ও ১টি প্রয়োজনীয় PDF ফাইল কার্ড)।",
                        en: "2 document cards for Individual (1 Required Image card & 1 Optional PDF file card).",
                      })
                    : userType === "community"
                    ? t({
                        bn: "কমিউনিটি বা সমবায় উদ্যোগের জন্য ৫টি কার্ড (৩টি আবশ্যক ও ২টি ঐচ্ছিক নথি)।",
                        en: "5 document cards for Community (3 Required & 2 Optional).",
                      })
                    : t({
                        bn: "প্রতিষ্ঠান বা কর্পোরেট উদ্যোগের জন্য ৬টি কার্ড (৪টি আবশ্যক ও ২টি ঐচ্ছিক নথি)।",
                        en: "6 document cards for Organisation (4 Required & 2 Optional).",
                      })}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-100">
                <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  {userType === "individual" && t({ bn: "মোট ২টি কার্ড", en: "Total 2 Cards" })}
                  {userType === "community" && t({ bn: "মোট ৫টি কার্ড", en: "Total 5 Cards" })}
                  {userType === "organisation" && t({ bn: "মোট ৬টি কার্ড", en: "Total 6 Cards" })}
                </span>
              </span>
            </div>

            {/* ───────────────── 4A. INDIVIDUAL: 2 CARDS (1 Required Image, 1 Optional PDF) ───────────────── */}
            {userType === "individual" && (
              <div className="grid gap-5 sm:grid-cols-2">
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

                {renderUploadCard(
                  "necessaryDoc",
                  t({ bn: "২. প্রয়োজনীয় কাগজপত্র ও ডকুমেন্টস (PDF)", en: "2. Necessary Documents / PDF File" }),
                  t({
                    bn: "উদ্যোক্তার NID, জমির দলিল, প্রসপেক্টাস বা প্রয়োজনীয় অন্যান্য কাগজপত্র ফাইল যুক্ত করুন (PDF, DOCX)।",
                    en: "Attach NID copy, land deed, prospectus or any necessary project documents (PDF, DOCX).",
                  }),
                  false,
                  <Upload className="h-4 w-4" />,
                  ".pdf,.doc,.docx,image/*",
                  true
                )}
              </div>
            )}

            {/* ───────────────── 4B. COMMUNITY: 5 CARDS (3 Required, 2 Optional) ───────────────── */}
            {userType === "community" && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {renderUploadCard(
                  "projectImages",
                  t({ bn: "১. প্রজেক্ট ও সাইটের ছবি", en: "1. Project Images (Multiple)" }),
                  t({
                    bn: "কমিউনিটি বা সমবায় প্রকল্পের স্পষ্ট ছবি (PNG, JPG, WEBP)। একাধিক ছবি নির্বাচনযোগ্য।",
                    en: "Upload clear images of project area & location (PNG, JPG, WEBP).",
                  }),
                  true,
                  <ImagePlus className="h-4 w-4" />,
                  "image/*",
                  true
                )}

                {renderUploadCard(
                  "resolutionDoc",
                  t({ bn: "২. সমিতির রেজোলিউশন কপি", en: "2. Community Resolution / Minutes" }),
                  t({
                    bn: "যৌথ সভার সিদ্ধান্ত, শেয়ার অফারিংয়ের অনুমোদন সংক্রান্ত সভার রেজোলিউশন কপি (PDF)।",
                    en: "Resolution copy of executive committee meeting approving this share offering (PDF).",
                  }),
                  true,
                  <FileText className="h-4 w-4" />,
                  ".pdf,.doc,.docx,image/*"
                )}

                {renderUploadCard(
                  "memberListDoc",
                  t({ bn: "৩. সদস্য তালিকা ও স্বাক্ষর শিট", en: "3. Member List & Signatures" }),
                  t({
                    bn: "কমিউনিটির সক্রিয় সদস্যদের নাম, পদবি এবং প্রতিনিধির অনুমোদিত স্বাক্ষর শিট (PDF, DOCX)।",
                    en: "Official member list with signatures of lead representative / president (PDF, DOCX).",
                  }),
                  true,
                  <Users className="h-4 w-4" />,
                  ".pdf,.doc,.docx"
                )}

                {renderUploadCard(
                  "regCertDoc",
                  t({ bn: "৪. সমিতি বা ক্লাব নিবন্ধন সনদ (ঐচ্ছিক)", en: "4. Association Reg Certificate" }),
                  t({
                    bn: "সরকারি সমবায় অধিদপ্তর বা সমাজসেবা কার্যালয়ের অফিসিয়াল নিবন্ধন সনদ (যদি থাকে)।",
                    en: "Government cooperative department or society registration certificate (if registered).",
                  }),
                  false,
                  <BadgeCheck className="h-4 w-4" />,
                  ".pdf,.jpg,.jpeg,.png"
                )}

                {renderUploadCard(
                  "bylawDoc",
                  t({ bn: "৫. গঠনতন্ত্র বা বাই-ল কপি (ঐচ্ছিক)", en: "5. By-laws & Constitution Copy" }),
                  t({
                    bn: "সমিতির পরিচালনা সংক্রান্ত গঠনতন্ত্র, নিয়মাবলী বা বাই-ল ডকুমেন্ট ফাইল (PDF)।",
                    en: "Cooperative by-laws, constitution rules and operating policies document (Optional).",
                  }),
                  false,
                  <Upload className="h-4 w-4" />,
                  ".pdf,.doc,.docx"
                )}
              </div>
            )}

            {/* ───────────────── 4C. ORGANISATION: 6 CARDS (4 Required, 2 Optional) ───────────────── */}
            {userType === "organisation" && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {renderUploadCard(
                  "projectImages",
                  t({ bn: "১. প্রজেক্ট ছবি ও প্রেজেন্টেশন", en: "1. Project Images & Presentation" }),
                  t({
                    bn: "বাণিজ্যিক সাইট, মডেল, থ্রিডি রেন্ডার বা প্রজেক্ট ছবি (PNG, JPG, WEBP)।",
                    en: "Commercial project renders, site photos and presentation visuals (Multiple).",
                  }),
                  true,
                  <ImagePlus className="h-4 w-4" />,
                  "image/*",
                  true
                )}

                {renderUploadCard(
                  "tradeLicenseDoc",
                  t({ bn: "২. হালনাগাদ ট্রেড লাইসেন্স", en: "2. Trade License Copy" }),
                  t({
                    bn: "সিটি কর্পোরেশন / পৌরসভার চলতি অর্থবছরের নবায়নকৃত ট্রেড লাইসেন্স কপি (PDF, JPG)।",
                    en: "Up-to-date trade license copy renewed for current fiscal year (PDF, JPG).",
                  }),
                  true,
                  <FileBadge className="h-4 w-4" />,
                  ".pdf,.jpg,.jpeg,.png"
                )}

                {renderUploadCard(
                  "incorpDoc",
                  t({ bn: "৩. ইনকর্পোরেশন বা আরজেএসসি সনদ", en: "3. RJSC Incorporation / Reg" }),
                  t({
                    bn: "RJSC সার্টিফিকেট অব ইনকর্পোরেশন অথবা অংশীদারি ফার্মের পার্টনারশিপ ডিড কপি (PDF)।",
                    en: "RJSC Certificate of Incorporation or registered partnership deed (PDF).",
                  }),
                  true,
                  <Building2 className="h-4 w-4" />,
                  ".pdf,.jpg,.jpeg,.png"
                )}

                {renderUploadCard(
                  "tinDoc",
                  t({ bn: "৪. ই-টিন ও ট্যাক্স রিটার্ন সনদ", en: "4. Corporate e-TIN & Tax Return" }),
                  t({
                    bn: "কোম্পানির ১২ ডিজিটের ই-টিন সার্টিফিকেট ও সর্বশেষ আয়কর রিটার্ন দাখিলের স্লিপ (PDF)।",
                    en: "Company e-TIN certificate & latest income tax acknowledgment receipt (PDF).",
                  }),
                  true,
                  <FileText className="h-4 w-4" />,
                  ".pdf,.jpg,.jpeg,.png"
                )}

                {renderUploadCard(
                  "boardResDoc",
                  t({ bn: "৫. বোর্ড রেজোলিউশন / POA (ঐচ্ছিক)", en: "5. Board Resolution / Power of Attorney" }),
                  t({
                    bn: "শেয়ার বিক্রয় ও ফান্ড সংগ্রহের পক্ষে পরিচালকদের বোর্ড রেজোলিউশন অথবা পাওয়ার অব অ্যাটর্নি।",
                    en: "Board of Directors resolution approving the share issue or authorization letter.",
                  }),
                  false,
                  <Upload className="h-4 w-4" />,
                  ".pdf,.doc,.docx"
                )}

                {renderUploadCard(
                  "auditDoc",
                  t({ bn: "৬. অডিট রিপোর্ট বা প্রসপেক্টাস (ঐচ্ছিক)", en: "6. Audited Financials / Prospectus" }),
                  t({
                    bn: "সিএ ফার্ম কর্তৃক নিরীক্ষিত আর্থিক বিবরণী বা বিস্তারিত বিনিয়োগ প্রসপেক্টাস ব্রোশিউর।",
                    en: "Audited financial statements by chartered accountants or investment brochure (Optional).",
                  }),
                  false,
                  <Upload className="h-4 w-4" />,
                  ".pdf,.doc,.docx"
                )}
              </div>
            )}
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
                bn: "সাবমিট করার পর আপনার ইমেইল ও মোবাইল দিয়ে আপনার প্রজেক্ট স্ট্যাটাস ট্র্যাক করতে পারবেন।",
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
