import { apiFetch } from "../../lib/api/client";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export function fetchMe(): Promise<User> {
  return apiFetch<User>("/me");
}

export function logout(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}
