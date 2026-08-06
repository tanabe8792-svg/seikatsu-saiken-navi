"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ActionItem,
  CaseWorkerSummary,
  ChatMessage,
  OnboardingTimingHint,
  UserProfile,
  UserSession,
} from "@/lib/types";
import type { CaseFile } from "@/lib/case-management/types";
import type { EvidenceInput } from "@/lib/case-management/evidence";
import {
  addEvidenceToCaseFile,
  completeCaseAction as completeCaseActionLogic,
  getTriggerIdsFromCaseFile,
  refreshActionQueueForPhase,
} from "@/lib/case-management/action-queue";
import {
  markDocumentPrepared as markDocumentPreparedLogic,
  syncDocumentRecords,
} from "@/lib/case-management/document-records";
import {
  caseFileToLegacySummary,
  createDefaultPhotoEvidence,
  initializeCaseFromProfile,
} from "@/lib/case-management";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  applyUserRecoveryPhaseTransition,
  canUserStartRecoveryPhase,
} from "@/lib/case-management/recovery-phase";
import { buildContinuitySnapshot } from "@/lib/case-management/continuity-dashboard";
import { getCurrentAction } from "@/lib/case-management/action-queue";
import { clearWalkthroughProgress } from "@/lib/case-management/action-walkthrough";
import {
  createEmptySession,
  loadSessionFromStorage,
  normalizeSession,
  saveSessionToStorage,
} from "@/lib/session-storage";
import {
  getCurrentUserId,
  isSupabaseConfigured,
  loadSessionFromSupabase,
  saveSessionToSupabase,
  signInAnonymously,
} from "@/lib/supabase/browser";
import { getAuthUser } from "@/lib/supabase/auth";
import {
  clearLocalCaseShare,
  loadLocalCaseShare,
} from "@/lib/case-management/case-share-storage";
import {
  publishOwnedCase,
  updateSharedCaseFile,
} from "@/lib/supabase/cases";
import {
  identityFromSupabaseUser,
  isAnonymousSupabaseUser,
} from "@/lib/auth/identity";
import { subscribeToAuthChanges } from "@/lib/supabase/auth";
import { mergeSessions } from "@/lib/supabase/config";

type SessionAction = { type: "SET"; session: UserSession };

function sessionReducer(state: UserSession, action: SessionAction): UserSession {
  return normalizeSession(action.session);
}

interface SessionContextValue {
  session: UserSession;
  loading: boolean;
  userId: string | null;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setActions: (actions: ActionItem[]) => void;
  setCaseWorkerSummary: (summary: CaseWorkerSummary | undefined) => void;
  setCaseFile: (caseFile: CaseFile | undefined) => void;
  initializeCase: (profile: UserProfile) => Promise<void>;
  completeCaseAction: (actionId: string, evidence?: EvidenceInput) => void;
  submitActionEvidence: (
    actionId: string,
    evidence?: EvidenceInput
  ) => void;
  markDocumentPrepared: (requirementId: string, prepared: boolean) => void;
  startRecoveryPhase: () => void;
  setJ00Step: (step: number | undefined) => void;
  setOnboardingTimingHint: (hint: OnboardingTimingHint | undefined) => void;
  dismissPostJ00Welcome: () => void;
  toggleAction: (actionId: string, completed: boolean) => void;
  applyChatResult: (result: {
    profile?: UserProfile;
    actions?: ActionItem[];
    messages: ChatMessage[];
  }) => void;
  resetSession: () => void;
}

function sessionWithContinuitySnapshot(current: UserSession): UserSession {
  if (!current.caseFile) return current;
  const action = getCurrentAction(current.caseFile);
  if (!action) return current;
  return {
    ...current,
    continuitySnapshot: buildContinuitySnapshot(current.caseFile, action),
  };
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, createEmptySession);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const sessionRef = useRef(session);
  const userIdRef = useRef<string | null>(null);

  sessionRef.current = session;

  const persist = useCallback(async (updater: (current: UserSession) => UserSession) => {
    const updated = normalizeSession({
      ...updater(sessionRef.current),
      updatedAt: new Date().toISOString(),
    });
    dispatch({ type: "SET", session: updated });
    saveSessionToStorage(updated);

    const id = userIdRef.current;
    if (id && isSupabaseConfigured()) {
      try {
        await saveSessionToSupabase(id, updated);
      } catch (error) {
        console.error("Failed to sync session:", error);
      }
    }

    // 共有ケースへ（所有者または編集可メンバー）— 失敗してもローカル保存は維持
    const share = loadLocalCaseShare();
    if (
      share &&
      updated.caseFile &&
      (share.isOwner || share.accessLevel === "edit") &&
      isSupabaseConfigured()
    ) {
      try {
        if (share.isOwner && updated.caseFile.publicCaseId) {
          await publishOwnedCase({
            publicCaseId: updated.caseFile.publicCaseId,
            internalCaseId: updated.caseFile.caseId,
            caseFile: updated.caseFile,
            municipalityCode: updated.caseFile.municipalityCode,
          });
        } else if (!share.isOwner) {
          await updateSharedCaseFile(share.remoteCaseId, updated.caseFile);
        }
      } catch (error) {
        console.error("Failed to sync shared case:", error);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // 何があっても読み込み中で画面を止めない
    const loadingGuard = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 800);

    async function syncFromSupabase(local: UserSession | null) {
      if (!isSupabaseConfigured()) return local;

      try {
        const timeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
          Promise.race([
            promise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
          ]);

        const authUser = await timeout(getAuthUser(), 2500);
        let id: string | null = null;

        if (authUser && !isAnonymousSupabaseUser(authUser)) {
          id = authUser.id;
        } else {
          id = await timeout(getCurrentUserId(), 2500);
          if (!id) id = await timeout(signInAnonymously(), 2500);
        }

        if (!id || cancelled) return local;

        setUserId(id);
        userIdRef.current = id;

        const remote = await timeout(loadSessionFromSupabase(id), 2500);
        if (!remote || cancelled) return local;

        return mergeSessions(local, remote);
      } catch (error) {
        console.error("Supabase session sync failed:", error);
        return local;
      }
    }

    async function resyncAfterAuth() {
      if (cancelled) return;
      const local = loadSessionFromStorage();
      const merged = await syncFromSupabase(local);
      if (merged && !cancelled) {
        dispatch({ type: "SET", session: merged });
        saveSessionToStorage(merged);
      }
    }

    async function init() {
      try {
        const local = loadSessionFromStorage();
        if (local) {
          dispatch({ type: "SET", session: local });
        }
      } catch (error) {
        console.error("Local session load failed:", error);
      } finally {
        // Strict Mode の二重実行でも、画面を「読み込み中」で止めない
        setLoading(false);
      }

      try {
        const local = loadSessionFromStorage();
        const merged = await syncFromSupabase(local);
        if (merged && !cancelled) {
          dispatch({ type: "SET", session: merged });
          saveSessionToStorage(merged);
        }
      } catch (error) {
        console.error("Session init failed:", error);
      }
    }

    void init();

    const unsubscribeAuth = isSupabaseConfigured()
      ? subscribeToAuthChanges((user) => {
          if (user && identityFromSupabaseUser(user)) {
            void resyncAfterAuth();
          }
        })
      : () => undefined;

    return () => {
      cancelled = true;
      window.clearTimeout(loadingGuard);
      unsubscribeAuth();
    };
  }, []);

  const updateProfile = useCallback(
    (profile: Partial<UserProfile>) => {
      void persist((current) => ({
        ...current,
        profile: { ...current.profile, ...profile },
      }));
    },
    [persist]
  );

  const setActions = useCallback(
    (actions: ActionItem[]) => {
      void persist((current) => ({ ...current, actions }));
    },
    [persist]
  );

  const setCaseWorkerSummary = useCallback(
    (summary: CaseWorkerSummary | undefined) => {
      void persist((current) => ({ ...current, caseWorkerSummary: summary }));
    },
    [persist]
  );

  const setCaseFile = useCallback(
    (caseFile: CaseFile | undefined) => {
      void persist((current) => ({ ...current, caseFile }));
    },
    [persist]
  );

  const initializeCase = useCallback(
    (profile: UserProfile) => {
      return persist((current) => {
        const caseFile = initializeCaseFromProfile(profile, current.caseFile, {
          resetProgress: true,
        });
        return {
          ...current,
          profile: { ...current.profile, ...profile },
          caseFile,
          caseWorkerSummary: caseFileToLegacySummary(caseFile),
          showPostJ00Welcome: true,
          continuitySnapshot: undefined,
        };
      });
    },
    [persist]
  );

  const completeCaseAction = useCallback(
    (actionId: string, evidence?: EvidenceInput) => {
      void persist((current) => {
        if (!current.caseFile) return current;
        const triggerIds = getTriggerIdsFromCaseFile(current.caseFile);
        const result = completeCaseActionLogic(
          current.caseFile,
          actionId,
          triggerIds,
          evidence
        );
        return sessionWithContinuitySnapshot({
          ...current,
          caseFile: result.caseFile,
          caseWorkerSummary: caseFileToLegacySummary(result.caseFile),
        });
      });
    },
    [persist]
  );

  const submitActionEvidence = useCallback(
    (actionId: string, evidence?: EvidenceInput) => {
      void persist((current) => {
        if (!current.caseFile) return current;
        const action =
          current.caseFile.pendingActions.find((a) => a.id === actionId) ??
          current.caseFile.completedActions.find((a) => a.id === actionId);
        if (!action) return current;

        const input: EvidenceInput =
          evidence ??
          (action.id === "rw-j03-photo"
            ? {
                type: createDefaultPhotoEvidence(actionId).type,
                metadata: createDefaultPhotoEvidence(actionId).metadata,
              }
            : { type: "text", metadata: { note: "自己申告記録" } });

        const caseFile = addEvidenceToCaseFile(
          current.caseFile,
          actionId,
          input
        );
        return sessionWithContinuitySnapshot({
          ...current,
          caseFile,
          caseWorkerSummary: caseFileToLegacySummary(caseFile),
        });
      });
    },
    [persist]
  );

  const markDocumentPrepared = useCallback(
    (requirementId: string, prepared: boolean) => {
      void persist((current) => {
        if (!current.caseFile) return current;
        const withSync = syncDocumentRecords(current.caseFile);
        const caseFile = markDocumentPreparedLogic(
          withSync,
          requirementId,
          prepared
        );
        return sessionWithContinuitySnapshot({
          ...current,
          caseFile,
          caseWorkerSummary: caseFileToLegacySummary(caseFile),
        });
      });
    },
    [persist]
  );

  const startRecoveryPhase = useCallback(() => {
    void persist((current) => {
      if (!current.caseFile || !canUserStartRecoveryPhase(current.caseFile)) {
        return current;
      }

      const caseProfile = buildCaseProfileFromUserProfile(current.profile);
      let caseFile = applyUserRecoveryPhaseTransition(current.caseFile);
      caseFile = refreshActionQueueForPhase(caseFile, caseProfile, "recovery");

      return {
        ...current,
        profile: { ...current.profile, startRecoveryPhase: true },
        caseFile,
        caseWorkerSummary: caseFileToLegacySummary(caseFile),
      };
    });
  }, [persist]);

  const setJ00Step = useCallback(
    (step: number | undefined) => {
      void persist((current) => ({ ...current, j00Step: step }));
    },
    [persist]
  );

  const setOnboardingTimingHint = useCallback(
    (hint: OnboardingTimingHint | undefined) => {
      void persist((current) => ({ ...current, onboardingTimingHint: hint }));
    },
    [persist]
  );

  const dismissPostJ00Welcome = useCallback(() => {
    void persist((current) => ({ ...current, showPostJ00Welcome: undefined }));
  }, [persist]);

  const toggleAction = useCallback(
    (actionId: string, completed: boolean) => {
      void persist((current) => ({
        ...current,
        actions: current.actions.map((action) =>
          action.id === actionId ? { ...action, completed } : action
        ),
      }));
    },
    [persist]
  );

  const applyChatResult = useCallback(
    (result: {
      profile?: UserProfile;
      actions?: ActionItem[];
      messages: ChatMessage[];
    }) => {
      void persist((current) => ({
        ...current,
        profile: result.profile
          ? { ...current.profile, ...result.profile }
          : current.profile,
        actions: result.actions ?? current.actions,
        chatHistory: [...current.chatHistory, ...result.messages],
      }));
    },
    [persist]
  );

  const resetSession = useCallback(() => {
    clearWalkthroughProgress();
    clearLocalCaseShare();
    void import("@/lib/case-management/photo-store").then(({ clearAllPhotos }) =>
      clearAllPhotos().catch(() => undefined)
    );
    void persist(() => createEmptySession());
  }, [persist]);

  const value = useMemo(
    () => ({
      session,
      loading,
      userId,
      updateProfile,
      setActions,
      setCaseWorkerSummary,
      setCaseFile,
      initializeCase,
      completeCaseAction,
      submitActionEvidence,
      markDocumentPrepared,
      startRecoveryPhase,
      setJ00Step,
      setOnboardingTimingHint,
      dismissPostJ00Welcome,
      toggleAction,
      applyChatResult,
      resetSession,
    }),
    [
      session,
      loading,
      userId,
      updateProfile,
      setActions,
      setCaseWorkerSummary,
      setCaseFile,
      initializeCase,
      completeCaseAction,
      submitActionEvidence,
      markDocumentPrepared,
      startRecoveryPhase,
      setJ00Step,
      setOnboardingTimingHint,
      dismissPostJ00Welcome,
      toggleAction,
      applyChatResult,
      resetSession,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useUserSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useUserSession must be used within SessionProvider");
  }
  return context;
}
