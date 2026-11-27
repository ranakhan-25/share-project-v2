"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Code, X, Share2, Globe } from "lucide-react";
import toast from "react-hot-toast";

export interface ShareProjectModalProps {
  open: boolean;
  onClose: () => void;
  project: {
    uuid?: string;
    id?: string | number;
    name?: string;
    location?: string;
  } | null;
}

export function ShareProjectModal({ open, onClose, project }: ShareProjectModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const projectUuid = project?.uuid || String(project?.id || "");
  const projectName = project?.name || "Share Project";

  useEffect(() => {
    if (projectUuid) {
      const siteOrigin = (
        process.env.NEXT_PUBLIC_SITE_URL || "https://share.realbizerp.online"
      ).replace(/\/+$/, "");
      setShareUrl(`${siteOrigin}/projects/${projectUuid}`);
    }
  }, [projectUuid]);

  if (!open || !project) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("প্রজেক্টের লিংক কপি হয়েছে!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("লিংক কপি করতে ব্যর্থ হয়েছে");
    }
  };

  const handleCopyEmbed = async () => {
    try {
      const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"></iframe>`;
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      toast.success("এম্বেড কোড কপি হয়েছে!");
      setTimeout(() => setEmbedCopied(false), 2500);
    } catch {
      toast.error("কোড কপি করতে ব্যর্থ হয়েছে");
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`${projectName} - Share Project Platform`);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900">Share Project</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Project Name preview */}
        <div className="mt-4">
          <h4 className="text-sm font-bold text-slate-800 truncate" title={projectName}>
            {projectName}
          </h4>
          {project.location && (
            <p className="text-xs text-slate-400 truncate">{project.location}</p>
          )}
        </div>

        {/* Headline Instruction */}
        <p className="mt-4 text-center text-xs sm:text-sm font-semibold text-slate-700">
          শেয়ার করতে যেকোনো একটি লিংকে ক্লিক করুন
        </p>

        {/* Social Share Icons Row */}
        <div className="mt-5 flex items-center justify-center gap-3 sm:gap-4">
          {/* Embed </ > */}
          <button
            type="button"
            onClick={handleCopyEmbed}
            title="Copy Embed Code"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition shadow-xs hover:scale-105"
          >
            <Code className="h-5 w-5" />
            <span className="absolute -bottom-7 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition pointer-events-none">
              {embedCopied ? "Copied!" : "Embed"}
            </span>
          </button>

          {/* WhatsApp */}
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs hover:opacity-90 hover:scale-105 transition"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </a>

          {/* Facebook */}
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xs hover:opacity-90 hover:scale-105 transition"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          {/* Messenger */}
          <a
            href={shareLinks.messenger}
            target="_blank"
            rel="noopener noreferrer"
            title="Share via Messenger"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-[#006AFF] to-[#00C6FF] text-white shadow-xs hover:opacity-90 hover:scale-105 transition"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.109.307 2.285.474 3.443.474 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/>
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on LinkedIn"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-xs hover:opacity-90 hover:scale-105 transition"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>

          {/* Twitter / X */}
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on X (Twitter)"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-xs hover:opacity-90 hover:scale-105 transition"
          >
            <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>

        {/* URL Box & Copy Button */}
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 pr-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-slate-700 font-mono outline-hidden select-all"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <p className="mt-3 text-center text-[11px] text-slate-400">
          এই লিংকটি যেকোনো ব্রাউজারে খুললে প্রজেক্টের সম্পূর্ণ বিবরণ দেখতে পাওয়া যাবে।
        </p>
      </div>
    </div>
  );
}
