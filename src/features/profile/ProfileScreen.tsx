import { useAuth } from "../../app/AuthContext";
import { Button } from "../../components/ui/Button";

// Deliberately minimal — PACKFE-011 replaces this with the real,
// designed Profile screen (avatar, email, styling).
export function ProfileScreen() {
  const { logout } = useAuth();

  return (
    <div>
      <Button variant="secondary" onClick={() => void logout()}>
        Sign out
      </Button>
    </div>
  );
}
