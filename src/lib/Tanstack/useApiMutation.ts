import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../api/client";

export function useApiMutation<TData, TVariables, TOnMutateResult = unknown>(
  options: UseMutationOptions<TData, ApiError, TVariables, TOnMutateResult>,
): UseMutationResult<TData, ApiError, TVariables, TOnMutateResult> {
  const { toast } = useToast();

  return useMutation({
    ...options,
    onError: (error, variables, onMutateResult, context) => {
      toast(error instanceof ApiError ? error.message : "request failed");
      return options.onError?.(error, variables, onMutateResult, context);
    },
  });
}
