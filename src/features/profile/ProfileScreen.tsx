import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { GoogleIcon } from "../../components/ui/GoogleIcon";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { useAuth } from "../auth/AuthContext";
import { useLogout } from "../auth/useLogout";

export function ProfileScreen() {
  useDocumentTitle("Profile");

  const { user } = useAuth();
  const { mutate: logout, isPending } = useLogout();

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 lg:p-12">
      <h1 className="font-heading text-3xl font-bold text-heading">Profile</h1>

      <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-bg p-8 text-center">
        <Avatar user={user} className="h-20 w-20 text-2xl" />
        <div>
          <p className="font-heading text-xl font-bold text-heading">
            {user.name}
          </p>
          <p className="text-body">{user.email}</p>
        </div>
        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-bg-subtle px-4 py-2 text-sm font-semibold text-secondary">
          <GoogleIcon />
          Signed in with Google
        </span>
      </div>

      <Button
        variant="danger"
        onClick={() => logout()}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
