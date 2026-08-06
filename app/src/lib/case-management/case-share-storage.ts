import type { CaseAccessLevel } from "@/lib/case-management/case-sharing";

const SHARE_KEY = "seikatsu-saiken-navi-case-share";

export interface LocalCaseShareState {
  remoteCaseId: string;
  publicCaseId: string;
  accessLevel: CaseAccessLevel;
  role: string;
  isOwner: boolean;
}

export function loadLocalCaseShare(): LocalCaseShareState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalCaseShareState;
    if (!parsed.remoteCaseId || !parsed.publicCaseId) return null;
    return {
      ...parsed,
      accessLevel: parsed.accessLevel === "edit" ? "edit" : "view",
    };
  } catch {
    return null;
  }
}

export function saveLocalCaseShare(state: LocalCaseShareState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHARE_KEY, JSON.stringify(state));
}

export function clearLocalCaseShare(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SHARE_KEY);
}
