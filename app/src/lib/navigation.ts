import type { ActionItem } from "./types";

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
  return `/actions/${action.procedureId ?? action.id}`;
}

/** CaseFile の Action 詳細（J-00 完了後） */
export function getCaseActionDetailPath(actionId: string): string {
  return `/actions/case/${actionId}`;
}
