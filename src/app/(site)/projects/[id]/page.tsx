"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Coins,
  Download,
  ExternalLink,
  FileText,
  Lock,
  LogIn,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/lib/i18n";
import { getProjectDefaultImage } from "@/lib/project-defaults";
import {
  getPublicProject,
  requestPublicInvestment,
} from "@/lib/share-project-api";

interface ProjectDoc {
  title: string;
  url: string;
  fileType?: string;
}

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, taka, num } = useLang();

  const [project, setProject] = useState<{
    id: string;
    name: { bn: string; en: string };
    location: { bn: string; en: string };
    category: { bn: string; en: string };
    status: string;
    image: string;
    pricePerShare: number;
    totalShares: number;
    soldShares: number;
    returnRate: number;
    duration: { bn: string; en: string };
    description: { bn: string; en: string };
    documents: ProjectDoc[];
  } | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [investmentError, setInvestmentError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Requirement 2: Investor Type dropdown (INDIVIDUAL vs ORGANIZATION) & fields without password
  const [investorType, setInvestorType] = useState<
    "INDIVIDUAL" | "ORGANIZATION"
  >("INDIVIDUAL");
  const [individualForm, setIndividualForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [orgForm, setOrgForm] = useState({
    organizationName: "",
    organizationLocation: "",
    email: "",
    officePhone: "",
    representativeName: "",
    organizationDesignation: "",
    representativePhone: "",
    tradeLicenseNumber: "",
  });

  // Requirement 4: Post-investment modal with 2 buttons
  const [showModal, setShowModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    code?: string;
    projectName?: string;
    quantity?: number;
    totalAmount?: number;
  } | null>(null);

  const available = project
    ? Math.max(0, project.totalShares - project.soldShares)
    : 0;
  const total = project ? project.pricePerShare * quantity : 0;
  const fee = Math.round(total * 0.01);

  useEffect(() => {
    void getPublicProject(params.id)
      .then((row: any) => {
        const rawDocs = row.documents || [];
        const parsedDocs: ProjectDoc[] = rawDocs.map((doc: any) => {
          if (typeof doc === "string") {
            return { title: doc.split("/").pop() || "Document", url: doc };
          }
          return {
            title: doc.title || "Project Document",
            url: doc.url || "#",
            fileType: doc.fileType || "PDF",
          };
        });

        setProject({
          id: row.uuid,
          name: { bn: row.name, en: row.name },
          location: { bn: row.location || "", en: row.location || "" },
          category: {
            bn: row.category?.name || "",
            en: row.category?.name || "",
          },
          status: "funding",
          image:
            row.thumbnailUrl ||
            row.images?.[0]?.url ||
            getProjectDefaultImage(row.category?.name),
          pricePerShare: Number(row.pricePerShare || 0),
          totalShares: Number(row.totalShares || 0),
          soldShares: 0,
          returnRate: Number(row.expectedAnnualReturn || 0),
          duration: {
            bn:
              row.startDate && row.endDate
                ? `${String(row.startDate).slice(0, 10)} - ${String(row.endDate).slice(0, 10)}`
                : "",
            en:
              row.startDate && row.endDate
                ? `${String(row.startDate).slice(0, 10)} - ${String(row.endDate).slice(0, 10)}`
                : "",
          },
          description: { bn: row.description || "", en: row.description || "" },
          documents: parsedDocs,
        });
      })
      .catch(() => setProject(null));
  }, [params.id]);

  const percent = useMemo(
    () =>
      project && project.totalShares
        ? Math.round((project.soldShares / project.totalShares) * 100)
        : 0,
    [project],
  );

  const handleSubmitInvestment = async (event: React.FormEvent) => {
    event.preventDefault();
    setInvestmentError("");

    let payload: any = {
      projectUuid: params.id,
      quantity,
      investorType,
    };

    if (investorType === "INDIVIDUAL") {
      if (
        !individualForm.name.trim() ||
        !individualForm.email.trim() ||
        !individualForm.phone.trim()
      ) {
        toast.error(
          t({
            bn: "অনুগ্রহ করে সকল ফিল্ড পূরণ করুন",
            en: "Please fill in all individual investor fields",
          }),
        );
        return;
      }
      payload = {
        ...payload,
        name: individualForm.name.trim(),
        email: individualForm.email.trim(),
        phone: individualForm.phone.trim(),
      };
    } else {
      if (
        !orgForm.organizationName.trim() ||
        !orgForm.organizationLocation.trim() ||
        !orgForm.email.trim() ||
        !orgForm.officePhone.trim() ||
        !orgForm.representativeName.trim() ||
        !orgForm.organizationDesignation.trim()
      ) {
        toast.error(
          t({
            bn: "অর্গানাইজেশনের প্রয়োজনীয় সকল তথ্য (নাম, লোকেশন, ইমেইল, অফিস ফোন, প্রতিনিধির নাম ও পদবী) পূরণ করুন",
            en: "Please fill in all required organization fields (Name, Location, Email, Office Phone, Rep Name & Designation)",
          }),
        );
        return;
      }
      payload = {
        ...payload,
        name:
          orgForm.representativeName.trim() || orgForm.organizationName.trim(),
        email: orgForm.email.trim(),
        phone: orgForm.officePhone.trim() || orgForm.representativePhone.trim(),
        organizationName: orgForm.organizationName.trim(),
        organizationLocation: orgForm.organizationLocation.trim(),
        organizationPhone: orgForm.officePhone.trim(),
        representativePhone: orgForm.representativePhone.trim(),
        organizationRepresentativeName: orgForm.representativeName.trim(),
        organizationDesignation: orgForm.organizationDesignation.trim(),
        tradeLicenseNumber: orgForm.tradeLicenseNumber.trim(),
      };
    }

    setSubmitting(true);
    try {
      const res: any = await requestPublicInvestment(payload);
      try {
        localStorage.setItem(
          "share-project:guest-investor",
          JSON.stringify({
            email: payload.email,
            phone: payload.phone,
            name: payload.name,
            code: res?.code,
          }),
        );
      } catch {
        /* ignore */
      }

      setSubmittedData({
        code: res?.code,
        projectName: project ? t(project.name) : "",
        quantity,
        totalAmount: total + fee,
      });
      setConfirmed(true);
      setShowModal(true);
      toast.success(
        t({
          bn: "ইনভেস্টমেন্ট অনুরোধ সফলভাবে গ্রহণ করা হয়েছে",
          en: "Investment request submitted successfully",
        }),
      );
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Could not submit investment request.";
      setInvestmentError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-50 pb-20 pt-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Back button skeleton */}
          <div className="mb-5 h-5 w-24 animate-pulse rounded bg-slate-200" />

          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            {/* Banner skeleton */}
            <div className="relative h-[280px] sm:h-[420px] w-full animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
              <div className="absolute bottom-0 left-0 p-6 sm:p-10 space-y-3">
                <div className="h-6 w-32 rounded-full bg-slate-300" />
                <div className="h-10 w-72 sm:w-96 rounded-xl bg-slate-300" />
                <div className="h-4 w-48 rounded bg-slate-300" />
              </div>
            </div>

            <div className="grid gap-8 p-6 lg:grid-cols-[1fr_420px] sm:p-10">
              {/* Left Column Skeleton */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="h-6 w-40 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-slate-100 animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse p-4 space-y-2">
                      <div className="h-3 w-16 rounded bg-slate-200" />
                      <div className="h-6 w-20 rounded bg-slate-300" />
                    </div>
                  ))}
                </div>

                <div className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
              </div>

              {/* Right Column Skeleton */}
              <div className="space-y-4 rounded-3xl border border-slate-200 p-6 bg-slate-50/50">
                <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
                <div className="h-12 w-full rounded-2xl bg-slate-200 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-12 w-full rounded-2xl bg-emerald-100 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 pb-20 pt-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t({ bn: "পেছনে", en: "Back" })}
        </button>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          {/* Banner */}
          <div className="relative h-[280px] sm:h-[420px]">
            <Image
              src={project.image}
              alt={t(project.name)}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white sm:p-10">
              <span className="rounded-full bg-emerald-500/90 px-3.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                {t(project.category)}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl">
                {t(project.name)}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/90">
                <MapPin className="h-4 w-4 text-emerald-400" />
                {t(project.location)}
              </p>
            </div>
          </div>

          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_420px] sm:p-10">
            {/* Left Column: Details & Documents */}
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {t({ bn: "প্রজেক্ট পরিচিতি", en: "Project overview" })}
              </h2>
              <p className="mt-3 max-w-3xl leading-relaxed text-slate-600 whitespace-pre-line">
                {t(project.description)}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    l: { bn: "শেয়ার মূল্য", en: "Share price" },
                    v: taka(project.pricePerShare),
                  },
                  {
                    l: { bn: "প্রত্যাশিত রিটার্ন", en: "Expected return" },
                    v: `${num(project.returnRate)}%`,
                  },
                  {
                    l: { bn: "মেয়াদ", en: "Duration" },
                    v: t(project.duration)?.split(" ")[0] || "১ বছর",
                  },
                  {
                    l: { bn: "উপলব্ধ শেয়ার", en: "Available shares" },
                    v: num(available),
                  },
                ].map((x) => (
                  <div
                    key={x.l.en}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-xs text-slate-400">{t(x.l)}</p>
                    <p className="mt-2 font-bold text-slate-900">{x.v}</p>
                  </div>
                ))}
              </div>

              {/* Investment Highlights & Investor Benefits */}
              <div className="mt-10 border-t border-slate-100 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      {t({
                        bn: "বিনিয়োগ সুবিধা ও প্রজেক্ট হাইলাইটস",
                        en: "Investment Highlights & Benefits",
                      })}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {t({
                        bn: "নিরাপদ বিনিয়োগ, নিয়মিত লভ্যাংশ বণ্টন ও নিশ্চিত মূলধন সুরক্ষা সুবিধা",
                        en: "Secured ownership, regular dividend yield & capital safety highlights",
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/20">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                        <ShieldCheck className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {t({ bn: "আইনি শেয়ার মালিকানা", en: "Legal Share Ownership" })}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t({
                            bn: "চুক্তিপত্র ও সার্টিফিকেট দ্বারা প্রতিটি শেয়ারের আইনি স্বত্ব নিশ্চিত।",
                            en: "Legally binding deed & official share allocation certificate.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/20">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                        <TrendingUp className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {t({ bn: "বার্ষিক ডিভিডেন্ড রিটার্ন", en: "Annual Dividend Yield" })}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t({
                            bn: "প্রজেক্টের মুনাফা থেকে নিয়মিত আকর্ষণীয় ডিভিডেন্ড ব্যাংক অ্যাকাউন্টে জমা।",
                            en: "Direct profit share distributed periodically into your bank account.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/20">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Coins className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {t({ bn: "মূলধনী প্রবৃদ্ধি", en: "Capital Appreciation" })}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t({
                            bn: "সম্পদের বাজারমূল্য বৃদ্ধির সাথে সাথে আপনার শেয়ারের ক্যাপিটাল বৃদ্ধি।",
                            en: "Asset value increment boosts the secondary value of your share.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/20">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {t({ bn: "স্বচ্ছ নিরীক্ষা ও ট্র্যাকিং", en: "Audited & Transparent" })}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t({
                            bn: "নিয়মিত আর্থিক বিবরণী এবং বিনিয়োগকারী ড্যাশবোর্ডে সার্বক্ষণিক হিসাব।",
                            en: "Periodic audit reports & real-time updates on investor dashboard.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3 text-xs text-emerald-800">
                  <Lock className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    {t({
                      bn: "রিয়েলবিজ প্রো এনক্রিপ্টেড প্লাটফর্ম দ্বারা প্রতিটি লেনদেন ও বিনিয়োগ সুরক্ষিত।",
                      en: "All transactions and share allocations are verified and secured via RealBiz Pro.",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Aside: Investment Form */}
            <aside className="h-fit rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  {t({
                    bn: "শেয়ার বিক্রয় অগ্রগতি",
                    en: "Shares sold progress",
                  })}
                </span>
                <span className="font-bold text-slate-800">{percent}%</span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Quantity Selector */}
              <label className="mt-6 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t({ bn: "শেয়ার পরিমাণ (Quantity)", en: "Share Quantity" })}
              </label>
              <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2">
                <button
                  type="button"
                  onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <strong className="text-xl font-extrabold text-slate-900">
                  {num(quantity)}
                </strong>
                <button
                  type="button"
                  onClick={() => setQuantity((v) => Math.min(available, v + 1))}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  disabled={available > 0 && quantity >= available}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Calculation Summary */}
              <div className="mt-5 space-y-2.5 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>{t({ bn: "শেয়ার মূল্য", en: "Share value" })}</span>
                  <span className="font-semibold text-slate-700">
                    {taka(total)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>
                    {t({ bn: "সেবা ফি (১%)", en: "Service fee (1%)" })}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {taka(fee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
                  <span>
                    {t({ bn: "সর্বমোট বিনিয়োগ", en: "Total Amount" })}
                  </span>
                  <span className="text-emerald-700">{taka(total + fee)}</span>
                </div>
              </div>

              {investmentError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 font-medium">
                  {investmentError}
                </div>
              )}

              {confirmed ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h4 className="font-bold text-emerald-900 mb-1">
                    {t({ bn: "অনুরোধ জমা হয়েছে!", en: "Request Submitted!" })}
                  </h4>
                  <p className="text-xs text-emerald-700 mb-4 leading-relaxed">
                    {t({
                      bn: "এডমিনের পর্যালোচনার পর কনফার্মেশন পাবেন।",
                      en: "You will receive confirmation after Admin review.",
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                  >
                    {t({
                      bn: "বিস্তারিত কনফার্মেশন দেখুন",
                      en: "View confirmation details",
                    })}
                  </button>
                </div>
              ) : (
                <form
                  className="mt-6 space-y-4"
                  onSubmit={handleSubmitInvestment}
                >
                  {/* Requirement 2: Investor Type Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      {t({
                        bn: "বায়ারের ধরণ নির্বাচন করুন",
                        en: "Select Buyer Type",
                      })}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInvestorType("INDIVIDUAL")}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                          investorType === "INDIVIDUAL"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <User className="h-4 w-4" />
                        {t({ bn: "সাধারণ ইউজার", en: "Individual" })}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvestorType("ORGANIZATION")}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                          investorType === "ORGANIZATION"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                        {t({ bn: "অর্গানাইজেশন", en: "Organization" })}
                      </button>
                    </div>
                  </div>

                  {/* Form fields based on Investor Type (NO PASSWORD FIELD) */}
                  {investorType === "INDIVIDUAL" ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t({ bn: "আপনার পুরো নাম", en: "Full Name" })}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder={t({
                            bn: "যেমন: কাজী নজরুল",
                            en: "e.g. Kazi Nazrul",
                          })}
                          value={individualForm.name}
                          onChange={(e) =>
                            setIndividualForm({
                              ...individualForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t({ bn: "মোবাইল নাম্বার", en: "Phone Number" })}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="tel"
                          placeholder="017xxxxxxxx"
                          value={individualForm.phone}
                          onChange={(e) =>
                            setIndividualForm({
                              ...individualForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t({ bn: "ইমেইল অ্যাড্রেস", en: "Email Address" })}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          placeholder="investor@example.com"
                          value={individualForm.email}
                          onChange={(e) =>
                            setIndividualForm({
                              ...individualForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Organization Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t({
                            bn: "অর্গানাইজেশনের নাম",
                            en: "Organization Name",
                          })}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder={t({
                            bn: "প্রতিষ্ঠানের পুরো নাম (যেমন: অ্যাপেক্স লিমিটেড)",
                            en: "e.g. Apex Holdings Ltd.",
                          })}
                          value={orgForm.organizationName}
                          onChange={(e) =>
                            setOrgForm({
                              ...orgForm,
                              organizationName: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Organization Location */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t({
                            bn: "অর্গানাইজেশনের লোকেশন / অফিস ঠিকানা",
                            en: "Organization Location / Office Address",
                          })}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder={t({
                            bn: "যেমন: রোড ১২, গুলশান-২, ঢাকা",
                            en: "e.g. Road 12, Gulshan-2, Dhaka",
                          })}
                          value={orgForm.organizationLocation}
                          onChange={(e) =>
                            setOrgForm({
                              ...orgForm,
                              organizationLocation: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Official Email */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t({ bn: "অফিসিয়াল ইমেইল", en: "Official Email" })}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          placeholder="info@company.com"
                          value={orgForm.email}
                          onChange={(e) =>
                            setOrgForm({ ...orgForm, email: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Office Phone Number */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t({
                            bn: "অফিস ফোন নাম্বার",
                            en: "Office Phone Number",
                          })}{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="tel"
                          placeholder="02-xxxxxxx বা 017xxxxxxxx"
                          value={orgForm.officePhone}
                          onChange={(e) =>
                            setOrgForm({
                              ...orgForm,
                              officePhone: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Representative Name & Designation */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {t({ bn: "প্রতিনিধির নাম", en: "Rep. Name" })}{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            placeholder={t({
                              bn: "প্রতিনিধির নাম",
                              en: "Representative Name",
                            })}
                            value={orgForm.representativeName}
                            onChange={(e) =>
                              setOrgForm({
                                ...orgForm,
                                representativeName: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {t({ bn: "পদবী (Designation)", en: "Designation" })}{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Managing Director / CEO"
                            value={orgForm.organizationDesignation}
                            onChange={(e) =>
                              setOrgForm({
                                ...orgForm,
                                organizationDesignation: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Representative Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t({
                            bn: "প্রতিনিধির মোবাইল নাম্বার",
                            en: "Representative Phone Number",
                          })}
                        </label>
                        <input
                          type="tel"
                          placeholder="017xxxxxxxx"
                          value={orgForm.representativePhone}
                          onChange={(e) =>
                            setOrgForm({
                              ...orgForm,
                              representativePhone: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {submitting
                      ? t({ bn: "অনুরোধ পাঠানো হচ্ছে...", en: "Submitting..." })
                      : t({
                          bn: "বায়ার অনুরোধ পাঠান",
                          en: "Submit purchase request",
                        })}
                  </button>
                </form>
              )}

              <Link
                href="/dashboard/my-investments"
                className="mt-4 block text-center text-xs font-semibold text-emerald-600 hover:underline"
              >
                {t({
                  bn: "আমার ক্রয় / বিনিয়োগ দেখুন",
                  en: "View my purchases",
                })}
              </Link>
            </aside>
          </div>
        </div>
      </div>

      {/* Requirement 4: Post-Investment Confirmation Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t({
                  bn: "ক্রয় অনুরোধ সফলভাবে গৃহীত হয়েছে!",
                  en: "Purchase Request Submitted Successfully!",
                })}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                {t({
                  bn: "আপনার ক্রয় অনুরোধটি এডমিনের রিভিউ এর জন্য জমা হয়েছে। একটি নিশ্চিতকরণ ইমেইলও পাঠানো হয়েছে।",
                  en: "Your purchase request is pending Admin review. A confirmation email has also been sent.",
                })}
              </p>
            </div>

            {/* Summary Details */}
            {submittedData && (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">
                    {t({ bn: "ট্র্যাকিং কোড:", en: "Tracking Code:" })}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {submittedData.code}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">
                    {t({ bn: "প্রজেক্ট:", en: "Project:" })}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {submittedData.projectName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">
                    {t({ bn: "শেয়ার সংখ্যা:", en: "Shares Quantity:" })}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {submittedData.quantity}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">
                    {t({ bn: "মোট পরিমাণ:", en: "Total Amount:" })}
                  </span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ৳{Number(submittedData.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Prompt */}
            <p className="mt-6 text-center text-xs font-semibold text-slate-700">
              {t({
                bn: "আপনি কি ড্যাশবোর্ডে যেতে চান? (ড্যাশবোর্ড ব্যবহারের জন্য লগইন করতে হবে)",
                en: "Would you like to go to the Dashboard? (Login is required to access the dashboard)",
              })}
            </p>

            {/* Modal Actions (2 Buttons as requested) */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push("/login?redirect=/dashboard/my-investments")
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-700"
              >
                <LogIn className="h-4 w-4" />
                {t({
                  bn: "ড্যাশবোর্ডে যান (লগইন)",
                  en: "Go to Dashboard (Login)",
                })}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                {t({ bn: "এই পেজেই থাকুন", en: "Stay on this page" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
