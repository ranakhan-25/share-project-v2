"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronsLeft, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import { sidebarMenu, type MenuItem, type SubMenuItem } from "./sidebar-data";
import { getStoredUser } from "@/lib/admin-auth/adminAuthStorage";

const isPathActive = (pathname: string, href?: string) => {
  if (!href) return false;
  // Dashboard roots require EXACT match so they don't light up on every subpage
  const exactOnlyRoutes = [
    "/dashboard",
    "/dashboard/accounts",
    "/dashboard/crm",
    "/dashboard/project",
    "/dashboard/owner",
  ];
  if (exactOnlyRoutes.includes(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + "/");
};

function SubItem({ item, onNavigate }: { item: SubMenuItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const { t } = useLang();
  const hasGrandChildren = !!item.children?.length;
  const isGrandChildActive =
    item.children?.some((gc) => isPathActive(pathname, gc.href)) ?? false;
  const [open, setOpen] = useState(isGrandChildActive);

  useEffect(() => {
    if (isGrandChildActive) setOpen(true);
  }, [isGrandChildActive]);

  if (!hasGrandChildren) {
    const on = isPathActive(pathname, item.href);
    return (
      <li>
        <Link
          href={item.href ?? "#"}
          onClick={onNavigate}
          className={`block rounded-lg px-3 py-2 text-[13px] transition ${
            on
              ? "bg-emerald-50 font-semibold text-emerald-700"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {t(item.label)}
        </Link>
      </li>
    );
  }

  return (
    <li className="my-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
      >
        <span className="truncate text-left">{t(item.label)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform text-slate-400 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-3 mt-0.5 space-y-0.5 overflow-hidden border-l border-slate-200 pl-2.5"
          >
            {item.children!.map((c) => {
              const on = isPathActive(pathname, c.href);
              return (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    onClick={onNavigate}
                    className={`block rounded-lg px-2.5 py-1.5 text-xs transition ${
                      on
                        ? "bg-emerald-50 font-semibold text-emerald-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {t(c.label)}
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function Item({ item, collapsed, onNavigate }: { item: MenuItem; collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const { t } = useLang();
  const hasChildren = !!item.children?.length;
  const childActive =
    item.children?.some((c) => {
      if (c.children?.length) {
        return c.children.some((gc) => isPathActive(pathname, gc.href));
      }
      return isPathActive(pathname, c.href);
    }) ?? false;

  const isLeafSelected = !hasChildren && isPathActive(pathname, item.href);
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const base = `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isLeafSelected
      ? "bg-emerald-50 text-emerald-700"
      : collapsed && childActive
      ? "text-emerald-700 bg-emerald-50"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  } ${collapsed ? "justify-center" : ""}`;

  const inner = (
    <>
      {isLeafSelected && (
        <motion.span
          layoutId="side-active"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500"
        />
      )}
      <item.icon
        className={`h-4.5 w-4.5 shrink-0 ${
          isLeafSelected || (collapsed && childActive)
            ? "text-emerald-600"
            : "text-slate-500 group-hover:text-slate-800"
        }`}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{t(item.label)}</span>
          {item.badge && (
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          )}
        </>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 opacity-0 shadow-xl ring-1 ring-slate-200 transition group-hover:opacity-100">
          {t(item.label)}
        </span>
      )}
    </>
  );

  return (
    <li>
      {hasChildren ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className={base}>{inner}</button>
      ) : (
        <Link href={item.href ?? "#"} onClick={onNavigate} className={base}>{inner}</Link>
      )}
      <AnimatePresence initial={false}>
        {hasChildren && open && !collapsed && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="ml-6.5 mt-1 space-y-0.5 overflow-hidden border-l border-slate-200 pl-3"
          >
            {item.children!.map((c, idx) => (
              <SubItem key={c.href ?? idx} item={c} onNavigate={onNavigate} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function Content({ collapsed, onNavigate, onToggle, onClose }: { collapsed: boolean; onNavigate: () => void; onToggle?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  const isBuyer = useMemo(() => {
    if (!user) return false;
    const email = String(user.email || "").toLowerCase();
    if (email === "owner@shareproject.com") return false;
    const role = String(user.role || "").toLowerCase();
    const uType = String(user.userType || user.user_type || "").toLowerCase();
    const profileRole = String(user.profile?.role || "").toLowerCase();
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
  }, [user]);

  const filteredGroups = useMemo(() => {
    let baseMenu = sidebarMenu;
    if (isBuyer) {
      baseMenu = baseMenu
        .map((g) => ({
          ...g,
          items: g.items.filter((item) => {
            if (item.href === "/dashboard/owner") return false;
            const enLower = (item.label.en || "").toLowerCase();
            const bnStr = item.label.bn || "";
            if (enLower.includes("seller") || enLower.includes("owner") || bnStr.includes("সেলার")) return false;
            return true;
          }),
        }))
        .filter((g) => g.items.length > 0);
    }

    if (!query.trim()) return baseMenu;
    const q = query.trim().toLowerCase();
    return baseMenu
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          const matchLabel =
            t(item.label).toLowerCase().includes(q) ||
            item.label.en.toLowerCase().includes(q) ||
            item.label.bn.includes(q);
          const matchChild = item.children?.some(
            (c) =>
              t(c.label).toLowerCase().includes(q) ||
              c.label.en.toLowerCase().includes(q) ||
              c.label.bn.includes(q)
          );
          return matchLabel || matchChild;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, t, isBuyer]);

  return (
    <div className="flex h-full flex-col">
      {/* Top Header: Search / Filter (functional tool, not a logo) */}
      <div className={`flex h-14 shrink-0 items-center border-b border-slate-200 ${collapsed ? "justify-center px-2" : "justify-between gap-2 px-3"}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title={t({ bn: "মেনু খুঁজুন", en: "Search menu" })}
          >
            <Search className="h-4 w-4" />
          </button>
        ) : (
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t({ bn: "মেনু খুঁজুন...", en: "Search menu..." })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-8.5 pr-7 text-xs text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-4 w-4 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="scroll-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((g, i) => (
            <div key={i}>
              {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t(g.title)}</p>}
              {collapsed && i > 0 && <div className="mx-3 mb-3 h-px bg-slate-200" />}
              <ul className="space-y-1">
                {g.items.map((it, j) => <Item key={j} item={it} collapsed={collapsed} onNavigate={onNavigate} />)}
              </ul>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {t({ bn: "কোনো মেনু পাওয়া যায়নি", en: "No matching menus" })}
          </div>
        )}
      </nav>

      {!collapsed && (
        <div className="m-3 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">{t({ bn: "সাহায্য দরকার?", en: "Need help?" })}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{t({ bn: "আমাদের সাপোর্ট টিম আপনার জন্য প্রস্তুত।", en: "Our support team is ready for you." })}</p>
          <Link href="/contact" className="mt-3 inline-block rounded-lg bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800">
            {t({ bn: "যোগাযোগ করুন", en: "Contact us" })}
          </Link>
        </div>
      )}

      {onToggle && (
        <button onClick={onToggle} className="hidden h-12 shrink-0 items-center justify-center gap-2 border-t border-slate-200 text-xs text-slate-500 transition hover:text-slate-900 lg:flex">
          <ChevronsLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && t({ bn: "ছোট করুন", en: "Collapse" })}
        </button>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
  return (
    <>
      {/* desktop */}
      <aside
        className={`sticky top-20 z-30 hidden h-[calc(100vh-5rem)] shrink-0 border-r lg:border-l border-slate-200 bg-white transition-[width] duration-300 lg:block ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <Content collapsed={collapsed} onNavigate={() => {}} onToggle={onToggle} />
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onMobileClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed bottom-0 left-0 top-20 z-50 w-72 border-r border-slate-200 bg-white shadow-2xl lg:hidden"
            >
              <Content collapsed={false} onNavigate={onMobileClose} onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
