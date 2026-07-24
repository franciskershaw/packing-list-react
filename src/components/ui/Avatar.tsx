import { useState } from "react";

import type { User } from "../../features/auth/api";

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (words.length === 1 ? first : first + last).toUpperCase();
}

interface AvatarProps {
  user: Pick<User, "name" | "avatarUrl">;
  className?: string;
}

export function Avatar({ user, className = "" }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (user.avatarUrl && !imageFailed) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        onError={() => setImageFailed(true)}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-accent-secondary font-heading font-bold text-on-accent ${className}`}
    >
      {getInitials(user.name)}
    </div>
  );
}
