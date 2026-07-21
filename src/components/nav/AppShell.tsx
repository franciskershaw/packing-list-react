import { Outlet } from "react-router-dom";

import DesktopSidebar from "./DesktopSidebar";
import MobileTabBar from "./MobileTabBar";

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-bg lg:flex-row">
      <div className="hidden lg:flex">
        <DesktopSidebar />
      </div>

      <main className="flex-1 overflow-y-auto pb-[calc(6rem_+_env(safe-area-inset-bottom))] lg:pb-0">
        <Outlet />
      </main>

      <div className="lg:hidden">
        <MobileTabBar />
      </div>
    </div>
  );
}
