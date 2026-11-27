"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  FolderClosed,
  FolderPlus,
  Heart,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  approveInvestment,
  approveProject,
  blockShareUser,
  createCategory,
  createShareUser,
  deleteCategory,
  deleteShareUser,
  getAdminProjectFavorites,
  getAdminProjectViews,
  getCategories,
  getInvestments,
  getProject,
  getProjects,
  getShareUsers,
  publishProject,
  rejectInvestment,
  rejectProject,
  restoreInvestment,
  restoreProject,
  restoreShareUser,
  setProjectOwnerLeadPermit,
  softDeleteInvestment,
  softDeleteProject,
  unblockShareUser,
  unpublishProject,
  updateCategory,
  updateShareUser,
  type InvestmentRecord,
  type ProjectCategoryRecord,
  type ShareProjectRecord,
  type ShareUserRecord,
} from "@/lib/admin-share-project-api";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredUser,
} from "@/lib/admin-auth/adminAuthStorage";
import { useLang } from "@/lib/i18n";
import { Navbar } from "@/components/site/Navbar";
import { LogoMark } from "@/components/site/Logo";
import { ProjectDetailContent } from "@/components/admin/ProjectDetailContent";
import { AdminProjectImageSettings } from "@/components/admin/AdminProjectImageSettings";
import { showAlert } from "@/lib/swal";

type SidebarMenuKey = "dashboard" | "projects" | "investments" | "analytics" | "users" | "categories" | "settings";

type ProjectFilterStatus =
  | "all"
  | "pending"
  | "approved"
  | "publish_requested"
  | "published"
  | "rejected"
  | "unpublished"
  | "trash";

// Reusable Pagination Component (renders when totalItems > pageSize)
function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= pageSize) return null;

  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 px-4 py-3 bg-white rounded-b-2xl">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-800">{startItem}</span> to{" "}
        <span className="font-semibold text-slate-800">{endItem}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
        >
          <ChevronLeft className="h-3 w-3" />
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          if (totalPages > 7) {
            if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 2) {
              if (p === 2 || p === totalPages - 1) {
                return (
                  <span key={p} className="px-1 text-slate-400 text-xs">
                    ...
                  </span>
                );
              }
              return null;
            }
          }
          const isCurrent = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-7 h-7 rounded-lg text-xs font-semibold transition ${
                isCurrent
                  ? "bg-slate-900 text-white shadow-xs"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
        >
          Next
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function ShareProjectAdminDashboardPage() {
  const router = useRouter();
  const { t } = useLang();

  // Navigation states
  const [activeMenu, setActiveMenu] = useState<SidebarMenuKey>("dashboard");
  const [projectStatusFilter, setProjectStatusFilter] = useState<ProjectFilterStatus>("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Pagination states (10 items per page)
  const [projectPage, setProjectPage] = useState(1);
  const [investmentPage, setInvestmentPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [dashboardInvestmentPage, setDashboardInvestmentPage] = useState(1);

  // Core Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  const [projects, setProjects] = useState<ShareProjectRecord[]>([]);
  const [trashProjects, setTrashProjects] = useState<ShareProjectRecord[]>([]);
  const [investments, setInvestments] = useState<InvestmentRecord[]>([]);
  const [trashInvestments, setTrashInvestments] = useState<InvestmentRecord[]>([]);
  const [users, setUsers] = useState<ShareUserRecord[]>([]);
  const [categories, setCategories] = useState<ProjectCategoryRecord[]>([]);
  const [viewLogs, setViewLogs] = useState<any[]>([]);
  const [favoriteLogs, setFavoriteLogs] = useState<any[]>([]);
  const [analyticsTab, setAnalyticsTab] = useState<"views" | "favorites">("views");
  const [analyticsPage, setAnalyticsPage] = useState(1);
  const [selectedViewLog, setSelectedViewLog] = useState<any | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name">("newest");
  const [investmentTrashView, setInvestmentTrashView] = useState(false);
  const [actionLoadingUuid, setActionLoadingUuid] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setProjectPage(1);
  }, [projectStatusFilter, searchQuery, sortOrder]);

  useEffect(() => {
    setInvestmentPage(1);
  }, [investmentTrashView]);

  // Modals
  const [rejectingProject, setRejectingProject] = useState<ShareProjectRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingInvestment, setRejectingInvestment] = useState<InvestmentRecord | null>(null);
  const [investmentRejectReason, setInvestmentRejectReason] = useState("");

  const [categoryModal, setCategoryModal] = useState<{ open: boolean; item?: ProjectCategoryRecord | null }>({
    open: false,
    item: null,
  });
  const [categoryForm, setCategoryForm] = useState({ name: "", code: "" });

  const [userModal, setUserModal] = useState<{ open: boolean; item?: ShareUserRecord | null }>({
    open: false,
    item: null,
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    userType: "buyer" as "buyer" | "seller",
    // Buyer profile fields
    profession: "",
    designation: "",
    budget: "৳৫,০০,০০০ - ৳১০,০০,০০০",
    preferableCategory: "Commercial Real Estate",
    interestedLocation: "Dhaka",
    // Seller profile fields
    nid: "",
    tradeLicense: "",
    mdName: "",
    officeAddress: "",
    sellerPhone: "",
    website: "",
    facebookPage: "",
  });

  // Project details inside dashboard
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string | null>(null);
  const [selectedProjectData, setSelectedProjectData] = useState<ShareProjectRecord | null>(null);
  const [selectedProjectInvestments, setSelectedProjectInvestments] = useState<InvestmentRecord[]>([]);
  const [selectedProjectLoading, setSelectedProjectLoading] = useState(false);

  async function handleOpenProjectDetail(uuid?: string) {
    if (!uuid) return;
    setSelectedProjectUuid(uuid);
    setActiveMenu("projects");
    setSelectedProjectLoading(true);
    try {
      const [proj, invs] = await Promise.all([
        getProject(uuid),
        getInvestments({ projectUuid: uuid }).catch(() => []),
      ]);
      setSelectedProjectData(proj);
      setSelectedProjectInvestments(invs);
    } catch (err: any) {
      await showAlert.error("Load Failed", err?.message || "Failed to load project details");
      setSelectedProjectUuid(null);
    } finally {
      setSelectedProjectLoading(false);
    }
  }

  function handleBackToProjects() {
    setSelectedProjectUuid(null);
    setSelectedProjectData(null);
    setSelectedProjectInvestments([]);
  }

  // Auth Guard & Initial Load
  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const stored = getStoredUser();
    setUserProfile(stored);
    void loadAllData();
  }, [router]);

  async function loadAllData() {
    setLoading(true);
    setError("");

    // 1. Fetch primary data (projects) with immediate state update to unblock UI quickly
    const loadProjectsPromise = getProjects()
      .then((projList) => {
        setProjects(projList);
        setLoading(false); // Unblock main loading spinner immediately!
      })
      .catch((err) => {
        console.warn("Failed to load projects", err);
      });

    // 2. Fetch investments
    const loadInvestmentsPromise = getInvestments()
      .then((invList) => {
        setInvestments(invList);
      })
      .catch((err) => {
        console.warn("Failed to load investments", err);
      });

    // 3. Fetch secondary data in parallel without blocking initial render
    const loadTrashProjectsPromise = getProjects({ trash: true })
      .then((trashList) => setTrashProjects(trashList))
      .catch(() => {});

    const loadUsersPromise = getShareUsers()
      .then((userList) => setUsers(userList))
      .catch(() => {});

    const loadCategoriesPromise = getCategories()
      .then((catList) => setCategories(catList))
      .catch(() => {});

    const loadTrashInvestmentsPromise = getInvestments({ trash: true })
      .then((trashInvList) => setTrashInvestments(trashInvList))
      .catch(() => {});

    const loadViewsPromise = getAdminProjectViews()
      .then((list) => setViewLogs(Array.isArray(list) ? list : []))
      .catch(() => {});

    const loadFavoritesPromise = getAdminProjectFavorites()
      .then((list) => setFavoriteLogs(Array.isArray(list) ? list : []))
      .catch(() => {});

    try {
      await Promise.allSettled([loadProjectsPromise, loadInvestmentsPromise]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      void Promise.allSettled([
        loadTrashProjectsPromise,
        loadUsersPromise,
        loadCategoriesPromise,
        loadTrashInvestmentsPromise,
        loadViewsPromise,
        loadFavoritesPromise,
      ]);
    }
  }

  function handleLogout() {
    clearStoredTokens();
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("share_project_access_token");
      localStorage.removeItem("share-project:access-token");
    }
    router.replace("/admin/login");
  }

  // Project Actions
  async function handleApproveProject(uuid?: string) {
    if (!uuid) return;
    const confirmed = await showAlert.confirm(
      "Approve Share Project?",
      "Approve this project so the seller can submit a publish request?",
      "Yes, Approve",
      "#059669",
    );
    if (!confirmed) return;
    setActionLoadingUuid(uuid);
    try {
      await approveProject(uuid);
      await showAlert.success("Approved!", "Project approved successfully.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Approval Failed", e?.message || "Approval failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleRejectProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingProject?.uuid || !rejectReason.trim()) return;
    setActionLoadingUuid(rejectingProject.uuid);
    try {
      await rejectProject(rejectingProject.uuid, rejectReason.trim());
      setRejectingProject(null);
      setRejectReason("");
      await showAlert.success("Rejected", "Project rejected successfully.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Rejection Failed", e?.message || "Rejection failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handlePublishProject(uuid?: string) {
    if (!uuid) return;
    const confirmed = await showAlert.confirm(
      "Publish Project?",
      "Publish this project live for all buyers?",
      "Yes, Publish",
      "#059669",
    );
    if (!confirmed) return;
    setActionLoadingUuid(uuid);
    try {
      await publishProject(uuid);
      await showAlert.success("Published!", "Project is now live.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Publish Failed", e?.message || "Publish failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleUnpublishProject(uuid?: string) {
    if (!uuid) return;
    const confirmed = await showAlert.confirm(
      "Unpublish Project?",
      "Unpublish this project from public listing?",
      "Yes, Unpublish",
      "#d97706",
    );
    if (!confirmed) return;
    setActionLoadingUuid(uuid);
    try {
      await unpublishProject(uuid);
      await showAlert.success("Unpublished", "Project unpublished successfully.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Unpublish Failed", e?.message || "Unpublish failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleDeleteProject(uuid?: string) {
    if (!uuid) return;
    const confirmed = await showAlert.confirm(
      "Move to Trash?",
      "Are you sure you want to move this project to trash?",
      "Yes, Move to Trash",
      "#e11d48",
    );
    if (!confirmed) return;
    setActionLoadingUuid(uuid);
    try {
      await softDeleteProject(uuid);
      await showAlert.success("Moved to Trash", "Project moved to trash.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Delete Failed", e?.message || "Delete failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleRestoreProject(uuid?: string) {
    if (!uuid) return;
    const confirmed = await showAlert.confirm(
      "Restore Project?",
      "Restore this project from trash?",
      "Yes, Restore",
      "#059669",
    );
    if (!confirmed) return;
    setActionLoadingUuid(uuid);
    try {
      await restoreProject(uuid);
      await showAlert.success("Restored", "Project restored successfully.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Restore Failed", e?.message || "Restore failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  // Investment Actions
  async function handleApproveInvestment(uuid?: string) {
    if (!uuid) return;
    const confirmed = await showAlert.confirm(
      "Approve Investment?",
      "Confirm and approve this buyer investment request?",
      "Yes, Approve",
      "#059669",
    );
    if (!confirmed) return;
    setActionLoadingUuid(uuid);
    try {
      await approveInvestment(uuid);
      await showAlert.success("Approved!", "Investment approved and confirmed.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Approval Failed", e?.message || "Investment approval failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleRejectInvestmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingInvestment?.uuid || !investmentRejectReason.trim()) return;
    setActionLoadingUuid(rejectingInvestment.uuid);
    try {
      await rejectInvestment(rejectingInvestment.uuid, investmentRejectReason.trim());
      setRejectingInvestment(null);
      setInvestmentRejectReason("");
      await showAlert.success("Rejected", "Investment request rejected.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Rejection Failed", e?.message || "Investment rejection failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleDeleteInvestment(uuid?: string) {
    if (!uuid) return;
    const confirmed = await showAlert.confirm(
      "Move Investment to Trash?",
      "Are you sure you want to move this investment to trash?",
      "Yes, Move to Trash",
      "#e11d48",
    );
    if (!confirmed) return;
    setActionLoadingUuid(uuid);
    try {
      await softDeleteInvestment(uuid);
      await showAlert.success("Moved to Trash", "Investment moved to trash.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Delete Failed", e?.message || "Failed to delete investment");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleRestoreInvestment(uuid?: string) {
    if (!uuid) return;
    const confirmed = await showAlert.confirm(
      "Restore Investment?",
      "Restore this investment from trash?",
      "Yes, Restore",
      "#059669",
    );
    if (!confirmed) return;
    setActionLoadingUuid(uuid);
    try {
      await restoreInvestment(uuid);
      await showAlert.success("Restored", "Investment restored successfully.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Restore Failed", e?.message || "Failed to restore investment");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  // User Actions
  async function handleToggleBlockUser(user: ShareUserRecord) {
    if (!user.uuid) return;
    const isBlocked = user.status?.toLowerCase() === "blocked";
    const confirmed = await showAlert.confirm(
      isBlocked ? "Unblock User?" : "Block User?",
      isBlocked
        ? `Unblock user "${user.name || user.email}"?`
        : `Block user "${user.name || user.email}"?`,
      isBlocked ? "Yes, Unblock" : "Yes, Block",
      isBlocked ? "#059669" : "#e11d48",
    );
    if (!confirmed) return;
    setActionLoadingUuid(user.uuid);
    try {
      if (isBlocked) {
        await unblockShareUser(user.uuid);
        setUsers((prev) =>
          prev.map((u) => (u.uuid === user.uuid ? { ...u, status: "active" } : u))
        );
        await showAlert.success("Unblocked", "User has been unblocked.");
      } else {
        await blockShareUser(user.uuid);
        setUsers((prev) =>
          prev.map((u) => (u.uuid === user.uuid ? { ...u, status: "blocked" } : u))
        );
        await showAlert.success("Blocked", "User has been blocked.");
      }
    } catch (e: any) {
      await showAlert.error("Action Failed", e?.message || "Action failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleDeleteUser(user: ShareUserRecord) {
    if (!user.uuid) return;
    const confirmed = await showAlert.confirm(
      "Delete User?",
      `Are you sure you want to delete "${user.name || user.email}"? (Soft delete)`,
      "Yes, Delete",
      "#e11d48",
    );
    if (!confirmed) {
      return;
    }
    setActionLoadingUuid(user.uuid);
    try {
      await deleteShareUser(user.uuid);
      setUsers((prev) => prev.filter((u) => u.uuid !== user.uuid));
      await showAlert.success("Deleted", "User deleted successfully.");
    } catch (e: any) {
      await showAlert.error("Delete Failed", e?.message || "Delete user failed");
    } finally {
      setActionLoadingUuid(null);
    }
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userForm.name.trim()) return toast.error("Name is required");
    try {
      if (userModal.item?.uuid) {
        const updatePayload: { name?: string; phone?: string; password?: string } = {
          name: userForm.name.trim(),
          phone: userForm.phone.trim(),
        };
        if (userForm.password.length >= 8) updatePayload.password = userForm.password;
        await updateShareUser(userModal.item.uuid, updatePayload);
      } else {
        if (!userForm.email.trim()) return toast.error("Email is required");
        if (userForm.password.length < 8) return toast.error("Password must be at least 8 chars");

        const isBuyer = userForm.userType === "buyer";
        const profile = isBuyer
          ? {
              role: "buyer",
              profession: userForm.profession.trim(),
              designation: userForm.designation.trim() || undefined,
              budget: userForm.budget.trim(),
              preferableCategory: userForm.preferableCategory.trim(),
              interestedLocation: userForm.interestedLocation.trim() || undefined,
            }
          : {
              role: "seller",
              nid: userForm.nid.trim(),
              tradeLicense: userForm.tradeLicense.trim(),
              mdName: userForm.mdName.trim(),
              officeAddress: userForm.officeAddress.trim(),
              sellerPhone: userForm.sellerPhone.trim() || userForm.phone.trim() || undefined,
              website: userForm.website.trim() || undefined,
              facebookPage: userForm.facebookPage.trim() || undefined,
            };

        await createShareUser({
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          phone: userForm.phone.trim() || undefined,
          password: userForm.password,
          userType: userForm.userType,
          role: isBuyer ? "buyer" : "seller",
          profile,
        });
      }
      setUserModal({ open: false, item: null });
      await loadAllData();
      toast.success(userModal.item?.uuid ? "Share User updated successfully." : `${userForm.userType === "buyer" ? "Buyer" : "Seller"} created successfully.`);
    } catch (e: any) {
      toast.error(e?.message || "Save user failed");
    }
  }

  // Category Actions
  async function handleToggleOwnerLeadPermit(projectUuid: string, currentPermit: boolean) {
    const nextPermit = !currentPermit;
    const confirmed = await showAlert.confirm(
      nextPermit ? "Grant Owner Lead Permit?" : "Revoke Owner Lead Permit?",
      nextPermit
        ? "Allow this project's Seller to view Buyer View Logs & Favorites under Interested Leads?"
        : "Hide Buyer View Logs & Favorites from this project's Seller?",
      nextPermit ? "Yes, Permit Owner" : "Yes, Revoke",
      nextPermit ? "#059669" : "#d97706",
    );
    if (!confirmed) return;
    try {
      await setProjectOwnerLeadPermit(projectUuid, nextPermit);
      setViewLogs((prev) =>
        prev.map((v) => (v.projectUuid === projectUuid ? { ...v, allowOwnerLeadView: nextPermit } : v)),
      );
      setFavoriteLogs((prev) =>
        prev.map((f) => (f.projectUuid === projectUuid ? { ...f, allowOwnerLeadView: nextPermit } : f)),
      );
      setProjects((prev) =>
        prev.map((p) => (p.uuid === projectUuid ? { ...p, allowOwnerLeadView: nextPermit } : p)),
      );
      await showAlert.success(
        nextPermit ? "Permitted!" : "Revoked",
        nextPermit
          ? "Seller can now see Interested Leads for this project."
          : "Owner lead permission has been revoked.",
      );
    } catch (e: any) {
      await showAlert.error("Failed", e?.message || "Could not update owner permit");
    }
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      await showAlert.warning("Required", "Category name is required");
      return;
    }
    try {
      if (categoryModal.item?.uuid) {
        await updateCategory(categoryModal.item.uuid, {
          name: categoryForm.name.trim(),
          code: categoryForm.code.trim() || undefined,
        });
      } else {
        if (!categoryForm.code.trim()) {
          await showAlert.warning("Required", "Category code is required");
          return;
        }
        await createCategory({
          name: categoryForm.name.trim(),
          code: categoryForm.code.trim(),
        });
      }
      setCategoryModal({ open: false, item: null });
      await showAlert.success("Saved!", "Category saved successfully.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Save Failed", e?.message || "Save category failed");
    }
  }

  async function handleDeleteCategory(category: ProjectCategoryRecord) {
    if (!category.uuid) return;
    const confirmed = await showAlert.confirm(
      "Delete Category?",
      `Delete category "${category.name}"?`,
      "Yes, Delete",
      "#e11d48",
    );
    if (!confirmed) return;
    try {
      await deleteCategory(category.uuid);
      await showAlert.success("Deleted", "Category deleted successfully.");
      await loadAllData();
    } catch (e: any) {
      await showAlert.error("Delete Failed", e?.message || "Delete category failed");
    }
  }

  // Statistics
  const pendingCount = useMemo(
    () => projects.filter((p) => String(p.status || "").toLowerCase() === "pending").length,
    [projects],
  );
  const approvedCount = useMemo(
    () => projects.filter((p) => String(p.status || "").toLowerCase() === "approved").length,
    [projects],
  );
  const publishedCount = useMemo(
    () => projects.filter((p) => String(p.status || "").toLowerCase() === "published").length,
    [projects],
  );
  const publishRequestedCount = useMemo(
    () => projects.filter((p) => String(p.status || "").toLowerCase() === "publish_requested").length,
    [projects],
  );
  const rejectedCount = useMemo(
    () => projects.filter((p) => String(p.status || "").toLowerCase() === "rejected").length,
    [projects],
  );
  const unpublishedCount = useMemo(
    () => projects.filter((p) => String(p.status || "").toLowerCase() === "unpublished").length,
    [projects],
  );

  // Filtered Projects for "All Project" View
  const filteredProjects = useMemo(() => {
    let list = projectStatusFilter === "trash" ? trashProjects : projects;

    if (["pending", "approved", "publish_requested", "published", "rejected", "unpublished"].includes(projectStatusFilter)) {
      list = list.filter((p) => String(p.status || "").toLowerCase() === projectStatusFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        `${String(p.name || "")} ${String(p.code || "")} ${String(p.location || "")}`.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sortOrder === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      if (sortOrder === "oldest") return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }, [projects, trashProjects, projectStatusFilter, searchQuery, sortOrder]);

  // Paginated Slices (10 items per page)
  const paginatedProjects = useMemo(() => {
    const start = (projectPage - 1) * 10;
    return filteredProjects.slice(start, start + 10);
  }, [filteredProjects, projectPage]);

  const currentInvestmentsList = useMemo(
    () => (investmentTrashView ? trashInvestments : investments),
    [investmentTrashView, trashInvestments, investments],
  );

  const paginatedInvestments = useMemo(() => {
    const start = (investmentPage - 1) * 10;
    return currentInvestmentsList.slice(start, start + 10);
  }, [currentInvestmentsList, investmentPage]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * 10;
    return users.slice(start, start + 10);
  }, [users, userPage]);

  const paginatedCategories = useMemo(() => {
    const start = (categoryPage - 1) * 10;
    return categories.slice(start, start + 10);
  }, [categories, categoryPage]);

  const paginatedDashboardInvestments = useMemo(() => {
    const start = (dashboardInvestmentPage - 1) * 10;
    return investments.slice(start, start + 10);
  }, [investments, dashboardInvestmentPage]);

  // Recharts Chart 1: Monthly investment flow
  const monthlyChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result: Array<{ month: string; amount: number; shares: number; count: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]}`;
      const year = d.getFullYear();
      const monthIdx = d.getMonth();

      let amt = 0;
      let shares = 0;
      let count = 0;

      investments.forEach((inv) => {
        if (!inv.createdAt) return;
        const invDate = new Date(inv.createdAt);
        if (invDate.getFullYear() === year && invDate.getMonth() === monthIdx) {
          amt += Number(inv.totalAmount || inv.amount || 0);
          shares += Number(inv.shares || inv.quantity || 1);
          count += 1;
        }
      });

      result.push({ month: label, amount: amt, shares, count });
    }

    const totalAmt = result.reduce((s, r) => s + r.amount, 0);
    if (totalAmt === 0 && investments.length > 0) {
      const sum = investments.reduce((acc, inv) => acc + Number(inv.totalAmount || inv.amount || 0), 0);
      result[result.length - 1].amount = sum;
      result[result.length - 1].count = investments.length;
    }

    return result;
  }, [investments]);

  // Recharts Chart 2: Project status breakdown
  const projectStatusChartData = useMemo(() => [
    { name: "Published", count: publishedCount, fill: "#0ea5e9" },
    { name: "Approved", count: approvedCount, fill: "#10b981" },
    { name: "Req Publish", count: publishRequestedCount, fill: "#8b5cf6" },
    { name: "Pending", count: pendingCount, fill: "#f59e0b" },
    { name: "Rejected", count: rejectedCount, fill: "#f43f5e" },
    { name: "Unpub", count: unpublishedCount, fill: "#64748b" },
  ], [publishedCount, approvedCount, publishRequestedCount, pendingCount, rejectedCount, unpublishedCount]);

  // Sidebar Menu Items - Exactly as requested: Dashboard, All Project, Share User, Category (+ Investments)
  const sidebarItems: Array<{
    key: SidebarMenuKey;
    label: string;
    icon: any;
    count?: number;
  }> = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "projects", label: "All Project", icon: Building2, count: projects.length },
    { key: "investments", label: "Investments", icon: Landmark, count: investments.length },
    { key: "analytics", label: "Views & Favorites", icon: Heart, count: viewLogs.length },
    { key: "users", label: "Share User", icon: Users, count: users.length },
    { key: "categories", label: "Category", icon: FolderClosed, count: categories.length },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  // Filtering tabs inside "All Project" page for all the sub-statuses from the user's screenshot
  const projectFilterTabs: Array<{ key: ProjectFilterStatus; label: string; count: number }> = [
    { key: "all", label: "All Projects", count: projects.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "publish_requested", label: "Requested For Publish", count: publishRequestedCount },
    { key: "published", label: "Published", count: publishedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
    { key: "unpublished", label: "Unpublished", count: unpublishedCount },
    { key: "trash", label: "Trash", count: trashProjects.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* 1. Share Project Main Site Navbar (as requested: "share project er main navbar ti all dashboard etakbe") */}
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
              {sidebarItems.map(({ key, label, icon: Icon, count }) => {
                const isActive = activeMenu === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveMenu(key);
                      setSearchQuery("");
                      setSelectedProjectUuid(null);
                      setIsMobileSidebarOpen(false);
                    }}
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
                    {count !== undefined && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
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

          {/* ==================== 3. MAIN DASHBOARD CONTENT ==================== */}
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
                  <span className="text-slate-400">Admin</span>
                  <ChevronRight className="h-3 w-3 text-slate-300" />
                  <button
                    type="button"
                    onClick={() => {
                      if (activeMenu === "projects" && selectedProjectUuid) {
                        handleBackToProjects();
                      }
                    }}
                    className={`font-bold capitalize transition ${
                      selectedProjectUuid ? "text-slate-500 hover:text-slate-900 cursor-pointer" : "text-slate-900"
                    }`}
                  >
                    {activeMenu === "projects" ? "All Project" : activeMenu}
                  </button>
                  {selectedProjectData && (
                    <>
                      <ChevronRight className="h-3 w-3 text-slate-300" />
                      <span className="font-bold text-emerald-700 truncate max-w-xs">
                        {String(selectedProjectData.name || selectedProjectData.code || "")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadAllData()}
                  disabled={loading}
                  title="Refresh telemetry"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-bold">Error Notice</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* VIEW: DASHBOARD OVERVIEW */}
              {activeMenu === "dashboard" && (
                <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-5">
                  <div className="shrink-0 space-y-4">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {t({ bn: "এডমিন ওভারভিউ", en: "Admin Dashboard" })}
                      </h1>
                      <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        {t({
                          bn: "শেয়ার প্রজেক্টের রিয়েল-টাইম মেট্রিক্স, অনুমোদন পেন্ডিং ও অ্যাক্টিভিটি।",
                          en: "Real-time metrics, project pipeline, and shareholder governance.",
                        })}
                      </p>
                    </div>

                  {/* Stat Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu("projects");
                        setProjectStatusFilter("all");
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        All Projects
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-slate-900">
                        {loading ? "..." : projects.length}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Total registered projects</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu("projects");
                        setProjectStatusFilter("pending");
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                        Pending Approval
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-amber-600">
                        {loading ? "..." : pendingCount}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Waiting for review</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu("projects");
                        setProjectStatusFilter("published");
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                        Published Live
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-sky-600">
                        {loading ? "..." : publishedCount}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Active for investment</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMenu("investments")}
                      className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        Investments
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-emerald-600">
                        {loading ? "..." : investments.length}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Total applications</p>
                    </button>
                  </div>
                  </div>

                  {/* ==================== SCROLLABLE ANALYTICS & TABLES ==================== */}
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1 pb-4">
                  {/* ==================== RECHARTS ANALYTICS SECTION ==================== */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Investment Capital Trends (Area Chart) */}
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">
                            {t({ bn: "ইনভেস্টমেন্ট ভলিউম ট্রেন্ড", en: "Investment Volume Analytics" })}
                          </h2>
                          <p className="text-[11px] text-slate-400">
                            {t({
                              bn: "মাসিক শেয়ারহোল্ডার ইনভেস্টমেন্ট ও ক্যাপিটাল ফ্লো।",
                              en: "Monthly capital flow and investor commitments.",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Tk Volume
                          </span>
                        </div>
                      </div>

                      <div className="h-64 w-full">
                        {isMounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                              <defs>
                                <linearGradient id="invVolGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                                        <p className="text-xs font-bold text-slate-900">{d.month}</p>
                                        <p className="mt-1 text-sm font-extrabold text-emerald-600">
                                          Tk {Number(d.amount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          {d.count} investment orders • {d.shares} total shares
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#invVolGrad)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full animate-pulse rounded-xl bg-slate-50" />
                        )}
                      </div>
                    </div>

                    {/* Right: Project Distribution (Bar Chart) */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                      <div className="border-b border-slate-100 pb-3 mb-4">
                        <h2 className="text-sm font-bold text-slate-900">
                          {t({ bn: "প্রজেক্ট স্ট্যাটাস ডিস্ট্রিবিউশন", en: "Project Pipeline Status" })}
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {t({
                            bn: "বর্তমান প্রজেক্টগুলোর স্টেজভিত্তিক অনুপাত।",
                            en: "Registered projects broken down by review stage.",
                          })}
                        </p>
                      </div>

                      <div className="h-64 w-full">
                        {isMounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projectStatusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                allowDecimals={false}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                      <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl">
                                        <p className="text-xs font-bold text-slate-900">{d.name}</p>
                                        <p className="text-xs font-semibold text-slate-700">{d.count} Projects</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {projectStatusChartData.map((entry, index) => (
                                  <Cell key={`status-bar-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full animate-pulse rounded-xl bg-slate-50" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Split View */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Pending Projects Queue */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-amber-500" />
                          <h2 className="font-bold text-slate-900 text-sm">
                            Pending Projects Review ({pendingCount})
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenu("projects");
                            setProjectStatusFilter("pending");
                          }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          View All
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {projects.filter((p) => String(p.status).toLowerCase() === "pending").length === 0 ? (
                          <p className="py-8 text-center text-xs text-slate-400">
                            No projects pending review.
                          </p>
                        ) : (
                          projects
                            .filter((p) => String(p.status).toLowerCase() === "pending")
                            .slice(0, 5)
                            .map((p) => (
                              <div
                                key={String(p.uuid || p.id)}
                                className="flex items-center justify-between gap-3 py-3"
                              >
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProjectDetail(p.uuid)}
                                    className="font-bold text-slate-900 hover:text-emerald-600 truncate block text-xs text-left"
                                  >
                                    {String(p.name || p.code || "Untitled")}
                                  </button>
                                  <p className="text-[11px] text-slate-400">
                                    Tk {Number(p.totalInvestmentAmount || 0).toLocaleString()} • {String(p.location || "")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleApproveProject(p.uuid)}
                                    className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setRejectingProject(p)}
                                    className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Recent Share Investments */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-indigo-500" />
                          <h2 className="font-bold text-slate-900 text-sm">
                            Recent Investment Requests ({investments.length})
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveMenu("investments")}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          View All
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {investments.length === 0 ? (
                          <p className="py-8 text-center text-xs text-slate-400">
                            No investment orders found yet.
                          </p>
                        ) : (
                          paginatedDashboardInvestments.map((inv) => (
                            <div
                              key={String(inv.uuid || inv.id)}
                              className="flex items-center justify-between gap-3 py-3"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs">
                                  {inv.investorName || (inv.user as any)?.name || "Buyer"}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {(inv.project as any)?.name || "Project"} • {String(inv.shares || inv.quantity || 1)} Shares
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-slate-900">
                                  Tk {Number(inv.totalAmount || inv.amount || 0).toLocaleString()}
                                </p>
                                <span
                                  className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                    String(inv.status).toLowerCase() === "confirmed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {inv.status || "Pending"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Pagination
                        currentPage={dashboardInvestmentPage}
                        totalItems={investments.length}
                        pageSize={10}
                        onPageChange={setDashboardInvestmentPage}
                      />
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {/* VIEW: ALL PROJECT (OR PROJECT DETAILS INSIDE DASHBOARD) */}
              {activeMenu === "projects" && (
                selectedProjectUuid ? (
                  selectedProjectLoading ? (
                    <div className="py-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
                      <p className="mt-3 text-sm text-slate-500">Loading project details...</p>
                    </div>
                  ) : selectedProjectData ? (
                    <ProjectDetailContent
                      project={selectedProjectData}
                      investments={selectedProjectInvestments}
                      onBack={handleBackToProjects}
                      onRefresh={async () => {
                        await loadAllData();
                        await handleOpenProjectDetail(selectedProjectUuid);
                      }}
                    />
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                      <p className="text-slate-500 text-sm">Project could not be found.</p>
                      <button
                        type="button"
                        onClick={handleBackToProjects}
                        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                      >
                        Back to All Projects
                      </button>
                    </div>
                  )
                ) : (
                <div className="space-y-5">
                  {/* Top Bar with Title & Search */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        All Share Projects
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Review, filter, publish, and govern all shareholder property projects.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search project, code, location..."
                          className="h-9 w-48 sm:w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                        />
                      </div>
                      <select
                        value={sortOrder}
                        onChange={(e: any) => setSortOrder(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">By Name</option>
                      </select>
                    </div>
                  </div>

                  {/* Status Filtering Inputs as requested: Pending, Approved, Published, Rejected, Unpublished, Trash */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
                    <div className="flex min-w-max items-center gap-1.5">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400">
                        <Filter className="h-3.5 w-3.5" />
                        Status:
                      </span>
                      {projectFilterTabs.map((tab) => {
                        const isSelected = projectStatusFilter === tab.key;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setProjectStatusFilter(tab.key)}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              isSelected
                                ? "bg-slate-900 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                                isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Projects Table (Sticky Header & Pagination, Scrollable Body) */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold shadow-2xs">
                          <tr>
                            <th className="px-4 py-3.5">Project</th>
                            <th className="px-4 py-3.5">Category</th>
                            <th className="px-4 py-3.5">Location</th>
                            <th className="px-4 py-3.5">Financials</th>
                            <th className="px-4 py-3.5">Status</th>
                            <th className="px-4 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {loading ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                                <p className="mt-2">Loading projects...</p>
                              </td>
                            </tr>
                          ) : filteredProjects.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400">
                                No projects match the selected filter ({projectStatusFilter}).
                              </td>
                            </tr>
                          ) : (
                            paginatedProjects.map((p) => {
                              const isActionLoading = actionLoadingUuid === p.uuid;
                              const st = String(p.status || "draft").toLowerCase();
                              return (
                                <tr key={String(p.uuid || p.id)} className="hover:bg-slate-50/60 transition">
                                  <td className="px-4 py-3.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenProjectDetail(p.uuid)}
                                      className="font-bold text-slate-900 hover:text-emerald-600 block text-sm text-left truncate"
                                    >
                                      {String(p.name || p.code || "Untitled")}
                                    </button>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {String(p.code || p.uuid?.slice(0, 8) || "")}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                                      {String((p.category as any)?.name || "General")}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-slate-500">
                                    {String(p.location || "-")}
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <p className="font-semibold text-slate-900">
                                      Tk {Number(p.totalInvestmentAmount || 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {p.totalShares || 0} Shares • Tk {p.pricePerShare || 0}/share
                                    </p>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        st === "published"
                                          ? "bg-sky-100 text-sky-800"
                                          : st === "approved"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : st === "publish_requested"
                                          ? "bg-purple-100 text-purple-800"
                                          : st === "rejected"
                                          ? "bg-rose-100 text-rose-800"
                                          : st === "pending"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {st === "publish_requested" ? "Requested For Publish" : st}
                                    </span>
                                    {Boolean(p.rejectionReason) && (
                                      <p
                                        className="mt-1 text-[10px] text-rose-600 truncate max-w-xs"
                                        title={String(p.rejectionReason)}
                                      >
                                        Reason: {String(p.rejectionReason)}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenProjectDetail(p.uuid)}
                                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                      >
                                        Details
                                      </button>

                                      {st === "pending" && (
                                        <>
                                          <button
                                            disabled={isActionLoading}
                                            onClick={() => handleApproveProject(p.uuid)}
                                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            disabled={isActionLoading}
                                            onClick={() => setRejectingProject(p)}
                                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                                          >
                                            Reject
                                          </button>
                                        </>
                                      )}

                                      {["approved", "unpublished", "publish_requested"].includes(st) &&
                                        projectStatusFilter !== "trash" && (
                                          <button
                                            disabled={isActionLoading}
                                            onClick={() => handlePublishProject(p.uuid)}
                                            className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                                          >
                                            Publish
                                          </button>
                                        )}

                                      {st === "published" && projectStatusFilter !== "trash" && (
                                        <button
                                          disabled={isActionLoading}
                                          onClick={() => handleUnpublishProject(p.uuid)}
                                          className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                                        >
                                          Unpublish
                                        </button>
                                      )}

                                      {projectStatusFilter === "trash" ? (
                                        <button
                                          disabled={isActionLoading}
                                          onClick={() => handleRestoreProject(p.uuid)}
                                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                          Restore
                                        </button>
                                      ) : (
                                        <button
                                          disabled={isActionLoading}
                                          onClick={() => handleDeleteProject(p.uuid)}
                                          title="Move to trash"
                                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={projectPage}
                      totalItems={filteredProjects.length}
                      pageSize={10}
                      onPageChange={setProjectPage}
                    />
                  </div>
                </div>
                )
              )}

              {/* VIEW: INVESTMENTS */}
              {activeMenu === "investments" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {investmentTrashView ? "Trash Investments" : "Share Investments"}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Review shareholder purchase orders, payment verification and approvals.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInvestmentTrashView(false)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          !investmentTrashView ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
                        }`}
                      >
                        Active ({investments.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvestmentTrashView(true)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                          investmentTrashView ? "bg-red-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                        }`}
                      >
                        <Trash2 className="h-3 w-3" />
                        Trash ({trashInvestments.length})
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold shadow-2xs">
                          <tr>
                            <th className="px-4 py-3.5">Buyer</th>
                            <th className="px-4 py-3.5">Project</th>
                            <th className="px-4 py-3.5">Shares</th>
                            <th className="px-4 py-3.5">Amount</th>
                            <th className="px-4 py-3.5">Payment</th>
                            <th className="px-4 py-3.5">Status</th>
                            <th className="px-4 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(investmentTrashView ? trashInvestments : investments).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                No investment records found in this view.
                              </td>
                            </tr>
                          ) : (
                            paginatedInvestments.map((inv) => (
                              <tr key={String(inv.uuid || inv.id)} className="hover:bg-slate-50/60 transition">
                                <td className="px-4 py-3.5">
                                  <p className="font-bold text-slate-900">
                                    {inv.investorName || (inv.user as any)?.name || "Anonymous"}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {String(inv.investorEmail || (inv.user as any)?.email || "-")} •{" "}
                                    {String(inv.investorPhone || (inv.user as any)?.phone || "")}
                                  </p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="font-semibold text-slate-800">
                                    {(inv.project as any)?.name || "Project"}
                                  </span>
                                  {(inv.project as any)?.code && (
                                    <p className="text-[10px] text-slate-400">{(inv.project as any).code}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 font-bold text-slate-900">
                                  {String(inv.shares || inv.quantity || 1)}
                                </td>
                                <td className="px-4 py-3.5 font-bold text-emerald-600">
                                  Tk {Number(inv.totalAmount || inv.amount || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3.5">
                                  <p className="font-medium text-slate-700 capitalize">
                                    {inv.paymentMethod || "Bank / Manual"}
                                  </p>
                                  {inv.transactionId && (
                                    <p className="text-[10px] font-mono text-slate-400">
                                      Trx: {inv.transactionId}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                      String(inv.status).toLowerCase() === "confirmed"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : String(inv.status).toLowerCase() === "cancelled"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {inv.status || "Pending"}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!investmentTrashView ? (
                                      <>
                                        {String(inv.status).toLowerCase() !== "confirmed" && (
                                          <button
                                            onClick={() => handleApproveInvestment(inv.uuid)}
                                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                                          >
                                            Approve
                                          </button>
                                        )}
                                        {String(inv.status).toLowerCase() !== "cancelled" && (
                                          <button
                                            onClick={() => setRejectingInvestment(inv)}
                                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                                          >
                                            Reject
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteInvestment(inv.uuid)}
                                          title="Move to trash"
                                          className="p-1 text-slate-400 hover:text-red-500"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => handleRestoreInvestment(inv.uuid)}
                                        className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                        Restore
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={investmentPage}
                      totalItems={currentInvestmentsList.length}
                      pageSize={10}
                      onPageChange={setInvestmentPage}
                    />
                  </div>
                </div>
              )}

              {/* VIEW: SHARE USERS */}
              {activeMenu === "users" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Share Users & Buyers
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Manage registered users, shareholder profiles, roles and access control.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUserForm({
                            name: "",
                            email: "",
                            phone: "",
                            password: "",
                            userType: "buyer",
                            profession: "",
                            designation: "",
                            budget: "৳৫,০০,০০০ - ৳১০,০০,০০০",
                            preferableCategory: "Commercial Real Estate",
                            interestedLocation: "Dhaka",
                            nid: "",
                            tradeLicense: "",
                            mdName: "",
                            officeAddress: "",
                            sellerPhone: "",
                            website: "",
                            facebookPage: "",
                          });
                          setUserModal({ open: true, item: null });
                        }}
                        className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition flex items-center gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add User
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold shadow-2xs">
                          <tr>
                            <th className="px-4 py-3.5">User</th>
                            <th className="px-4 py-3.5">Phone</th>
                            <th className="px-4 py-3.5">Role</th>
                            <th className="px-4 py-3.5">Status</th>
                            <th className="px-4 py-3.5">Registered</th>
                            <th className="px-4 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400">
                                No users registered on the platform.
                              </td>
                            </tr>
                          ) : (
                            paginatedUsers.map((u) => {
                              const isBlocked = u.status?.toLowerCase() === "blocked";
                              return (
                                <tr key={String(u.uuid || u.id)} className="hover:bg-slate-50/60 transition">
                                  <td className="px-4 py-3.5">
                                    <p className="font-bold text-slate-900">{u.name || "User"}</p>
                                    <p className="text-[11px] text-slate-400">{u.email}</p>
                                  </td>
                                  <td className="px-4 py-3.5 text-slate-600">
                                    {u.phone || u.mobileNo || "-"}
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 capitalize">
                                      {u.role || "Owner"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        isBlocked
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      }`}
                                    >
                                      {u.status || "Active"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                                  </td>
                                  <td className="px-4 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => {
                                          setUserForm((prev) => ({
                                            ...prev,
                                            name: String(u.name || ""),
                                            email: String(u.email || ""),
                                            phone: String(u.phone || u.mobileNo || ""),
                                            password: "",
                                          }));
                                          setUserModal({ open: true, item: u });
                                        }}
                                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleToggleBlockUser(u)}
                                        disabled={actionLoadingUuid === u.uuid}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                                          isBlocked
                                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                        }`}
                                      >
                                        {isBlocked ? "Unblock" : "Block"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(u)}
                                        disabled={actionLoadingUuid === u.uuid}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                                        title="Delete User (Soft Delete)"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={userPage}
                      totalItems={users.length}
                      pageSize={10}
                      onPageChange={setUserPage}
                    />
                  </div>
                </div>
              )}

              {/* VIEW: CATEGORIES */}
              {activeMenu === "categories" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Project Categories
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Manage categories and classifications for share projects.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryForm({ name: "", code: "" });
                          setCategoryModal({ open: true, item: null });
                        }}
                        className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition flex items-center gap-1.5"
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                        Add Category
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold shadow-2xs">
                          <tr>
                            <th className="px-4 py-3.5">Category Name</th>
                            <th className="px-4 py-3.5">Code</th>
                            <th className="px-4 py-3.5">Created Date</th>
                            <th className="px-4 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {categories.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-400">
                                No categories defined yet.
                              </td>
                            </tr>
                          ) : (
                            paginatedCategories.map((c) => (
                              <tr key={String(c.uuid || c.id || c.code)} className="hover:bg-slate-50/60 transition">
                                <td className="px-4 py-3.5 font-bold text-slate-900 text-sm">
                                  {c.name}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-slate-600">
                                  {c.code || "-"}
                                </td>
                                <td className="px-4 py-3.5 text-slate-400">
                                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setCategoryForm({ name: String(c.name || ""), code: String(c.code || "") });
                                        setCategoryModal({ open: true, item: c });
                                      }}
                                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(c)}
                                      className="rounded-lg p-1 text-slate-400 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={categoryPage}
                      totalItems={categories.length}
                      pageSize={10}
                      onPageChange={setCategoryPage}
                    />
                  </div>
                </div>
              )}

              {/* VIEW: ANALYTICS (BUYER VIEWS & FAVORITES) */}
              {activeMenu === "analytics" && (() => {
                const q = searchQuery.trim().toLowerCase();
                const filteredViews = viewLogs.filter((v) => {
                  if (!q) return true;
                  return `${v.viewerName || ""} ${v.viewerEmail || ""} ${v.viewerPhone || ""} ${v.projectName || ""} ${v.projectCode || ""}`
                    .toLowerCase()
                    .includes(q);
                });
                const filteredFavs = favoriteLogs.filter((f) => {
                  if (!q) return true;
                  return `${f.userName || ""} ${f.userEmail || ""} ${f.userPhone || ""} ${f.projectName || ""} ${f.projectCode || ""}`
                    .toLowerCase()
                    .includes(q);
                });
                const activeList = analyticsTab === "views" ? filteredViews : filteredFavs;
                const paginatedAnalytics = activeList.slice((analyticsPage - 1) * 10, analyticsPage * 10);

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                          Buyer Views &amp; Favorites Analytics
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Track buyer visit counts, exact visit timestamps, favorites, and manage Seller lead permissions.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setAnalyticsPage(1);
                            }}
                            placeholder="Search buyer, project..."
                            className="h-9 w-48 sm:w-56 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAnalyticsTab("views");
                            setAnalyticsPage(1);
                          }}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                            analyticsTab === "views"
                              ? "bg-slate-900 text-white"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Logs ({filteredViews.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAnalyticsTab("favorites");
                            setAnalyticsPage(1);
                          }}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                            analyticsTab === "favorites"
                              ? "bg-rose-600 text-white"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Heart className="h-3.5 w-3.5" />
                          Favorites ({filteredFavs.length})
                        </button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                      <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
                        {analyticsTab === "views" ? (
                          <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold shadow-2xs">
                              <tr>
                                <th className="px-4 py-3.5">Buyer / Visitor</th>
                                <th className="px-4 py-3.5">Project</th>
                                <th className="px-4 py-3.5 text-center">Total Views</th>
                                <th className="px-4 py-3.5">Favorite</th>
                                <th className="px-4 py-3.5">Last Viewed</th>
                                <th className="px-4 py-3.5 text-center">Permit for Owner</th>
                                <th className="px-4 py-3.5 text-right">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {paginatedAnalytics.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="py-12 text-center text-slate-400">
                                    No buyer project view logs recorded yet.
                                  </td>
                                </tr>
                              ) : (
                                paginatedAnalytics.map((v) => (
                                  <tr key={v.key} className="hover:bg-slate-50/60 transition">
                                    <td className="px-4 py-3.5">
                                      <p className="font-bold text-slate-900">{v.viewerName || "Guest Buyer"}</p>
                                      <p className="text-[11px] text-slate-500">
                                        {v.viewerEmail || v.viewerPhone || v.visitorKey}
                                      </p>
                                      {v.viewerPhone && v.viewerEmail && (
                                        <p className="text-[10px] text-slate-400">{v.viewerPhone}</p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <p className="font-bold text-slate-900">{v.projectName}</p>
                                      <p className="text-[11px] text-slate-400">{v.projectCode || v.projectLocation}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                                        {v.viewCount}x
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      {v.isFavorited ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600">
                                          <Heart className="h-3 w-3 fill-rose-500" /> Favorited
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 text-[11px] text-slate-600">
                                      {v.lastViewedAt ? new Date(v.lastViewedAt).toLocaleString() : "-"}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleOwnerLeadPermit(v.projectUuid, Boolean(v.allowOwnerLeadView))}
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                          v.allowOwnerLeadView
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                        }`}
                                      >
                                        {v.allowOwnerLeadView ? "Permitted" : "Permit Owner"}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedViewLog(v)}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                      >
                                        Timestamps ({v.timestamps?.length || v.viewCount})
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        ) : (
                          <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold shadow-2xs">
                              <tr>
                                <th className="px-4 py-3.5">Buyer</th>
                                <th className="px-4 py-3.5">Project</th>
                                <th className="px-4 py-3.5">Favorited At</th>
                                <th className="px-4 py-3.5 text-center">Permit for Owner</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {paginatedAnalytics.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-slate-400">
                                    No project favorites recorded yet.
                                  </td>
                                </tr>
                              ) : (
                                paginatedAnalytics.map((f) => (
                                  <tr key={f.uuid} className="hover:bg-slate-50/60 transition">
                                    <td className="px-4 py-3.5">
                                      <p className="font-bold text-slate-900">{f.userName || "Buyer"}</p>
                                      <p className="text-[11px] text-slate-500">{f.userEmail || f.userPhone || "-"}</p>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <p className="font-bold text-slate-900">{f.projectName}</p>
                                      <p className="text-[11px] text-slate-400">{f.projectCode || f.projectLocation}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-[11px] text-slate-600">
                                      {f.favoritedAt ? new Date(f.favoritedAt).toLocaleString() : "-"}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleOwnerLeadPermit(f.projectUuid, Boolean(f.allowOwnerLeadView))}
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                          f.allowOwnerLeadView
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                        }`}
                                      >
                                        {f.allowOwnerLeadView ? "Permitted" : "Permit Owner"}
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <Pagination
                        currentPage={analyticsPage}
                        totalItems={activeList.length}
                        pageSize={10}
                        onPageChange={setAnalyticsPage}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* VIEW: SETTINGS */}
              {activeMenu === "settings" && <AdminProjectImageSettings />}
            </main>
          </div>
        </div>
      </div>

      {/* ==================== MODAL: REJECT PROJECT ==================== */}
      {rejectingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRejectProjectSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Reject Project: {String(rejectingProject.name || rejectingProject.code || "")}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingProject(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">
                Rejection Note / Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain the required modifications or reason for rejection..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingProject(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL: REJECT INVESTMENT ==================== */}
      {rejectingInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRejectInvestmentSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Reject Investment</h3>
              <button
                type="button"
                onClick={() => setRejectingInvestment(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={investmentRejectReason}
                onChange={(e) => setInvestmentRejectReason(e.target.value)}
                placeholder="Specify the reason (e.g. payment transaction mismatch)..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingInvestment(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Reject Investment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL: CATEGORY CREATE / EDIT ==================== */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveCategory}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {categoryModal.item ? "Edit Category" : "Add Project Category"}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModal({ open: false, item: null })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Agro Venture"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block">
                  Category Code {!categoryModal.item && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  required={!categoryModal.item}
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                  placeholder="e.g. AGRO"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono uppercase"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryModal({ open: false, item: null })}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL: USER CREATE / EDIT ==================== */}
      {userModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSaveUser}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {userModal.item ? "Edit Share User" : "Add New Share User"}
                </h3>
                <p className="text-xs text-slate-500">
                  {userModal.item ? "Update user profile and details" : "Create a new Buyer or Seller account"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserModal({ open: false, item: null })}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Role Selection (Only on Create) */}
            {!userModal.item && (
              <div className="mt-4 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  অ্যাকাউন্টের ধরন / Role Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, userType: "buyer" })}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                      userForm.userType === "buyer"
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">বায়ার (Buyer)</p>
                      <p className="text-[11px] text-slate-500">বিনিয়োগকারী / ক্রেতা</p>
                    </div>
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                        userForm.userType === "buyer"
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-300 bg-white"
                      }`}
                    >
                      {userForm.userType === "buyer" ? "✓" : ""}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, userType: "seller" })}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                      userForm.userType === "seller"
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">সেলার (Seller)</p>
                      <p className="text-[11px] text-slate-500">প্রজেক্ট ওনার / বিক্রেতা</p>
                    </div>
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                        userForm.userType === "seller"
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-300 bg-white"
                      }`}
                    >
                      {userForm.userType === "seller" ? "✓" : ""}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Basic Info Fields */}
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="e.g. Dr. Anisur Rahman"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="+880 1700 000000"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {!userModal.item && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="buyer@shareproject.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Min 8 characters"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              )}

              {userModal.item && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block">
                    Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              )}

              {/* Conditional Buyer Profile Fields */}
              {!userModal.item && userForm.userType === "buyer" && (
                <div className="rounded-2xl border border-sky-200/70 bg-sky-50/40 p-4 space-y-3 mt-4">
                  <p className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>বায়ার প্রোফাইল তথ্য (Buyer Profile)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        পেশা / Profession <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={userForm.profession}
                        onChange={(e) => setUserForm({ ...userForm, profession: e.target.value })}
                        placeholder="e.g. Doctor, Engineer, Banker"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        পদবি / Designation
                      </label>
                      <input
                        type="text"
                        value={userForm.designation}
                        onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                        placeholder="e.g. Senior Consultant"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        বাজেট / Budget Range <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={userForm.budget}
                        onChange={(e) => setUserForm({ ...userForm, budget: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      >
                        <option value="৳৫০,০০০ - ৳১,০০,০০০">৳৫০,০০০ - ৳১,০০,০০০</option>
                        <option value="৳১,০০,০০০ - ৳৫,০০,০০০">৳১,০০,০০০ - ৳৫,০০,০০০</option>
                        <option value="৳৫,০০,০০০ - ৳১০,০০,০০০">৳৫,০০,০০০ - ৳১০,০০,০০০</option>
                        <option value="৳১০,০০,০০০ - ৳২৫,০০,০০০">৳১০,০০,০০০ - ৳২৫,০০,০০০</option>
                        <option value="৳২৫,০০,০০০ - ৳১,০০,০০,০০০+">৳২৫,০০,০০০ - ৳১,০০,০০,০০০+</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        পছন্দের ক্যাটাগরি / Preferable Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={userForm.preferableCategory}
                        onChange={(e) => setUserForm({ ...userForm, preferableCategory: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      >
                        <option value="Commercial Real Estate">Commercial Real Estate</option>
                        <option value="Hotel & Resort">Hotel & Resort</option>
                        <option value="Renewable Energy">Renewable Energy</option>
                        <option value="Agro & Dairy">Agro & Dairy</option>
                        <option value="Transport & Logistics">Transport & Logistics</option>
                        <option value="Technology & Startups">Technology & Startups</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block">
                      আগ্রহী প্রজেক্ট লোকেশন / Interested Location
                    </label>
                    <input
                      type="text"
                      value={userForm.interestedLocation}
                      onChange={(e) => setUserForm({ ...userForm, interestedLocation: e.target.value })}
                      placeholder="e.g. Dhaka, Chittagong, Cox's Bazar"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Seller Profile Fields */}
              {!userModal.item && userForm.userType === "seller" && (
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 space-y-3 mt-4">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>সেলার প্রোফাইল তথ্য (Seller Profile)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        জাতীয় পরিচয়পত্র / NID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={userForm.nid}
                        onChange={(e) => setUserForm({ ...userForm, nid: e.target.value })}
                        placeholder="NID Number"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        ট্রেড লাইসেন্স / Trade License <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={userForm.tradeLicense}
                        onChange={(e) => setUserForm({ ...userForm, tradeLicense: e.target.value })}
                        placeholder="Trade License No"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        এমডি বা সত্ত্বাধিকারীর নাম <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={userForm.mdName}
                        onChange={(e) => setUserForm({ ...userForm, mdName: e.target.value })}
                        placeholder="MD / Proprietor Name"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        অফিস ঠিকানা <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={userForm.officeAddress}
                        onChange={(e) => setUserForm({ ...userForm, officeAddress: e.target.value })}
                        placeholder="Office Address"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        ওয়েবসাইট / Website URL
                      </label>
                      <input
                        type="url"
                        value={userForm.website}
                        onChange={(e) => setUserForm({ ...userForm, website: e.target.value })}
                        placeholder="https://..."
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        ফেসবুক পেজ / Facebook Page
                      </label>
                      <input
                        type="url"
                        value={userForm.facebookPage}
                        onChange={(e) => setUserForm({ ...userForm, facebookPage: e.target.value })}
                        placeholder="https://facebook.com/..."
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserModal({ open: false, item: null })}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                {userModal.item ? "Update User" : `Create ${userForm.userType === "buyer" ? "Buyer" : "Seller"}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW TIMESTAMPS DETAIL MODAL */}
      {selectedViewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Visit Timestamps — {selectedViewLog.viewerName || "Guest Buyer"}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedViewLog.projectName} • Total {selectedViewLog.viewCount} views
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedViewLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
              {(selectedViewLog.timestamps || []).map((tItem: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <span className="font-semibold text-slate-700">
                    Visit #{(selectedViewLog.timestamps?.length || 0) - idx}
                  </span>
                  <span className="font-mono text-slate-600">
                    {tItem.viewedAt ? new Date(tItem.viewedAt).toLocaleString() : "-"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedViewLog(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
