import type { ActionItem } from "./types";
import { getActionTemplate } from "@/lib/case-management/action-templates";

/** 旧手続きページID → Case Action ID（深いリンクの救済） */
const LEGACY_PROCEDURE_TO_CASE_ACTION: Record<string, string> = {
  "disaster-certificate": "rw-j03-cert-prep",
  "insurance-contact": "rw-j04-insurance-report",
  "support-application": "rw-j04-life-rebuild",
  "temporary-housing": "rw-j05-temp-housing",
  "lifeline-check": "rw-j02-water-station",
  "safety-contact": "rw-j01-family-safety",
  "evacuation-check": "rw-j01-welfare-shelter",
};

export function getFirstIncompleteAction(
  actions: ActionItem[]
): ActionItem | undefined {
  const priorityOrder = ["immediate", "week", "month", "later"] as const;
  for (const priority of priorityOrder) {
    const found = actions.find((a) => !a.completed && a.priority === priority);
    if (found) return found;
  }
  return actions.find((a) => !a.completed);
}

export function getNextIncompleteAction(
  actions: ActionItem[],
  currentId: string
): ActionItem | undefined {
  const incomplete = actions.filter((a) => !a.completed);
  const currentIndex = incomplete.findIndex(
    (a) => a.id === currentId || a.procedureId === currentId
  );
  if (currentIndex >= 0 && currentIndex < incomplete.length - 1) {
    return incomplete[currentIndex + 1];
  }
  return incomplete.find(
    (a) => a.id !== currentId && a.procedureId !== currentId
  );
}

export function getActionDetailPath(action: ActionItem): string {
  const raw = action.procedureId ?? action.id;
  return resolveActionDetailPath(raw);
}

/** CaseFile の Action 詳細（J-00 完了後） */
export function getCaseActionDetailPath(actionId: string): string {
  return `/actions/case/${actionId}`;
}

/**
 * URL・ID から開くべき詳細パスを決める。
 * 新しい手続きIDや旧手続きIDは `/actions/case/...` へ寄せ、404を避ける。
 */
export function resolveActionDetailPath(id: string): string {
  if (getActionTemplate(id)) {
    return getCaseActionDetailPath(id);
  }
  const mapped = LEGACY_PROCEDURE_TO_CASE_ACTION[id];
  if (mapped) {
    return getCaseActionDetailPath(mapped);
  }
  return `/actions/${id}`;
}

/** 旧 `/actions/[id]` から Case 詳細へ移すべき ID か */
export function shouldRedirectToCaseAction(id: string): string | null {
  if (getActionTemplate(id)) return id;
  return LEGACY_PROCEDURE_TO_CASE_ACTION[id] ?? null;
}
