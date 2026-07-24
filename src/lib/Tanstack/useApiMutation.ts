import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../api/client";

export function useApiMutation<TData, TVariables>(
  options: UseMutationOptions<TData, ApiError, TVariables>,
): UseMutationResult<TData, ApiError, TVariables> {
  const { toast } = useToast();

  return useMutation({
    ...options,
    onError: (error, variables, onMutateResult, context) => {
      toast(error instanceof ApiError ? error.message : "request failed");
      return options.onError?.(error, variables, onMutateResult, context);
    },
  });
}
