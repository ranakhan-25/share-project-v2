"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  ImageIcon,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Check,
  Sparkles,
  Layers,
  Building2,
  CheckCircle2,
} from "lucide-react";
import {
  BASE_GLOBAL_DEFAULT_IMAGE,
  PRESET_DEFAULT_IMAGES,
  CATEGORY_DEFAULT_IMAGES,
  getAdminCustomDefaultImage,
  getAdminCategoryDefaultImages,
  setAdminCustomDefaultImage,
  setAdminCategoryDefaultImages,
  resetAdminDefaultImages,
  DEFAULT_IMAGE_CHANGED_EVENT,
  compressImageFileToDataUrl,
  getProjectDefaultImage,
} from "@/lib/project-defaults";
import {
  applyDefaultImageToEmptyProjects,
  getProjects,
  updateAdminProjectThumbnail,
  type ShareProjectRecord,
} from "@/lib/admin-share-project-api";
import { useLang } from "@/lib/i18n";
import { showAlert } from "@/lib/swal";

export function AdminProjectImageSettings() {
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentGlobal, setCurrentGlobal] = useState<string>(BASE_GLOBAL_DEFAULT_IMAGE);
  const [inputUrl, setInputUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>(BASE_GLOBAL_DEFAULT_IMAGE);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [projectsList, setProjectsList] = useState<ShareProjectRecord[]>([]);
  const [projectThumbInputs, setProjectThumbInputs] = useState<Record<string, string>>({});
  const [savingProjectUuid, setSavingProjectUuid] = useState<string | null>(null);
  const [applyingDefaults, setApplyingDefaults] = useState(false);

  const loadProjectsForImages = async () => {
    try {
      const list = await getProjects({ limit: 100 });
      setProjectsList(list);
      const map: Record<string, string> = {};
      for (const p of list) {
        if (p.uuid) map[p.uuid] = String(p.thumbnailUrl || "");
      }
      setProjectThumbInputs(map);
    } catch {}
  };

  useEffect(() => {
    void loadProjectsForImages();
  }, []);

  async function handleApplyDefaultToEmptyProjects() {
    const confirmed = await showAlert.confirm(
      t({ bn: "ছবিবিহীন প্রজেক্টে ডিফল্ট ছবি সেট করবেন?", en: "Apply Default Image to Image-less Projects?" }),
      t({
        bn: "যেসব প্রজেক্টে আগে থেকেই ছবি দেওয়া আছে সেগুলো পরিবর্তন হবে না। শুধুমাত্র ছবি ছাড়া প্রজেক্টগুলোতে ডিফল্ট ছবি সেট হবে।",
        en: "Projects that already have a dynamic image will NOT be modified. Only projects with no image will receive this default image.",
      }),
      t({ bn: "হ্যাঁ, অ্যাপ্লাই করুন", en: "Yes, Apply" }),
      "#059669",
    );
    if (!confirmed) return;
    setApplyingDefaults(true);
    try {
      const res: any = await applyDefaultImageToEmptyProjects(previewUrl || BASE_GLOBAL_DEFAULT_IMAGE);
      const count = Number(res?.data?.updatedCount ?? res?.updatedCount ?? 0);
      await showAlert.success(
        t({ bn: "সম্পন্ন!", en: "Applied!" }),
        t({
          bn: `${count}টি ছবিবিহীন প্রজেক্টে ডিফল্ট ছবি সেট করা হয়েছে।`,
          en: `Default image applied to ${count} projects that had no image.`,
        }),
      );
      await loadProjectsForImages();
    } catch (err: any) {
      await showAlert.error("Error", err?.message || "Failed to apply default image");
    } finally {
      setApplyingDefaults(false);
    }
  }

  async function handleSaveSingleProjectImage(uuid: string, nextUrl: string) {
    setSavingProjectUuid(uuid);
    try {
      await updateAdminProjectThumbnail(uuid, nextUrl);
      await showAlert.success(
        t({ bn: "ছবি আপডেট হয়েছে", en: "Image Updated!" }),
        t({ bn: "প্রজেক্টের ছবি সফলভাবে সেভ করা হয়েছে।", en: "Project image saved successfully." }),
      );
      await loadProjectsForImages();
    } catch (err: any) {
      await showAlert.error("Error", err?.message || "Failed to update project image");
    } finally {
      setSavingProjectUuid(null);
    }
  }
  const [activeTab, setActiveTab] = useState<"preset" | "url" | "upload" | "categories">("preset");
  const [isSavedCustom, setIsSavedCustom] = useState(false);

  const loadSettings = () => {
    const custom = getAdminCustomDefaultImage();
    const active = custom || BASE_GLOBAL_DEFAULT_IMAGE;
    setCurrentGlobal(active);
    setPreviewUrl(active);
    setInputUrl(custom || "");
    setIsSavedCustom(Boolean(custom));
    setCategoryOverrides(getAdminCategoryDefaultImages());
  };

  useEffect(() => {
    loadSettings();
    const handleUpdate = () => loadSettings();
    window.addEventListener(DEFAULT_IMAGE_CHANGED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(DEFAULT_IMAGE_CHANGED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleApplyPreset = (url: string) => {
    setPreviewUrl(url);
    setInputUrl(url);
    setAdminCustomDefaultImage(url);
    setIsSavedCustom(true);
    toast.success(
      t({
        bn: "ডিফল্ট প্রজেক্ট ছবি হিসেবে প্রিসেট সেট করা হয়েছে!",
        en: "Preset set as default project image!",
      }),
    );
  };

  const handleSaveUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) {
      toast.error(
        t({
          bn: "অনুগ্রহ করে একটি বৈধ ইমেজ ইউআরএল প্রদান করুন",
          en: "Please provide a valid image URL",
        }),
      );
      return;
    }
    setAdminCustomDefaultImage(inputUrl.trim());
    setPreviewUrl(inputUrl.trim());
    setIsSavedCustom(true);
    toast.success(
      t({
        bn: "নতুন ডিফল্ট প্রজেক্ট ছবি সফলভাবে সংরক্ষিত হয়েছে!",
        en: "New default project image saved successfully!",
      }),
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        t({
          bn: "শুধুমাত্র ছবি (JPG, PNG, WebP) আপলোড করা যাবে",
          en: "Only image files (JPG, PNG, WebP) are allowed",
        }),
      );
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        t({
          bn: "ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে",
          en: "Image size must be at most 5MB",
        }),
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreviewUrl(dataUrl);
        setInputUrl(dataUrl);
        setAdminCustomDefaultImage(dataUrl);
        setIsSavedCustom(true);
        toast.success(
          t({
            bn: "ছবি সফলভাবে আপলোড ও ডিফল্ট হিসেবে সেট হয়েছে!",
            en: "Image uploaded and set as default successfully!",
          }),
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCategoryOverrides = () => {
    setAdminCategoryDefaultImages(categoryOverrides);
    toast.success(
      t({
        bn: "ক্যাটাগরি ভিত্তিক ডিফল্ট ছবি সংরক্ষিত হয়েছে!",
        en: "Category-wise default images saved!",
      }),
    );
  };

  const handleResetToSystem = async () => {
    const confirmed = await showAlert.confirm(
      t({
        bn: "ডিফল্ট ছবি রিসেট করবেন?",
        en: "Reset Default Images?",
      }),
      t({
        bn: "শুধুমাত্র যেসব প্রজেক্টে ডায়নামিক ছবি নেই সেগুলোতে ডিফল্ট ছবি রিসেট হবে। ডায়নামিক ছবিযুক্ত প্রজেক্ট অপরিবর্তিত থাকবে।",
        en: "Only projects without dynamic images will use the reset default image. Projects with custom dynamic images will remain unchanged.",
      }),
      t({ bn: "হ্যাঁ, রিসেট করুন", en: "Yes, Reset" }),
      "#d97706",
    );
    if (!confirmed) return;
    resetAdminDefaultImages();
    loadSettings();
    await showAlert.success(
      t({
        bn: "ডিফল্ট ছবি সেটিংস রিসেট করা হয়েছে",
        en: "Default project image settings reset to original",
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <ImageIcon className="h-3.5 w-3.5" />
            {t({ bn: "প্ল্যাটফর্ম সেটিংস", en: "Platform Settings" })}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
            {t({
              bn: "প্রজেক্টের ডিফল্ট ছবি কনফিগারেশন",
              en: "Default Project Image Configuration",
            })}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            {t({
              bn: "সেলার পোর্টালে অথবা ওয়েবসাইটে যেসকল প্রজেক্টের ছবি বা থাম্বনেইল থাকবে না, ফ্রন্টএন্ডে স্বয়ংক্রিয়ভাবে যে ডিফল্ট ছবি প্রদর্শিত হবে তা এখান থেকে পরিবর্তন করুন।",
              en: "Configure the fallback image automatically displayed across the frontend and seller portal when a project does not have an uploaded image.",
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToSystem}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t({ bn: "সিস্টেম ডিফল্টে রিসেট", en: "Reset to Default" })}
        </button>
      </div>

      {/* Main Grid: Live Preview & Settings Form */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Col: Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t({ bn: "লাইভ কার্ড প্রিভিউ", en: "Live Card Preview" })}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isSavedCustom
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isSavedCustom
                  ? t({ bn: "কাস্টম ছবি সক্রিয়", en: "Custom Image Active" })
                  : t({ bn: "সিস্টেম ডিফল্ট", en: "System Default" })}
              </span>
            </div>

            {/* Mock Project Card */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md">
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Default Project Preview"
                  fill
                  sizes="400px"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  onError={() => setPreviewUrl(BASE_GLOBAL_DEFAULT_IMAGE)}
                />
                <div className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur-xs">
                  Commercial Real Estate
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  14.5% Return
                </div>
              </div>

              <div className="p-4">
                <h4 className="text-base font-bold text-slate-900">
                  {t({
                    bn: "নমুনা প্রজেক্ট (ছবি ছাড়া)",
                    en: "Sample Project (Without Image)",
                  })}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {t({
                    bn: "মতিঝিল বাণিজ্যিক এলাকা, ঢাকা",
                    en: "Motijheel Commercial Area, Dhaka",
                  })}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="font-semibold text-slate-700">
                    {t({ bn: "শেয়ার মূল্য: ৳১০,০০০", en: "Share: ৳10,000" })}
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {t({ bn: "৫০০ শেয়ার বাকি", en: "500 shares left" })}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-400 text-center">
              {t({
                bn: "সেলার পোর্টালের প্রজেক্ট ডিটেইলস, কার্ড ভিউ এবং পাবলিক প্রজেক্ট পেইজে এই ছবিটি দেখাবে।",
                en: "This image will be displayed on seller portal project details and public project cards.",
              })}
            </p>
          </div>
        </div>

        {/* Right Col: Options & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("preset")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                  activeTab === "preset"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t({ bn: "প্রিসেট সিলেক্ট করুন", en: "Select Preset" })}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                  activeTab === "url"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                {t({ bn: "ইমেজ ইউআরএল", en: "Image URL" })}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                  activeTab === "upload"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                {t({ bn: "ছবি আপলোড", en: "Upload Image" })}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition ${
                  activeTab === "categories"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                {t({ bn: "ক্যাটাগরি ভিত্তিক ছবি", en: "By Category" })}
              </button>
            </div>

            {/* TAB CONTENT: PRESETS */}
            {activeTab === "preset" && (
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t({
                      bn: "উচ্চমানের প্রিসেট ছবি থেকে নির্বাচন করুন",
                      en: "Select from High-Quality Presets",
                    })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t({
                      bn: "যেকোনো ছবিতে ক্লিক করলেই তা প্ল্যাটফর্মের প্রধান ডিফল্ট ছবি হিসেবে সক্রিয় হয়ে যাবে।",
                      en: "Click any image to immediately set it as the primary default image.",
                    })}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {PRESET_DEFAULT_IMAGES.map((preset) => {
                    const isSelected = currentGlobal === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset.url)}
                        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all hover:shadow-md ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="relative h-28 w-full bg-slate-100">
                          <Image
                            src={preset.url}
                            alt={t(preset.title)}
                            fill
                            sizes="240px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                          {isSelected && (
                            <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 bg-white">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">
                            {t(preset.title)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: URL */}
            {activeTab === "url" && (
              <form onSubmit={handleSaveUrl} className="mt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t({
                      bn: "কাস্টম ইমেজ লিংক (URL) প্রদান করুন",
                      en: "Provide Custom Image Link (URL)",
                    })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t({
                      bn: "আপনার পছন্দের যেকোনো ক্লাউড বা ওয়েব ইমেজের ডাইরেক্ট লিংক পেস্ট করুন।",
                      en: "Paste any direct image URL from Unsplash, AWS S3, Cloudinary or your server.",
                    })}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t({ bn: "ইমেজ ইউআরএল", en: "Image URL" })}
                  </label>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value);
                      if (e.target.value.startsWith("http")) {
                        setPreviewUrl(e.target.value);
                      }
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t({ bn: "ডিফল্ট ছবি হিসেবে সংরক্ষণ করুন", en: "Save as Default Image" })}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (inputUrl.trim()) setPreviewUrl(inputUrl.trim());
                    }}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {t({ bn: "প্রিভিউ দেখুন", en: "Preview" })}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: UPLOAD */}
            {activeTab === "upload" && (
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t({
                      bn: "কম্পিউটার বা ডিভাইস থেকে ছবি আপলোড করুন",
                      en: "Upload Image from Device",
                    })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t({
                      bn: "যেকোনো JPG, PNG বা WebP ফরম্যাটের ছবি নির্বাচন করুন।",
                      en: "Select any image file in JPG, PNG or WebP format (max 5MB).",
                    })}
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:scale-110">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-800">
                    {t({
                      bn: "ছবি নির্বাচন করতে এখানে ক্লিক করুন",
                      en: "Click here to choose an image",
                    })}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    PNG, JPG, WebP up to 5MB
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CATEGORIES */}
            {activeTab === "categories" && (
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t({
                      bn: "ক্যাটাগরি ভিত্তিক ডিফল্ট ছবি কনফিগারেশন",
                      en: "Category-Wise Fallback Images",
                    })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t({
                      bn: "প্রতিটি ক্যাটাগরির জন্য পৃথক ডিফল্ট ছবি নির্ধারণ করতে পারেন।",
                      en: "Assign dedicated default images for specific project categories.",
                    })}
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.keys(CATEGORY_DEFAULT_IMAGES).map((catKey) => {
                    const currentVal =
                      categoryOverrides[catKey] ?? CATEGORY_DEFAULT_IMAGES[catKey] ?? "";
                    return (
                      <div
                        key={catKey}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 capitalize">
                            {catKey}
                          </span>
                        </div>
                        <input
                          type="url"
                          value={currentVal}
                          onChange={(e) =>
                            setCategoryOverrides((prev) => ({
                              ...prev,
                              [catKey]: e.target.value,
                            }))
                          }
                          placeholder="https://images.unsplash.com/..."
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none font-mono focus:border-emerald-500"
                        />
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSaveCategoryOverrides}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.02]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t({ bn: "ক্যাটাগরি সেটিংস সংরক্ষণ করুন", en: "Save Category Settings" })}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Default Image to Empty Projects + Individual Project Image Manager */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t({
                bn: "প্রতিটি প্রজেক্টের আলাদা ছবি ম্যানেজমেন্ট",
                en: "Per-Project Image Management",
              })}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t({
                bn: "যেকোনো প্রজেক্টের জন্য আলাদা ছবি আপলোড/আপডেট করুন। নিচের বাটনে ক্লিক করলে শুধু ছবিবিহীন প্রজেক্টে ডিফল্ট ছবি বসবে—আগের ছবি পরিবর্তন হবে না।",
                en: "Update individual project images below. Applying default image only fills projects without an image.",
              })}
            </p>
          </div>

          <button
            type="button"
            disabled={applyingDefaults}
            onClick={handleApplyDefaultToEmptyProjects}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 transition disabled:opacity-50 shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            {applyingDefaults
              ? t({ bn: "অ্যাপ্লাই হচ্ছে...", en: "Applying..." })
              : t({
                  bn: "ছবিবিহীন প্রজেক্টে ডিফল্ট ছবি সেট করুন",
                  en: "Apply Default to Empty Projects",
                })}
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100">
          {projectsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {t({ bn: "কোনো প্রজেক্ট পাওয়া যায়নি", en: "No projects found" })}
            </div>
          ) : (
            projectsList.map((proj) => {
              const uuid = String(proj.uuid || "");
              const hasCustomImage = Boolean(String(proj.thumbnailUrl || "").trim());
              const currentInput = projectThumbInputs[uuid] ?? String(proj.thumbnailUrl || "");
              const apiBase = (
                typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL
                  ? process.env.NEXT_PUBLIC_API_BASE_URL
                  : "http://localhost:5002"
              ).replace(/\/+$/, "");
              const displaySrc = hasCustomImage
                ? String(proj.thumbnailUrl).startsWith("/")
                  ? `${apiBase}${proj.thumbnailUrl}`
                  : String(proj.thumbnailUrl)
                : getProjectDefaultImage(proj.category?.name);

              return (
                <div
                  key={uuid}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-3.5 hover:bg-slate-50/70 transition"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displaySrc}
                      alt={String(proj.name || "Project")}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = getProjectDefaultImage(proj.category?.name);
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {proj.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          hasCustomImage
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {hasCustomImage
                          ? t({ bn: "ডায়নামিক ছবি আছে", en: "Has Image" })
                          : t({ bn: "ছবি নেই (ডিফল্ট)", en: "No Image (Default)" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {proj.category?.name || "General"} • {proj.location || "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 md:w-[420px]">
                    <input
                      type="url"
                      value={currentInput}
                      onChange={(e) =>
                        setProjectThumbInputs((prev) => ({
                          ...prev,
                          [uuid]: e.target.value,
                        }))
                      }
                      placeholder="https://... or upload"
                      className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                    />
                    <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0">
                      <Upload className="h-3 w-3 text-emerald-600" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const compressed = await compressImageFileToDataUrl(file);
                            setProjectThumbInputs((prev) => ({ ...prev, [uuid]: compressed }));
                            await handleSaveSingleProjectImage(uuid, compressed);
                          } catch {}
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={savingProjectUuid === uuid}
                      onClick={() => handleSaveSingleProjectImage(uuid, currentInput)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shrink-0"
                    >
                      {savingProjectUuid === uuid ? "..." : "Save"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
