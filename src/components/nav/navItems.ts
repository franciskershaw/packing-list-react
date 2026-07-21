export type NavKey = "trips" | "templates" | "library" | "profile";

export interface NavItem {
  key: NavKey;
  label: string;
  path: string;
  /**
   * How this item renders in the desktop sidebar: a regular nav button, or
   * the pinned-to-bottom account row. MobileTabBar ignores this and renders
   * every item as a uniform tab.
   */
  showAs: "tab" | "accountRow";
}

export const NAV_ITEMS: NavItem[] = [
  { key: "trips", label: "Trips", path: "/trips", showAs: "tab" },
  { key: "templates", label: "Templates", path: "/templates", showAs: "tab" },
  { key: "library", label: "Library", path: "/library", showAs: "tab" },
  { key: "profile", label: "Profile", path: "/profile", showAs: "accountRow" },
];
