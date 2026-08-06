import { getProcedureById } from "./procedures";
import type { ActionItem } from "./types";

export function getDeadlineLabel(action: ActionItem): string | null {
  const procedureId = action.procedureId ?? action.id;
  const procedure = getProcedureById(procedureId);
  return procedure?.deadline ?? null;
}

export function getDeadlineBadgeVariant(
  priority: ActionItem["priority"]
): "destructive" | "secondary" | "outline" {
  if (priority === "immediate") return "destructive";
  if (priority === "week") return "secondary";
  return "outline";
}

export const COMPLETION_MESSAGES = [
  "この確認は完了です。ひと息ついて大丈夫です。",
  "ここまでの確認を記録しました。",
  "このステップは完了です。続きはいつでも一覧から。",
  "確認を残せました。無理せず進めましょう。",
];

export function getRandomCompletionMessage(): string {
  const index = Math.floor(Math.random() * COMPLETION_MESSAGES.length);
  return COMPLETION_MESSAGES[index];
}
