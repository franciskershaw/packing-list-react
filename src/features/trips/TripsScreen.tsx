import { Button } from "../../components/ui/Button";
import { useLogout } from "../auth/useLogout";

export function TripsScreen() {
  const { mutate: logout, isPending } = useLogout();

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-bg text-body">
      <p>Trips — coming soon</p>
      {/* Temporary — remove once PACKFE-007 adds the real profile/sign-out screen */}
      <Button onClick={() => logout()} disabled={isPending}>
        {isPending ? "Signing out…" : "Sign out (temporary)"}
      </Button>
    </div>
  );
}
