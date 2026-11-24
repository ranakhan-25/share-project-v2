"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import {
  AlertCircle,
  Building2,
  ChevronRight,
  FolderClosed,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  getInvestments,
  getProject,
  type InvestmentRecord,
  type ShareProjectRecord,
} from "@/lib/admin-share-project-api";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredUser,
} from "@/lib/admin-auth/adminAuthStorage";
import { Navbar } from "@/components/site/Navbar";
import { ProjectDetailContent } from "@/components/admin/ProjectDetailContent";

export default function AdminProjectDetailsPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const uuid = resolvedParams?.uuid;

  const [project, setProject] = useState<ShareProjectRecord | null>(null);
  const [investments, setInvestments] = useState<InvestmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setUserProfile(getStoredUser());

    if (uuid) {
      loadData(uuid);
    }
  }, [uuid, router]);

  async function loadData(targetUuid?: string) {
    if (!targetUuid) return;
    setLoading(true);
    setError("");
    try {
      const [proj, invs] = await Promise.all([
        getProject(targetUuid),
        getInvestments({ projectUuid: targetUuid }).catch(() => []),
      ]);
      setProject(proj);
      setInvestments(invs);
    } catch (err: any) {
      setError(err?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    clearStoredTokens();
    router.replace("/admin/login");
  };

  const sidebarItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { key: "projects", label: "All Project", icon: Building2, href: "/admin/dashboard" },
    { key: "investments", label: "Investments", icon: Landmark, href: "/admin/dashboard" },
    { key: "users", label: "Share User", icon: Users, href: "/admin/dashboard" },
    { key: "categories", label: "Category", icon: FolderClosed, href: "/admin/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* 1. Share Project Main Site Navbar */}
      <Navbar />

      {/* Top spacing because Navbar is fixed */}
      <div className="pt-20">
        <div className="mx-auto flex max-w-7xl min-h-[calc(100vh-5rem)] px-5 sm:px-8">
          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
            />
          )}

          {/* ==================== 2. LEFT SIDEBAR ==================== */}
          <aside
            className={`fixed inset-y-0 left-0 top-20 z-40 flex w-64 shrink-0 flex-col border-r lg:border-l border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Admin Status Header in Sidebar */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2.5 shadow-xs">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight truncate text-slate-900">Admin Console</p>
                  <p className="text-[10px] font-semibold text-emerald-700 leading-tight truncate">Share Project Core</p>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="flex-1 space-y-1 p-3">
              {sidebarItems.map(({ key, label, icon: Icon, href }) => {
                const isActive = key === "projects";
                return (
                  <Link
                    key={key}
                    href={href}
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                        }`}
                      />
                      <span>{label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar User Profile & Sign Out */}
            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {userProfile?.name || "Admin"}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {userProfile?.email || "admin@realbiz.com"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* ==================== 3. MAIN CONTENT AREA ==================== */}
          <div className="flex flex-1 flex-col min-w-0 lg:border-r border-slate-200">
            {/* Top Bar with Mobile Menu Toggle & Controls */}
            <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-white/70 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 text-xs">
                  <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-600">
                    Admin
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-300" />
                  <Link href="/admin/dashboard" className="text-slate-500 hover:text-slate-900 font-bold">
                    All Project
                  </Link>
                  {project && (
                    <>
                      <ChevronRight className="h-3 w-3 text-slate-300" />
                      <span className="font-bold text-emerald-700 truncate max-w-xs sm:max-w-md">
                        {String(project.name || project.code || "")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/dashboard"
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Dashboard
                </Link>
              </div>
            </div>

            {/* Dynamic Content Views */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {loading ? (
                <div className="py-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
                  <p className="mt-3 text-sm text-slate-500">Loading project details...</p>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
                  <p className="mt-2 text-sm font-semibold text-rose-800">{error}</p>
                  <Link
                    href="/admin/dashboard"
                    className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Back to All Projects
                  </Link>
                </div>
              ) : project ? (
                <ProjectDetailContent
                  project={project}
                  investments={investments}
                  onBack={() => router.push("/admin/dashboard")}
                  onRefresh={() => loadData(uuid)}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                  <p className="text-slate-500 text-sm">Project could not be found.</p>
                  <Link
                    href="/admin/dashboard"
                    className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    Back to All Projects
                  </Link>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
