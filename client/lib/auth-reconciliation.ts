import { isAuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";

export function shouldClearCachedUserAfterAuthFailure(error: unknown) {
  return isAuthError(error) && !isAuthRetryableFetchError(error);
}

export function createStartupAuthReconciler(
  reconcile: (hasSession: boolean) => void,
) {
  let hydrated = false;
  let initialSession: boolean | undefined;
  let reconciled = false;

  function reconcileWhenReady() {
    if (!hydrated || initialSession === undefined || reconciled) return;
    reconciled = true;
    reconcile(initialSession);
  }

  return {
    markHydrated() {
      hydrated = true;
      reconcileWhenReady();
    },
    recordInitialSession(hasSession: boolean) {
      initialSession = hasSession;
      reconcileWhenReady();
    },
  };
}
