import type { UserSession } from "@/lib/types";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Supabase に無い端末内フィールドを local 側から保持 */
function preserveLocalOnlyFields(
  base: UserSession,
  local: UserSession
): UserSession {
  return {
    ...base,
    profile: { ...base.profile, ...local.profile },
    caseFile: base.caseFile ?? local.caseFile,
    caseWorkerSummary: base.caseWorkerSummary ?? local.caseWorkerSummary,
    j00Step: base.j00Step ?? local.j00Step,
    showPostJ00Welcome: base.showPostJ00Welcome ?? local.showPostJ00Welcome,
    onboardingTimingHint:
      base.onboardingTimingHint ?? local.onboardingTimingHint,
    continuitySnapshot: base.continuitySnapshot ?? local.continuitySnapshot,
  };
}

export function mergeSessions(
  local: UserSession | null,
  remote: UserSession | null
): UserSession | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;

  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (remoteTime > localTime) return preserveLocalOnlyFields(remote, local);
  if (localTime > remoteTime) return preserveLocalOnlyFields(local, remote);

  return {
    profile: { ...remote.profile, ...local.profile },
    actions:
      local.actions.length >= remote.actions.length
        ? local.actions
        : remote.actions,
    chatHistory:
      local.chatHistory.length >= remote.chatHistory.length
        ? local.chatHistory
        : remote.chatHistory,
    caseFile: local.caseFile ?? remote.caseFile,
    caseWorkerSummary: local.caseWorkerSummary ?? remote.caseWorkerSummary,
    j00Step: local.j00Step ?? remote.j00Step,
    showPostJ00Welcome: local.showPostJ00Welcome ?? remote.showPostJ00Welcome,
    onboardingTimingHint:
      local.onboardingTimingHint ?? remote.onboardingTimingHint,
    continuitySnapshot: local.continuitySnapshot ?? remote.continuitySnapshot,
    updatedAt: local.updatedAt,
  };
}
