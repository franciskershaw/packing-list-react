import { useLocation } from "react-router-dom";

import { NAV_ITEMS, type NavKey } from "./navItems";

export function getActiveNavKey(pathname: string): NavKey | null {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
  return match?.key ?? null;
}

export function useActiveNavKey(): NavKey | null {
  return getActiveNavKey(useLocation().pathname);
}
