import { BaggageClaim, BookOpen, LayoutTemplate, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavKey = "trips" | "templates" | "library" | "profile";

export interface NavItem {
  key: NavKey;
  label: string;
  path: string;
  icon: LucideIcon;
  /**
   * How this item renders in the desktop sidebar: a regular nav button, or
   * the pinned-to-bottom account row. MobileTabBar ignores this and renders
   * every item as a uniform tab.
   */
  showAs: "tab" | "accountRow";
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "trips",
    label: "Trips",
    path: "/trips",
    icon: BaggageClaim,
    showAs: "tab",
  },
  {
    key: "templates",
    label: "Templates",
    path: "/templates",
    icon: LayoutTemplate,
    showAs: "tab",
  },
  {
    key: "library",
    label: "Library",
    path: "/library",
    icon: BookOpen,
    showAs: "tab",
  },
  {
    key: "profile",
    label: "Profile",
    path: "/profile",
    icon: User,
    showAs: "accountRow",
  },
];
