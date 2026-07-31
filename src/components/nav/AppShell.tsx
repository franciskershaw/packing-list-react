import { Outlet } from "react-router-dom";

import DesktopSidebar from "./DesktopSidebar";
import MobileTabBar from "./MobileTabBar";

/** Vertical space the fixed mobile tab bar needs reserved beneath scrolling
 *  content. Used as `<main>`'s own bottom padding by default; screens with a
 *  `position: sticky` descendant (e.g. a sticky detail header) must use
 *  `MOBILE_NAV_CLEARANCE_SPACER_CLASS` instead — sticky content inside a
 *  scroll container can cause that container's own padding-bottom to be
 *  excluded from the scrollable area (most visible on iOS Safari), so an
 *  explicit spacer element is needed there rather than ancestor padding. */
export const MOBILE_NAV_CLEARANCE_PB_CLASS =
  "pb-[calc(6rem_+_env(safe-area-inset-bottom))]";
export const MOBILE_NAV_CLEARANCE_SPACER_CLASS =
  "h-[calc(6rem_+_env(safe-area-inset-bottom))]";

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-bg lg:flex-row">
      <div className="hidden lg:flex">
        <DesktopSidebar />
      </div>

      <main
        className={`flex-1 overflow-y-auto ${MOBILE_NAV_CLEARANCE_PB_CLASS} lg:pb-0`}
      >
        <div className="mx-auto h-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>

      <div className="lg:hidden">
        <MobileTabBar />
      </div>
    </div>
  );
}
