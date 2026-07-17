import { Link, Outlet } from "react-router-dom";

const navLinks = [
  { to: "/trips", label: "Trips" },
  { to: "/templates", label: "Templates" },
  { to: "/library", label: "Library" },
];

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6 md:py-4">
        <nav className="flex gap-4 font-body font-bold text-body md:gap-6">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/profile"
          className="rounded-full border border-border bg-bg-subtle px-3 py-1.5 font-body text-sm font-bold text-body hover:text-accent"
        >
          Profile
        </Link>
      </header>
      <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
