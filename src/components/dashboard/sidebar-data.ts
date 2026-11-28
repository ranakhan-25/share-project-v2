import {
  Building2,
  FolderKanban,
  LayoutDashboard,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Bi } from "@/lib/i18n";

export type SubMenuItem = {
  label: Bi;
  href?: string;
  badge?: string;
  children?: { label: Bi; href: string }[];
};

export type MenuItem = {
  label: Bi;
  href?: string;
  icon: LucideIcon;
  badge?: string;
  children?: SubMenuItem[];
};

export type MenuGroup = { title: Bi; items: MenuItem[] };

export const sidebarMenu: MenuGroup[] = [
  /* ----------------------------------------------------
   * 1. OVERVIEW
   * ---------------------------------------------------- */
  {
    title: { bn: "ওভারভিউ", en: "Overview" },
    items: [
      { label: { bn: "ড্যাশবোর্ড", en: "Dashboard" }, href: "/dashboard", icon: LayoutDashboard },
      { label: { bn: "সব প্রজেক্ট", en: "All Projects" }, href: "/dashboard/projects", icon: Building2 },
      { label: { bn: "প্ল্যাটফর্ম সেটিংস", en: "Platform Settings" }, href: "/dashboard/settings", icon: Settings },
    ],
  },

  /* ----------------------------------------------------
   * 2. PORTALS: SELLER & BUYER
   * ---------------------------------------------------- */
  {
    title: { bn: "পোর্টাল", en: "Portals" },
    items: [
      {
        label: { bn: "সেলার পোর্টাল", en: "Seller Portal" },
        icon: FolderKanban,
        children: [
          { label: { bn: "সেলার ওভারভিউ", en: "Seller Overview" }, href: "/dashboard/owner" },
          { label: { bn: "ইন্টারেস্টেড লিডস", en: "Interested Leads" }, href: "/dashboard/owner/leads" },
        ],
      },
      {
        label: { bn: "বায়ার পোর্টাল", en: "Buyer Portal" },
        icon: UserRound,
        children: [
          { label: { bn: "প্রোফাইল", en: "Profile" }, href: "/dashboard/profile" },
          { label: { bn: "KYC যাচাই", en: "KYC Verification" }, href: "/dashboard/kyc" },
          { label: { bn: "আমার বিনিয়োগ", en: "My Investments" }, href: "/dashboard/investments" },
          { label: { bn: "শেয়ারসমূহ", en: "My Shares" }, href: "/dashboard/shares" },
          { label: { bn: "নোটিফিকেশন", en: "Notifications" }, href: "/dashboard/notifications" },
        ],
      },
    ],
  },
];

/** Recursively searches the navigation tree for the current page label. */
function searchTitle(items: MenuItem[] | SubMenuItem[] | { label: Bi; href: string }[], path: string): Bi | null {
  for (const it of items) {
    if ("href" in it && it.href === path) return it.label;
    if ("children" in it && it.children) {
      const found = searchTitle(it.children, path);
      if (found) return found;
    }
  }
  return null;
}

export function findTitle(pathname: string): Bi | null {
  for (const g of sidebarMenu) {
    const found = searchTitle(g.items, pathname);
    if (found) return found;
  }
  return null;
}
