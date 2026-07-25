import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../api/client";

interface ApiQueryOptions<TData> extends Omit<
  UseQueryOptions<TData, ApiError>,
  "queryFn"
> {
  queryFn: () => Promise<TData>;
}

export function useApiQuery<TData>(
  options: ApiQueryOptions<TData>,
): UseQueryResult<TData, ApiError> {
  const { toast } = useToast();

  return useQuery({
    ...options,
    queryFn: async () => {
      try {
        return await options.queryFn();
      } catch (error) {
        toast(error instanceof ApiError ? error.message : "request failed");
        throw error;
      }
    },
  });
}
