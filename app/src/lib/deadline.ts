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
  "お疲れさまでした。一歩前進です。",
  "よくできました。次の一歩も一緒に進みましょう。",
  "完了です。着実に生活再建が進んでいます。",
  "素晴らしいです。残りの項目も無理なく進めてください。",
];

export function getRandomCompletionMessage(): string {
  const index = Math.floor(Math.random() * COMPLETION_MESSAGES.length);
  return COMPLETION_MESSAGES[index];
}
