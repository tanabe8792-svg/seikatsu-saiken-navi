/**
 * Procedure 依存関係 — KB requiredDocuments 由来のみ
 */

import { getSupportProgramById } from "@/lib/knowledge/support-programs";
import type { ExternalProcedure } from "./procedures";

export interface ProcedureDependency {
  prerequisiteProgramId: string;
  dependentProgramId: string;
  /** KB requiredDocuments / description 由来 */
  reason: string;
}

/** 罹災証明を前提とする制度（support-programs.requiredDocuments より） */
export const PROCEDURE_DEPENDENCIES: ProcedureDependency[] = [
  {
    prerequisiteProgramId: "SP-DISASTER-CERTIFICATE",
    dependentProgramId: "SP-LIFE-REBUILD",
    reason: "被災者生活再建支援制度の requiredDocuments に罹災証明",
  },
  {
    prerequisiteProgramId: "SP-DISASTER-CERTIFICATE",
    dependentProgramId: "SP-EMERGENCY-REPAIR",
    reason: "応急修理制度の requiredDocuments に罹災証明",
  },
  {
    prerequisiteProgramId: "SP-DISASTER-CERTIFICATE",
    dependentProgramId: "SP-DISASTER-LOAN-RELIEF",
    reason: "被災ローン減免制度の requiredDocuments に罹災証明",
  },
];

const DEPENDENCIES_BY_DEPENDENT = new Map(
  PROCEDURE_DEPENDENCIES.map((d) => [d.dependentProgramId, d])
);

export function getDependencyForProgram(
  dependentProgramId: string
): ProcedureDependency | undefined {
  return DEPENDENCIES_BY_DEPENDENT.get(dependentProgramId);
}

const SATISFIED_STATUSES = new Set<ExternalProcedure["status"]>([
  "preparing",
  "submitted",
  "waiting_response",
  "completed",
]);

/** 前提 Procedure が preparing 以上か */
export function isPrerequisiteSatisfied(
  procedures: ExternalProcedure[],
  prerequisiteProgramId: string
): boolean {
  const prereq = procedures.find(
    (p) => p.relatedProgramId === prerequisiteProgramId
  );
  if (!prereq) return false;
  return SATISFIED_STATUSES.has(prereq.status);
}

export function areProcedurePrerequisitesMet(
  procedures: ExternalProcedure[],
  dependentProgramId: string,
  explicitPrerequisites?: string[]
): { met: boolean; reason?: string } {
  const ids =
    explicitPrerequisites ??
    PROCEDURE_DEPENDENCIES.filter(
      (d) => d.dependentProgramId === dependentProgramId
    ).map((d) => d.prerequisiteProgramId);

  if (ids.length === 0) return { met: true };

  for (const prereqId of ids) {
    if (!isPrerequisiteSatisfied(procedures, prereqId)) {
      const dep = getDependencyForProgram(dependentProgramId);
      const program = getSupportProgramById(prereqId);
      return {
        met: false,
        reason:
          dep?.reason ??
          `${program?.name ?? prereqId}の手続きが先に必要です`,
      };
    }
  }
  return { met: true };
}
