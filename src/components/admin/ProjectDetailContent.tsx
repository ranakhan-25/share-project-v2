"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  ImageIcon,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";

import {
  approveProject,
  publishProject,
  rejectProject,
  restoreProject,
  softDeleteProject,
  unpublishProject,
  type InvestmentRecord,
  type ShareProjectRecord,
} from "@/lib/admin-share-project-api";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProjectDetailContent({
  project,
  investments = [],
  onBack,
  onRefresh,
}: {
  project: ShareProjectRecord;
  investments?: InvestmentRecord[];
  onBack: () => void;
  onRefresh?: () => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const status = String(project.status || "draft").toLowerCase();

  async function handleApprove() {
    if (!project?.uuid || !window.confirm("Approve this share project?")) return;
    setActionLoading(true);
    try {
      await approveProject(project.uuid);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err?.message || "Approve failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project?.uuid || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await rejectProject(project.uuid, rejectionReason.trim());
      setRejecting(false);
      setRejectionReason("");
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err?.message || "Reject failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePublish() {
    if (!project?.uuid) return;
    setActionLoading(true);
    try {
      await publishProject(project.uuid);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err?.message || "Publish failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnpublish() {
    if (!project?.uuid) return;
    setActionLoading(true);
    try {
      await unpublishProject(project.uuid);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err?.message || "Unpublish failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!project?.uuid || !window.confirm("Move this project to trash?")) return;
    setActionLoading(true);
    try {
      await softDeleteProject(project.uuid);
      if (onRefresh) await onRefresh();
      else onBack();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
      setActionLoading(false);
    }
  }

  async function handleRestore() {
    if (!project?.uuid || !window.confirm("Restore this project from trash?")) return;
    setActionLoading(true);
    try {
      await restoreProject(project.uuid);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err?.message || "Restore failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header with Back button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Projects</span>
        </button>

        <span className="text-xs text-slate-400 font-mono">
          UUID: {project.uuid}
        </span>
      </div>

      {/* Hero Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 font-mono">
                {project.code || "NO-CODE"}
              </span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {project.category?.name || "General Category"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  status === "published"
                    ? "bg-sky-100 text-sky-800"
                    : status === "approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : status === "publish_requested"
                    ? "bg-purple-100 text-purple-800"
                    : status === "rejected"
                    ? "bg-rose-100 text-rose-800"
                    : status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {status === "publish_requested" ? "Requested For Publish" : status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
              {String(project.name || project.code || "Untitled Project")}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {project.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {project.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Created: {formatDate(project.createdAt)}
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {status === "pending" && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve Project
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => setRejecting(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}

            {["approved", "unpublished", "publish_requested"].includes(status) && (
              <button
                disabled={actionLoading}
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition disabled:opacity-50"
              >
                <Eye className="h-3.5 w-3.5" />
                Publish to Site
              </button>
            )}

            {status === "published" && (
              <button
                disabled={actionLoading}
                onClick={handleUnpublish}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Unpublish
              </button>
            )}

            {project.deletedAt ? (
              <button
                disabled={actionLoading}
                onClick={handleRestore}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </button>
            ) : (
              <button
                disabled={actionLoading}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Move to Trash
              </button>
            )}
          </div>
        </div>

        {Boolean(project.rejectionReason) && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Rejection Note
            </p>
            <p className="mt-1 text-sm text-rose-900">{String(project.rejectionReason)}</p>
          </div>
        )}
      </div>

      {/* Financial Highlights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Investment
          </p>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            Tk {Number(project.totalInvestmentAmount || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Shares
          </p>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {Number(project.totalShares || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Price Per Share
          </p>
          <p className="mt-2 text-xl font-extrabold text-emerald-600">
            Tk {Number(project.pricePerShare || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Min Investment
          </p>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            Tk {Number(project.minimumInvestment || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Expected Return
          </p>
          <p className="mt-2 text-xl font-extrabold text-indigo-600">
            {project.expectedAnnualReturn ? `${project.expectedAnnualReturn}% / yr` : "N/A"}
          </p>
        </div>
      </div>

      {/* Description & Media Gallery */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Description & Submissions */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="font-bold text-slate-900 text-base">Project Description</h2>
            <div className="mt-4 prose prose-sm max-w-none text-slate-600 whitespace-pre-line text-sm leading-relaxed">
              {String(project.description || "No description provided.")}
            </div>
          </div>

          {/* Images Gallery */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-base">
                Project Gallery ({project.images?.length || 0})
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {!project.images || project.images.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 col-span-3 text-center">
                  No images uploaded for this project.
                </p>
              ) : (
                project.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 aspect-video"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Investor Applications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-base">
                  Investments on this Project ({investments.length})
                </h2>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {investments.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No investments made on this project yet.
                </p>
              ) : (
                investments.map((inv) => (
                  <div
                    key={String(inv.uuid || inv.id)}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {inv.investorName || (inv.user as any)?.name || "Buyer"}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        {String(inv.shares || inv.quantity || 1)} Shares • Trx:{" "}
                        {String(inv.transactionId || "N/A")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
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
          </div>
        </div>

        {/* Right Column: Owner & Documents */}
        <div className="space-y-6">
          {/* Owner Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
              Seller / Creator Info
            </h2>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-900">
                  {project.creatorName || "Not specified"}
                </span>
              </div>
              {project.creatorEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{project.creatorEmail}</span>
                </div>
              )}
              {project.creatorPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{project.creatorPhone}</span>
                </div>
              )}
              {project.companyName && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>Company: {project.companyName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="h-4 w-4 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-base">
                Documents ({project.documents?.length || 0})
              </h2>
            </div>
            <div className="mt-4 space-y-2">
              {!project.documents || project.documents.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No documents attached.
                </p>
              ) : (
                project.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="truncate max-w-[180px] font-medium">
                      {doc.title || `Document #${idx + 1}`}
                    </span>
                    <Download className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Reject Project</h3>
              <button
                type="button"
                onClick={() => setRejecting(false)}
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
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Detail what changes are required before this project can be approved..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
