import type { UserProfile } from "../api/types";

export function createMockUserProfile(
  overrides?: Partial<UserProfile>,
): UserProfile {
  return {
    id: "1",
    email: "sam@example.com",
    name: "Sam Rivera",
    avatarUrl: "https://example.com/avatar.png",
    ...overrides,
  };
}
