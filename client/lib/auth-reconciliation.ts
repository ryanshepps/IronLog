import { isAuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";

export function shouldClearCachedUserAfterAuthFailure(error: unknown) {
  return isAuthError(error) && !isAuthRetryableFetchError(error);
}
