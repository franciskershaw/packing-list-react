import { useAuth } from "../../app/AuthContext";

// Deliberately minimal — PACKFE-011 replaces this with the real,
// designed Profile screen (avatar, email, styling).
export function ProfileScreen() {
  const { logout } = useAuth();

  return (
    <div>
      <button
        type="button"
        onClick={() => void logout()}
        className="rounded-full border border-border bg-bg-subtle px-5 py-2.5 font-body font-bold text-body hover:text-accent"
      >
        Sign out
      </button>
    </div>
  );
}
