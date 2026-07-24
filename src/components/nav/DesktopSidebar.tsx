import { useNavigate } from "react-router-dom";

import { useAuth } from "../../features/auth/AuthContext";
import { Avatar } from "../ui/Avatar";
import { NAV_ITEMS } from "./navItems";
import { useActiveNavKey } from "./useActiveNavKey";

const DesktopSidebar = () => {
  const activeKey = useActiveNavKey();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tabs = NAV_ITEMS.filter((item) => item.showAs === "tab");
  const accountItem = NAV_ITEMS.find((item) => item.showAs === "accountRow");

  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-border bg-bg-subtle p-4">
      <span className="px-2 py-4 font-heading text-2xl font-bold text-heading">
        Pack-It
      </span>

      <div className="mt-4 flex flex-col gap-1">
        {tabs.map(({ key, label, path, icon: Icon }) => (
          <button
            key={key}
            onClick={() => navigate(path)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${
              activeKey === key ? "bg-accent-subtle text-accent" : "text-body"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      {accountItem && user && (
        <button
          onClick={() => navigate(accountItem.path)}
          className={`mt-auto flex cursor-pointer items-center gap-3 rounded-xl p-3 text-left ${
            activeKey === accountItem.key ? "bg-accent-subtle" : ""
          }`}
        >
          <Avatar user={user} className="h-9 w-9 shrink-0 text-sm" />
          <div className="min-w-0">
            <p
              className={`truncate text-sm font-bold ${
                activeKey === accountItem.key ? "text-accent" : "text-heading"
              }`}
            >
              {user.name}
            </p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </button>
      )}
    </nav>
  );
};

export default DesktopSidebar;
