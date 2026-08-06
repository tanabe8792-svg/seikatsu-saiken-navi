/**
 * 伴走ガイド × DocumentRecord の準備物チェック連携（表示専用）
 */

import type { ActionWalkthrough, WalkthroughPrepItem } from "./action-walkthrough";
import { getLocalPrepDoneKeys } from "./action-walkthrough";
import {
  getDocumentRecordsForProgram,
  isDocumentPrepDone,
  type DocumentRecord,
} from "./document-records";
import { getRequirementsForProgram } from "./document-requirements";
import type { CaseFile } from "./types";

export interface ResolvedPrepItem {
  key: string;
  label: string;
  howTo: string;
  requirementId?: string;
  optional?: boolean;
  done: boolean;
  record?: DocumentRecord;
}

function matchRequirementId(
  item: WalkthroughPrepItem,
  programId: string
): string | undefined {
  if (item.requirementId) return item.requirementId;
  const reqs = getRequirementsForProgram(programId);
  const hit = reqs.find(
    (r) =>
      r.name === item.label ||
      item.label.includes(r.name) ||
      r.name.includes(item.label.replace(/（.*）$/, ""))
  );
  return hit?.id;
}

/** 現在の Action に対する準備物チェックリスト */
export function resolvePrepChecklist(
  caseFile: CaseFile,
  guide: ActionWalkthrough,
  programIds: string[]
): ResolvedPrepItem[] {
  const records = programIds.flatMap((id) =>
    getDocumentRecordsForProgram(caseFile, id)
  );
  const byReq = new Map(records.map((r) => [r.requirementId, r]));
  const localDone = new Set(
    getLocalPrepDoneKeys(caseFile.caseId, guide.actionId)
  );

  if (guide.prepItems.length > 0) {
    return guide.prepItems.map((item, index) => {
      const requirementId =
        item.requirementId ??
        programIds.map((pid) => matchRequirementId(item, pid)).find(Boolean);
      const record = requirementId ? byReq.get(requirementId) : undefined;
      const localKey = `prep:${index}`;
      const done = record
        ? isDocumentPrepDone(record)
        : localDone.has(localKey);
      return {
        key: requirementId ?? localKey,
        label: item.label,
        howTo: item.howTo,
        requirementId,
        optional: item.optional,
        done,
        record,
      };
    });
  }

  return records
    .filter((r) => !r.name.includes("確認不可"))
    .map((r) => ({
      key: r.requirementId,
      label: r.name,
      howTo:
        "用意できたらチェックしてください。分からないものは公式案内で確認します。",
      requirementId: r.requirementId,
      optional: r.status === "unknown",
      done: isDocumentPrepDone(r),
      record: r,
    }));
}

export function areResolvedPrepItemsDone(items: ResolvedPrepItem[]): boolean {
  const required = items.filter((i) => !i.optional);
  if (required.length === 0) return true;
  return required.every((i) => i.done);
}
