import { useNavigate } from "react-router-dom";

import { NAV_ITEMS } from "./navItems";
import { useActiveNavKey } from "./useActiveNavKey";

const MobileTabBar = () => {
  const activeKey = useActiveNavKey();
  const navigate = useNavigate();
  return (
    <nav
      className="fixed inset-x-3.5 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] flex h-15.5
     items-stretch rounded-3xl border border-border
     bg-bg/95 shadow-lg backdrop-blur-md"
    >
      {NAV_ITEMS.map(({ key, label, path, icon: Icon }) => (
        <button
          key={key}
          onClick={() => navigate(path)}
          className={`flex flex-1 cursor-pointer flex-col items-center
        justify-center gap-1 ${activeKey === key ? "text-accent" : "text-muted"}`}
        >
          <Icon className="h-5.5 w-5.5" />
          <span className="text-[11px] font-bold tracking-wide">{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileTabBar;
