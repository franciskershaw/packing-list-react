import { queryClient } from "../lib/queryClient";

const TOKEN_KEY = ["authToken"];

export function getAccessToken(): string | null {
  return queryClient.getQueryData<string | null>(TOKEN_KEY) ?? null;
}

export function setAccessToken(token: string | null) {
  queryClient.setQueryData(TOKEN_KEY, token);
}
