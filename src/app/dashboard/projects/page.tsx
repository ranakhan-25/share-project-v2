"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  ExternalLink,
  Eye,
  Filter,
  Grid3X3,
  Heart,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Percent,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  getPublicProjects,
  getPublicCategories,
  getWishlistUuids,
  toggleWishlistApi,
  getCompareListApi,
  toggleCompareApi,
  removeCompareApi,
  clearCompareApi,
  type ShareApiProject,
} from "@/lib/share-project-api";
import { ShareProjectModal } from "@/components/share/ShareProjectModal";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80";

type ProjectItem = ShareApiProject & {
  categoryName?: string;
  displayImage?: string;
};

export default function AllProjectsDashboardPage() {
  const { t, taka, num } = useLang();

  // Data states
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; code?: string }>>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Comparison states (Max 4)
  const [compareList, setCompareList] = useState<ProjectItem[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareWarning, setCompareWarning] = useState("");

  // Share modal state
  const [sharingProject, setSharingProject] = useState<ProjectItem | null>(null);

  // Load initial projects, categories, wishlist & compare list
  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      getPublicProjects(1, 100).catch(() => ({ data: [] })),
      getPublicCategories().catch(() => []),
      getWishlistUuids().catch(() => []),
      getCompareListApi().catch(() => []),
    ])
      .then(([projRes, catRes, wishRes, compRes]) => {
        if (!active) return;
        const rawList = Array.isArray(projRes?.data) ? projRes.data : Array.isArray(projRes) ? projRes : [];
        const mapped: ProjectItem[] = rawList.map((p: any) => ({
          ...p,
          categoryName: p.category?.name || "General",
          displayImage: p.thumbnailUrl || p.images?.[0]?.url || FALLBACK_IMAGE,
        }));
        setProjects(mapped);
        setCategories(catRes || []);
        setWishlist(new Set(wishRes || []));

        if (Array.isArray(compRes) && compRes.length > 0) {
          const compMapped: ProjectItem[] = compRes.map((p: any) => ({
            ...p,
            categoryName: p.category?.name || "General",
            displayImage: p.thumbnailUrl || p.images?.[0]?.url || FALLBACK_IMAGE,
          }));
          setCompareList(compMapped);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle Wishlist Toggle
  const handleToggleWishlist = async (uuid: string) => {
    // Optimistic toggle
    const next = new Set(wishlist);
    const wasWishlisted = next.has(uuid);
    if (wasWishlisted) {
      next.delete(uuid);
    } else {
      next.add(uuid);
    }
    setWishlist(next);

    // Call backend API
    try {
      const res = await toggleWishlistApi(uuid);
      if (res.wishlisted !== !wasWishlisted) {
        // Rollback or sync
        const synced = new Set(wishlist);
        if (res.wishlisted) synced.add(uuid);
        else synced.delete(uuid);
        setWishlist(synced);
      }
    } catch {
      // keep optimistic
    }
  };

  // Handle Project Compare Select / Deselect (Max 4)
  const handleToggleCompare = async (project: ProjectItem) => {
    const isSelected = compareList.some((p) => p.uuid === project.uuid);
    if (!isSelected && compareList.length >= 4) {
      setCompareWarning(
        t({
          bn: "একসাথে সর্বোচ্চ ৪টি প্রজেক্ট তুলনা করা যাবে।",
          en: "You can compare a maximum of 4 projects at a time.",
        })
      );
      setTimeout(() => setCompareWarning(""), 3500);
      return;
    }

    // Optimistic update
    const previous = [...compareList];
    if (isSelected) {
      setCompareList(compareList.filter((p) => p.uuid !== project.uuid));
    } else {
      setCompareList([...compareList, project]);
    }
    setCompareWarning("");

    // Backend sync
    try {
      const res = await toggleCompareApi(project.uuid);
      if (Array.isArray(res.list)) {
        const synced: ProjectItem[] = res.list.map((p: any) => ({
          ...p,
          categoryName: p.category?.name || "General",
          displayImage: p.thumbnailUrl || p.images?.[0]?.url || FALLBACK_IMAGE,
        }));
        setCompareList(synced);
      }
    } catch (err: any) {
      // Rollback on limit error
      setCompareList(previous);
      if (err?.message) {
        setCompareWarning(err.message);
        setTimeout(() => setCompareWarning(""), 3500);
      }
    }
  };

  // Remove single project from compare
  const handleRemoveCompare = async (projectUuid: string) => {
    const remaining = compareList.filter((item) => item.uuid !== projectUuid);
    setCompareList(remaining);
    if (remaining.length === 0) setIsCompareOpen(false);
    try {
      await removeCompareApi(projectUuid);
    } catch {}
  };

  // Clear all compare
  const handleClearCompare = async () => {
    setCompareList([]);
    setIsCompareOpen(false);
    try {
      await clearCompareApi();
    } catch {}
  };

  // Filtered & Searched Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Wishlist only filter
      if (wishlistOnly && !wishlist.has(p.uuid)) return false;

      // Category filter
      if (selectedCategory !== "all") {
        const catMatch =
          p.category?.name?.toLowerCase() === selectedCategory.toLowerCase() ||
          String(p.categoryId) === selectedCategory;
        if (!catMatch) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const locMatch = p.location?.toLowerCase().includes(q);
        const catMatch = p.categoryName?.toLowerCase().includes(q);
        const codeMatch = p.code?.toLowerCase().includes(q);
        if (!nameMatch && !locMatch && !catMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [projects, wishlistOnly, wishlist, selectedCategory, search]);

  // Pagination (9 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, wishlistOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return (
    <div className="w-full space-y-6 pb-24">
      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <Building2 className="h-3.5 w-3.5" />
                {t({ bn: "প্রজেক্ট শোকেস", en: "Project Showcase" })}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {num(filteredProjects.length)} {t({ bn: "টি প্রজেক্ট", en: "projects found" })}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t({ bn: "সকল শেয়ার প্রজেক্ট", en: "All Share Projects" })}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
              {t({
                bn: "প্ল্যাটফর্মের সকল অনুমোদিত শেয়ার প্রজেক্ট ব্রাউজ করুন, ক্যাটাগরি ও ফিল্টার করুন, পছন্দের তালিকায় যোগ করুন এবং সর্বোচ্চ ৪টি প্রজেক্ট তুলনা করুন।",
                en: "Explore approved share projects, filter by category, manage your wishlist, and compare up to 4 projects side-by-side.",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Wishlist quick toggle button */}
            <button
              type="button"
              onClick={() => setWishlistOnly((w) => !w)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition shadow-xs ${
                wishlistOnly
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Heart className={`h-4 w-4 ${wishlistOnly ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
              <span>{t({ bn: "উইশলিস্ট", en: "Wishlist" })}</span>
              <span className="ml-0.5 rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-black text-rose-700">
                {num(wishlist.size)}
              </span>
            </button>

            {/* Compare Drawer Trigger */}
            {compareList.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCompareOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                <Scale className="h-4 w-4" />
                <span>{t({ bn: "তুলনা করুন", en: "Compare" })}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-black text-white">
                  {num(compareList.length)}/4
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Warning Toast */}
        <AnimatePresence>
          {compareWarning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-medium text-amber-800"
            >
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{compareWarning}</span>
              </div>
              <button onClick={() => setCompareWarning("")} className="text-amber-500 hover:text-amber-700">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t({ bn: "প্রজেক্টের নাম, এলাকা বা কোড খুঁজুন...", en: "Search by name, location or code..." })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 px-3 text-xs font-semibold text-slate-700 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">{t({ bn: "সকল ক্যাটাগরি", en: "All Categories" })}</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle (Grid vs Table) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <span className="text-xs text-slate-500 font-medium sm:hidden">
            {t({ bn: "ভিউ মোড:", en: "View mode:" })}
          </span>
          <div className="flex items-center rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title={t({ bn: "গ্রিড কার্ড ভিউ", en: "Grid Card View" })}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{t({ bn: "গ্রিড", en: "Grid" })}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title={t({ bn: "টেবিল ভিউ", en: "Table View" })}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>{t({ bn: "টেবিল", en: "Table" })}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content View (Loading / Empty / Grid / Table) ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            {t({ bn: "প্রজেক্ট লোড হচ্ছে...", en: "Loading projects..." })}
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center">
          <Building2 className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            {wishlistOnly
              ? t({ bn: "উইশলিস্টে কোনো প্রজেক্ট নেই", en: "No wishlisted projects" })
              : t({ bn: "কোনো প্রজেক্ট পাওয়া যায়নি", en: "No projects found" })}
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md">
            {wishlistOnly
              ? t({
                  bn: "আপনি এখনও কোনো প্রজেক্ট উইশলিস্টে যুক্ত করেননি। প্রজেক্ট কার্ডের হার্ট আইকনে ক্লিক করে যুক্ত করুন।",
                  en: "You have not added any projects to your wishlist yet. Click the heart icon on any project card to save it.",
                })
              : t({
                  bn: "আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো প্রজেক্ট নেই। অনুগ্রহ করে অন্য ফিল্টার দিয়ে চেষ্টা করুন।",
                  en: "Try clearing your search keyword or switching categories to see more projects.",
                })}
          </p>
          {(search || selectedCategory !== "all" || wishlistOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setWishlistOnly(false);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t({ bn: "ফিল্টার রিসেট করুন", en: "Reset filters" })}</span>
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ══════════════ 1. GRID CARD VIEW ══════════════ */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedProjects.map((p) => {
            const isWishlisted = wishlist.has(p.uuid);
            const isCompared = compareList.some((item) => item.uuid === p.uuid);

            return (
              <motion.div
                key={p.uuid}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={p.displayImage || FALLBACK_IMAGE}
                    alt={p.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Category Pill */}
                  <span className="absolute left-3.5 top-3.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                    {p.categoryName}
                  </span>

                  {/* Top Action Icons (Wishlist & Compare) */}
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
                    {/* Compare Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCompare(p)}
                      title={
                        isCompared
                          ? t({ bn: "তুলনা তালিকা থেকে সরান", en: "Remove from comparison" })
                          : t({ bn: "তুলনা তালিকায় যোগ করুন (সর্বোচ্চ ৪টি)", en: "Add to comparison (max 4)" })
                      }
                      className={`grid h-8.5 w-8.5 place-items-center rounded-full backdrop-blur-md transition ${
                        isCompared
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-white"
                          : "bg-white/80 text-slate-700 hover:bg-white hover:text-emerald-600"
                      }`}
                    >
                      <Scale className="h-4 w-4" />
                    </button>

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleWishlist(p.uuid)}
                      title={
                        isWishlisted
                          ? t({ bn: "উইশলিস্ট থেকে বাদ দিন", en: "Remove from wishlist" })
                          : t({ bn: "উইশলিস্টে যোগ করুন", en: "Add to wishlist" })
                      }
                      className={`grid h-8.5 w-8.5 place-items-center rounded-full backdrop-blur-md transition ${
                        isWishlisted
                          ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-white"
                          : "bg-white/80 text-slate-700 hover:bg-white hover:text-rose-600"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isWishlisted ? "fill-white" : ""}`} />
                    </button>

                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={() => setSharingProject(p)}
                      title={t({ bn: "প্রজেক্ট শেয়ার করুন", en: "Share project" })}
                      className="grid h-8.5 w-8.5 place-items-center rounded-full bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white hover:text-blue-600 transition"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Location & Title over image */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    {p.location && (
                      <p className="flex items-center gap-1 text-[11px] font-medium text-slate-200">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </p>
                    )}
                    <h3 className="text-base font-bold text-white truncate drop-shadow-sm mt-0.5">
                      {p.name}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  {/* Share Stats */}
                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        {t({ bn: "প্রতি শেয়ার মূল্য", en: "Share Price" })}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">
                        {taka(Number(p.pricePerShare || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        {t({ bn: "প্রত্যাশিত রিটার্ন", en: "Annual ROI" })}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-emerald-600 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {num(Number(p.expectedAnnualReturn || 0))}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        {t({ bn: "মোট শেয়ার সংখ্যা", en: "Total Shares" })}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-800">
                        {num(Number(p.totalShares || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        {t({ bn: "মোট ভ্যালুয়েশন", en: "Total Target" })}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-800">
                        {taka(Number(p.totalInvestmentAmount || 0), true)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => handleToggleCompare(p)}
                        className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600"
                      />
                      <span>{t({ bn: "তুলনা করুন", en: "Compare" })}</span>
                    </label>

                    <Link
                      href={`/projects/${p.uuid}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink-950 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-ink-800"
                    >
                      <span>{t({ bn: "বিস্তারিত", en: "Details" })}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ══════════════ 2. TABLE VIEW ══════════════ */
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 pl-5 pr-2 w-10 text-center">
                    <Scale className="h-4 w-4 mx-auto text-slate-400" />
                  </th>
                  <th className="py-3.5 px-3">{t({ bn: "প্রজেক্ট", en: "Project" })}</th>
                  <th className="py-3.5 px-3">{t({ bn: "ক্যাটাগরি", en: "Category" })}</th>
                  <th className="py-3.5 px-3">{t({ bn: "শেয়ার মূল্য", en: "Share Price" })}</th>
                  <th className="py-3.5 px-3">{t({ bn: "রিটার্ন", en: "Expected ROI" })}</th>
                  <th className="py-3.5 px-3">{t({ bn: "মোট শেয়ার", en: "Total Shares" })}</th>
                  <th className="py-3.5 px-3">{t({ bn: "টার্গেট ভ্যালু", en: "Total Value" })}</th>
                  <th className="py-3.5 pl-3 pr-5 text-right">{t({ bn: "অ্যাকশন", en: "Actions" })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProjects.map((p) => {
                  const isWishlisted = wishlist.has(p.uuid);
                  const isCompared = compareList.some((item) => item.uuid === p.uuid);

                  return (
                    <tr
                      key={p.uuid}
                      className={`transition hover:bg-slate-50/70 ${isCompared ? "bg-emerald-50/30" : ""}`}
                    >
                      {/* Compare Checkbox */}
                      <td className="py-3.5 pl-5 pr-2 text-center">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => handleToggleCompare(p)}
                          className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600"
                          title={t({ bn: "তুলনা করুন", en: "Compare" })}
                        />
                      </td>

                      {/* Project Name + Image */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            <Image
                              src={p.displayImage || FALLBACK_IMAGE}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <Link
                              href={`/projects/${p.uuid}`}
                              className="font-bold text-slate-900 hover:text-emerald-700 truncate block text-xs sm:text-sm"
                            >
                              {p.name}
                            </Link>
                            {p.location && (
                              <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {p.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {p.categoryName}
                        </span>
                      </td>

                      {/* Share Price */}
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {taka(Number(p.pricePerShare || 0))}
                      </td>

                      {/* ROI */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {num(Number(p.expectedAnnualReturn || 0))}%
                        </span>
                      </td>

                      {/* Total Shares */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium">
                        {num(Number(p.totalShares || 0))}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-3 text-slate-900 font-semibold">
                        {taka(Number(p.totalInvestmentAmount || 0), true)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleWishlist(p.uuid)}
                            className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                              isWishlisted
                                ? "border-rose-200 bg-rose-50 text-rose-600"
                                : "border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-50"
                            }`}
                            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          >
                            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSharingProject(p)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition"
                            title={t({ bn: "শেয়ার করুন", en: "Share project" })}
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          <Link
                            href={`/projects/${p.uuid}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-ink-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-ink-800 transition"
                          >
                            <span>{t({ bn: "দেখুন", en: "View" })}</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════ PAGINATION (9 ITEMS PER PAGE) ══════════════ */}
      {filteredProjects.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-medium">
            {t({
              bn: `মোট ${num(filteredProjects.length)}টি প্রজেক্টের মধ্যে ${num(
                Math.min(
                  (currentPage - 1) * pageSize + 1,
                  filteredProjects.length
                )
              )} - ${num(
                Math.min(currentPage * pageSize, filteredProjects.length)
              )} দেখানো হচ্ছে`,
              en: `Showing ${
                Math.min((currentPage - 1) * pageSize + 1, filteredProjects.length)
              } - ${Math.min(
                currentPage * pageSize,
                filteredProjects.length
              )} of ${filteredProjects.length} projects`,
            })}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t({ bn: "পূর্ববর্তী", en: "Prev" })}</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
              const isActive = pg === currentPage;
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {num(pg)}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{t({ bn: "পরবর্তী", en: "Next" })}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ 3. FLOATING COMPARISON DOCK ══════════════ */}
      <AnimatePresence>
        {compareList.length > 0 && !isCompareOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 inset-x-4 max-w-4xl mx-auto z-40 rounded-3xl border border-slate-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-xl sm:px-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">
                      {t({ bn: "প্রজেক্ট তুলনা তালিকা", en: "Project Comparison" })}
                    </p>
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {num(compareList.length)}/4
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {compareList.length === 1
                      ? t({ bn: "তুলনা করতে আরও অন্তত ১টি প্রজেক্ট সিলেক্ট করুন", en: "Select at least 1 more project to compare" })
                      : t({ bn: "পাশাপাশি বিস্তারিত তুলনা দেখুন", en: "Ready to view side-by-side comparison" })}
                  </p>
                </div>
              </div>

              {/* Thumbnails preview */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 mr-2">
                  {compareList.map((cp) => (
                    <div
                      key={cp.uuid}
                      className="group relative h-9 w-9 rounded-xl overflow-hidden border border-slate-200"
                    >
                      <Image src={cp.displayImage || FALLBACK_IMAGE} alt={cp.name} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleToggleCompare(cp)}
                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition grid place-items-center"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleClearCompare}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {t({ bn: "সব মুছুন", en: "Clear" })}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCompareOpen(true)}
                  disabled={compareList.length < 2}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Scale className="h-4 w-4" />
                  <span>{t({ bn: "তুলনা দেখুন", en: "Compare Now" })}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ 4. COMPARISON MODAL (MAX 4 PROJECTS) ══════════════ */}
      <AnimatePresence>
        {isCompareOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative flex flex-col w-full max-w-6xl max-h-[92vh] rounded-[32px] border border-slate-200 bg-white shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">
                    <Scale className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {t({ bn: "প্রজেক্ট শেয়ার তুলনা", en: "Project Share Comparison" })}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {t({
                        bn: `নির্বাচিত ${compareList.length}টি প্রজেক্টের বিস্তারিত তুলনা`,
                        en: `Detailed comparison of ${compareList.length} selected projects`,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearCompare}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                  >
                    {t({ bn: "রিসেট", en: "Reset" })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompareOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-200 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Comparison Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${compareList.length}, minmax(220px, 1fr))`,
                  }}
                >
                  {compareList.map((p) => {
                    const isWishlisted = wishlist.has(p.uuid);

                    return (
                      <div
                        key={p.uuid}
                        className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4.5 shadow-xs relative"
                      >
                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCompare(p.uuid)}
                          className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                          title="Remove from comparison"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        {/* Image */}
                        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 mb-3.5">
                          <Image
                            src={p.displayImage || FALLBACK_IMAGE}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute left-2.5 bottom-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                            {p.categoryName}
                          </span>
                        </div>

                        {/* Title & Location */}
                        <h4 className="text-sm font-bold text-slate-900 truncate">{p.name}</h4>
                        {p.location && (
                          <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                            <MapPin className="h-3 w-3 shrink-0 text-emerald-600" />
                            {p.location}
                          </p>
                        )}

                        {/* Comparison Matrix Table */}
                        <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-xs flex-1">
                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">{t({ bn: "শেয়ার মূল্য", en: "Share Price" })}</span>
                            <span className="font-bold text-slate-900">{taka(Number(p.pricePerShare || 0))}</span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">{t({ bn: "রিটার্ন", en: "Expected ROI" })}</span>
                            <span className="font-bold text-emerald-600 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {num(Number(p.expectedAnnualReturn || 0))}%
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">{t({ bn: "মোট শেয়ার", en: "Total Shares" })}</span>
                            <span className="font-semibold text-slate-800">{num(Number(p.totalShares || 0))}</span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">{t({ bn: "মোট ভ্যালু", en: "Total Value" })}</span>
                            <span className="font-semibold text-slate-800">
                              {taka(Number(p.totalInvestmentAmount || 0), true)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">{t({ bn: "নূন্যতম বিনিয়োগ", en: "Min Invest" })}</span>
                            <span className="font-semibold text-slate-800">
                              {taka(Number(p.minimumInvestment || p.pricePerShare || 0))}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-slate-50">
                            <span className="text-slate-400">{t({ bn: "উইশলিস্ট", en: "Wishlist" })}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleWishlist(p.uuid)}
                              className="inline-flex items-center gap-1 font-semibold text-[11px] text-slate-700 hover:text-rose-600"
                            >
                              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                              <span>{isWishlisted ? "Saved" : "Save"}</span>
                            </button>
                          </div>
                        </div>

                        {/* CTA button */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <Link
                            href={`/projects/${p.uuid}`}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink-950 py-2.5 text-xs font-bold text-white hover:bg-ink-800 transition shadow-xs"
                          >
                            <span>{t({ bn: "প্রজেক্ট পেজ দেখুন", en: "View Details" })}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Project Modal */}
      <ShareProjectModal
        open={!!sharingProject}
        onClose={() => setSharingProject(null)}
        project={sharingProject}
      />
    </div>
  );
}
