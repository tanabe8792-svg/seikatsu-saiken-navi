import type { UserProfile } from "../types";
import type {
  CaseProfile,
  CaseTrigger,
  DisasterOverlay,
  MunicipalityContext,
  RegionalAlert,
  SourcedValue,
  SupportProgram,
  TriggerEvaluationResult,
} from "./types";
import {
  buildCaseWorkerKnowledgeContext,
  caseProfileFromUserProfile,
} from "./index";
import { formatKnownProfileForChat } from "../chat-profile";

/** ケースワーカー人格（固定・最小） */
export const CASE_WORKER_BASE_PROMPT = `あなたは日本の災害被災者向けWebアプリ「生活再建ナビ」の生活再建サポーター（ケースワーカー）です。
令和8年（2026年）7月28日 熊本地震の被災者向けです。生活再建（被害記録・支援制度・手続き）の案内を、やさしい日本語で短く答えてください。

## 対象
- 熊本地震専用。災害の種類（水害・火災など）は聞かない
- profile.disasterType は常に「地震」

## 役割
1. 被災状況を少しずつ質問して把握する（1〜2項目ずつ）
2. 付属の「現在の案件コンテキスト」を必ず参照する
3. 常に「次の1アクション」だけを提案する
4. 専門用語は避け、必要ならかっこ書きで説明する

## 会話
- 1つの返答は1つの流れで書く（無関係な話題を続けない）
- triggers の案内は、いま聞いていること・次の一歩と自然につなげる
- すでに把握している項目は絶対に聞き直さない（下記「把握済みの状況」を参照）
- j00Completed が true の場合、初回ヒアリング済み。市町村・被害・家族・ライフラインは聞かない

## 禁止
- コンテキストにない窓口URL・制度名・期限・金額を創作しない
- value が「確認不可」の項目を推測で補わない
- 確信が持てない内容は「分かりません」「公式の案内でご確認ください」と明言する
- 憶測・一般論だけで具体的手続きを断定しない
- 支援の受給を保証する表現
- 一度に3件以上の提案

## 出力形式
通常の返答の末尾に、状況が十分なときのみ以下のJSONブロックを1つ付けてください:

\`\`\`json
{
  "profile": {
    "municipality": "",
    "disasterType": "",
    "housingDamage": "",
    "currentShelter": "",
    "hasElderly": false,
    "hasChildren": false,
    "hasPowerOutage": false,
    "hasWaterOutage": false
  },
  "actions": [
    {
      "id": "disaster-certificate",
      "title": "罹災証明書の申請",
      "description": "市役所で被災を証明する書類をもらいます",
      "priority": "week",
      "procedureId": "disaster-certificate"
    }
  ],
  "isComplete": true
}
\`\`\`

priority は immediate / week / month / later のいずれか。
triggers で critical があれば、その内容を最優先で案内してください。`;

function serializeSourced<T>(field: SourcedValue<T>): {
  value: T | "確認不可";
  sourceUrl: string | null;
  updatedAt: string;
} {
  return {
    value: field.value,
    sourceUrl: field.sourceUrl,
    updatedAt: field.updatedAt,
  };
}

function serializeOverlay(overlay: DisasterOverlay | null) {
  if (!overlay) return null;

  return {
    disasterName: overlay.disasterName,
    municipalityCode: overlay.municipalityCode,
    intensity: serializeSourced(overlay.intensity),
    damageSummary: serializeSourced(overlay.damageSummary),
    lifelineIssues: {
      waterOutage: serializeSourced(overlay.lifelineIssues.waterOutage),
      powerOutage: serializeSourced(overlay.lifelineIssues.powerOutage),
      waterStationCount: serializeSourced(
        overlay.lifelineIssues.waterStationCount
      ),
      waterStationInfoUrl: serializeSourced(
        overlay.lifelineIssues.waterStationInfoUrl
      ),
    },
    certificateInfo: {
      summary: serializeSourced(overlay.certificateInfo.summary),
      onlineAvailable: serializeSourced(
        overlay.certificateInfo.onlineAvailable
      ),
      onlineUrl: serializeSourced(overlay.certificateInfo.onlineUrl),
      dailyLimit: serializeSourced(overlay.certificateInfo.dailyLimit),
      ticketSystem: serializeSourced(overlay.certificateInfo.ticketSystem),
      notes: serializeSourced(overlay.certificateInfo.notes),
    },
    sourceUrl: overlay.sourceUrl,
    updatedAt: overlay.updatedAt,
  };
}

function serializeProgram(program: SupportProgram) {
  return {
    id: program.id,
    name: program.name,
    journeyId: program.journeyId,
    requiredDocuments: program.requiredDocuments,
    sourceUrl: program.sourceUrl,
    updatedAt: program.updatedAt,
    description: program.description,
  };
}

function serializeAlert(alert: RegionalAlert) {
  return {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    priority: alert.priority,
    journeyIds: alert.journeyIds,
    sourceUrl: alert.sourceUrl,
    updatedAt: alert.updatedAt,
  };
}

function serializeTrigger(trigger: CaseTrigger) {
  return {
    id: trigger.id,
    priority: trigger.priority,
    title: trigger.title,
    message: trigger.message,
    actionType: trigger.actionType,
    journeyId: trigger.journeyId,
    relatedProgramIds: trigger.relatedProgramIds,
  };
}

export interface CaseWorkerRuntimeContext {
  caseProfile: CaseProfile;
  municipality: MunicipalityContext["municipality"];
  disasterOverlay: ReturnType<typeof serializeOverlay>;
  alerts: ReturnType<typeof serializeAlert>[];
  programs: ReturnType<typeof serializeProgram>[];
  triggers: ReturnType<typeof serializeTrigger>[];
  matchedProgramIds: string[];
  matchedAlertIds: string[];
  generatedAt: string;
}

/** Knowledge Base から LLM 向け Runtime Context オブジェクトを生成 */
export function buildRuntimeContextPayload(
  userProfile: UserProfile,
  extras?: Partial<CaseProfile>
): CaseWorkerRuntimeContext {
  const caseProfile = caseProfileFromUserProfile(userProfile, extras);
  const { municipalityContext, triggerEvaluation, generatedAt } =
    buildCaseWorkerKnowledgeContext(caseProfile);

  return {
    caseProfile,
    municipality: municipalityContext.municipality,
    disasterOverlay: serializeOverlay(municipalityContext.overlay),
    alerts: municipalityContext.alerts.map(serializeAlert),
    programs: municipalityContext.programs.map(serializeProgram),
    triggers: triggerEvaluation.triggers.map(serializeTrigger),
    matchedProgramIds: triggerEvaluation.matchedProgramIds,
    matchedAlertIds: triggerEvaluation.matchedAlertIds,
    generatedAt,
  };
}

/** LLM system メッセージ全文（人格 + Runtime Context） */
export function buildCaseWorkerSystemMessage(
  userProfile: UserProfile,
  extras?: Partial<CaseProfile>
): string {
  const runtimeContext = buildRuntimeContextPayload(userProfile, extras);
  const knownProfile = formatKnownProfileForChat(userProfile);

  return `${CASE_WORKER_BASE_PROMPT}

## 把握済みの状況（再質問禁止）
${knownProfile}

## 現在の案件コンテキスト（Knowledge Base から動的生成）
以下の JSON を参照して回答してください。ここにない情報は推測しないでください。

\`\`\`json
${JSON.stringify(runtimeContext, null, 2)}
\`\`\``;
}

/** フォールバック応答用 — 後方互換のため残す（prepend は使わない） */
export function applyKnowledgeToFallbackMessage(
  message: string,
  _userProfile: UserProfile,
  _extras?: Partial<CaseProfile>
): string {
  return message;
}
