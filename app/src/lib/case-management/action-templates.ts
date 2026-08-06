/**
 * RW Action テンプレート — KB トリガーから CaseAction を生成
 * 制度詳細は KB 参照。ここでは行動タイトルのみ。
 */

import type { CaseProfile } from "@/lib/knowledge/types";
import { MUNICIPALITY_CODES } from "@/lib/knowledge/municipalities";
import type { CaseAction, CaseActionPriority } from "./types";
import type { CompletionRule } from "./evidence";
import type { RecoveryPhaseMode } from "./types";

export type ActionPhaseScope = "acute" | "recovery" | "both";

export interface ActionTemplate {
  id: string;
  rwActionId: string;
  journeyId: CaseAction["journeyId"];
  title: string;
  description: string;
  reason: string;
  priority: CaseActionPriority;
  required: boolean;
  evidenceRequired: boolean;
  completionRule: CompletionRule;
  sourceTriggerIds: string[];
  relatedProgramIds?: string[];
  sortOrder: number;
  /** Acute / Recovery フェーズでの Action 包含 */
  phaseScope: ActionPhaseScope;
  when?: (profile: CaseProfile, matchedTriggerIds: Set<string>) => boolean;
}

const HOUSE_DAMAGE = new Set(["全壊", "半壊", "一部損壊", "浸水"]);

function hasHouseDamage(profile: CaseProfile): boolean {
  return !!profile.damageLevel && HOUSE_DAMAGE.has(profile.damageLevel);
}

function templateCertMatch(ids: Set<string>): boolean {
  return [
    "TRIGGER-ALERT-ALERT-UKI-CERT-CROWD",
    "TRIGGER-ALERT-ALERT-KUMAMOTO-ONLINE-CERT",
    "TRIGGER-ALERT-ALERT-YATSUSHIRO-ONLINE",
  ].some((id) => ids.has(id));
}

export const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "rw-j01-welfare-shelter",
    rwActionId: "RW-J01-03",
    journeyId: "J-01",
    title: "福祉避難所を検討",
    description:
      "高齢者がいる場合、福祉避難所の利用を検討してください。服薬・介護の確認も行いましょう。",
    reason: "高齢者が避難生活にある場合、安全確保が最優先です。",
    priority: "critical",
    required: true,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: ["TRIGGER-WELFARE-SHELTER"],
    sortOrder: 10,
    phaseScope: "acute",
  },
  {
    id: "rw-j01-family-safety",
    rwActionId: "RW-J01-01",
    journeyId: "J-01",
    title: "家族の安全を確認",
    description: "家族全員の安否と所在を確認してください。",
    reason: "被災直後は家族の安全確認が優先です。",
    priority: "critical",
    required: true,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: [],
    sortOrder: 60,
    when: (p) => p.hasChildren === true,
    phaseScope: "acute",
  },
  {
    id: "rw-j02-water-station",
    rwActionId: "RW-J02-01",
    journeyId: "J-02",
    title: "給水場所を確認",
    description: "最寄りの給水所・給水車の場所と時間を確認してください。",
    reason: "断水地域では水確保が命に関わる最優先事項です。",
    priority: "critical",
    required: true,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: [
      "TRIGGER-WATER-PRIORITY",
      "TRIGGER-ALERT-ALERT-WATER-PRIORITY",
    ],
    sortOrder: 20,
    phaseScope: "acute",
  },
  {
    id: "rw-j02-water-children",
    rwActionId: "RW-J02-02",
    journeyId: "J-02",
    title: "子ども世帯の水を確保",
    description:
      "飲料水・ミルク・おむつなど、子どもに必要な物資を優先して確保してください。",
    reason: "お子さまがいる世帯は水と衛生用品の確保が特に重要です。",
    priority: "critical",
    required: true,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: ["TRIGGER-ALERT-ALERT-WATER-CHILDREN"],
    sortOrder: 55,
    phaseScope: "acute",
  },
  {
    id: "rw-j05-temp-housing",
    rwActionId: "RW-J05-01",
    journeyId: "J-05",
    title: "仮設・転居を検討",
    description:
      "応急仮設住宅・みなし仮設の検討、大家・管理会社への連絡を行ってください。",
    reason: "賃貸で全壊の場合、再建より安全な住居確保が優先です。",
    priority: "critical",
    required: true,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: ["TRIGGER-TEMP-HOUSING-PRIORITY"],
    relatedProgramIds: ["SP-TEMP-HOUSING"],
    sortOrder: 30,
    phaseScope: "recovery",
  },
  {
    id: "rw-j04-business-recovery",
    rwActionId: "RW-J04-08",
    journeyId: "J-04",
    title: "事業復旧を確認",
    description:
      "営業継続可否、店舗・事業所の被害状況、事業者向け支援制度を確認してください。",
    reason: "自営業の場合、生活再建と並行して事業復旧の判断が必要です。",
    priority: "high",
    required: true,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: ["TRIGGER-BUSINESS-RECOVERY"],
    relatedProgramIds: [
      "SP-BUSINESS-SME-RECOVERY",
      "SP-BUSINESS-JFC-LOAN",
      "SP-BUSINESS-CHAMBER",
    ],
    sortOrder: 35,
    phaseScope: "recovery",
  },
  {
    id: "rw-j03-photo",
    rwActionId: "RW-J03-02",
    journeyId: "J-03",
    title: "被害写真を撮影する",
    description:
      "片付け・修理の前に、外観全体と損傷部分の写真を複数枚撮影してください。",
    reason: "罹災証明・保険請求のために、修理前の記録が必要です。",
    priority: "high",
    required: true,
    evidenceRequired: true,
    completionRule: "EVIDENCE_REQUIRED",
    sourceTriggerIds: ["TRIGGER-PHOTO-RECORD"],
    sortOrder: 110,
    phaseScope: "recovery",
  },
  {
    id: "rw-j03-cert-prep",
    rwActionId: "RW-J03-04",
    journeyId: "J-03",
    title: "必要書類を確認する",
    description:
      "罹災証明書の申請に必要な身分証・写真を準備し、窓口またはオンライン申請を確認してください。",
    reason: "支援制度・保険請求の入口となる重要書類です。",
    priority: "high",
    required: true,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: [
      "TRIGGER-ALERT-ALERT-UKI-CERT-CROWD",
      "TRIGGER-ALERT-ALERT-KUMAMOTO-ONLINE-CERT",
      "TRIGGER-ALERT-ALERT-YATSUSHIRO-ONLINE",
    ],
    relatedProgramIds: ["SP-DISASTER-CERTIFICATE"],
    sortOrder: 120,
    when: (p, ids) =>
      hasHouseDamage(p) &&
      (templateCertMatch(ids) || ids.has("TRIGGER-PHOTO-RECORD")),
    phaseScope: "recovery",
  },
  {
    id: "rw-j04-insurance-report",
    rwActionId: "RW-J04-02",
    journeyId: "J-04",
    title: "保険会社へ被害連絡する",
    description:
      "火災保険・地震保険等に加入している場合、加入保険会社へ被害報告を行ってください。",
    reason: "保険請求の入口となる重要な連絡です。契約内容・報告期限は保険会社案内を確認してください。",
    priority: "high",
    required: false,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: ["TRIGGER-INSURANCE-REPORT"],
    relatedProgramIds: ["SP-INSURANCE-CLAIM"],
    sortOrder: 125,
    phaseScope: "recovery",
  },
  {
    id: "rw-j04-loan-relief",
    rwActionId: "RW-J04-05",
    journeyId: "J-04",
    title: "ローン減免制度を確認",
    description: "住宅ローンの返済猶予・減免制度の対象可否を確認してください。",
    reason: "2016年被災経験とローンがある場合、専用制度の対象になる可能性があります。",
    priority: "high",
    required: false,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: ["TRIGGER-2016-LOAN-RELIEF"],
    relatedProgramIds: ["SP-DISASTER-LOAN-RELIEF"],
    sortOrder: 130,
    phaseScope: "recovery",
  },
  {
    id: "rw-j04-life-rebuild",
    rwActionId: "RW-J04-03",
    journeyId: "J-04",
    title: "生活再建支援制度を確認する",
    description:
      "被災者生活再建支援制度の対象可否・申請方法を確認してください。罹災証明取得後に申請します。",
    reason: "半壊・全壊住宅の再建費用の一部を支援する国の制度です。",
    priority: "high",
    required: false,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: [],
    relatedProgramIds: ["SP-LIFE-REBUILD"],
    sortOrder: 135,
    when: (p) =>
      !!p.damageLevel && ["全壊", "半壊"].includes(p.damageLevel),
    phaseScope: "recovery",
  },
  {
    id: "rw-j04-tax-social",
    rwActionId: "RW-J04-06",
    journeyId: "J-04",
    title: "税・社会保険の手続を確認する",
    description:
      "所得税・住民税の期限延長、社会保険料の免除・猶予等の制度を所管機関の公式案内で確認してください。",
    reason: "被災後の税・社会保険手続は所管機関の告示に従います。",
    priority: "medium",
    required: false,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: ["TRIGGER-TAX-SOCIAL-SUPPORT"],
    relatedProgramIds: ["SP-TAX-SOCIAL-INSURANCE"],
    sortOrder: 145,
    phaseScope: "recovery",
  },
  {
    id: "rw-j05-emergency-repair",
    rwActionId: "RW-J05-02",
    journeyId: "J-05",
    title: "応急修理制度を確認する",
    description:
      "被災住宅の応急修理制度（自治体）の対象可否・申請方法を確認してください。",
    reason: "罹災証明取得後、自治体の応急修理制度を利用できる場合があります。",
    priority: "medium",
    required: false,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: [],
    relatedProgramIds: ["SP-EMERGENCY-REPAIR"],
    sortOrder: 150,
    when: (p) =>
      p.municipalityCode === MUNICIPALITY_CODES.KUMAMOTO_CITY &&
      !!p.damageLevel &&
      ["半壊", "一部損壊", "浸水"].includes(p.damageLevel),
    phaseScope: "recovery",
  },
  {
    id: "rw-j04-programs",
    rwActionId: "RW-J04-01",
    journeyId: "J-04",
    title: "支援制度を確認",
    description: "お住まいの地域で利用できる支援制度を確認してください。",
    reason: "被災状況に応じた支援制度が見つかっています。",
    priority: "medium",
    required: false,
    evidenceRequired: false,
    completionRule: "SELF_CONFIRM",
    sourceTriggerIds: ["TRIGGER-REGIONAL-PROGRAMS"],
    sortOrder: 140,
    phaseScope: "recovery",
  },
];

export function isTemplateIncludedInPhase(
  template: ActionTemplate,
  phaseMode: RecoveryPhaseMode
): boolean {
  if (template.phaseScope === "both") return true;
  if (phaseMode === "recovery") return template.phaseScope === "recovery";
  return template.phaseScope === "acute";
}

export function getActionTemplate(actionId: string): ActionTemplate | undefined {
  return ACTION_TEMPLATES.find((t) => t.id === actionId);
}

export function templateToCaseAction(
  template: ActionTemplate,
  matchedTriggerIds: string[]
): CaseAction {
  const matched = template.sourceTriggerIds.filter((id) =>
    matchedTriggerIds.includes(id)
  );
  return {
    id: template.id,
    rwActionId: template.rwActionId,
    journeyId: template.journeyId,
    title: template.title,
    description: template.description,
    reason: template.reason,
    priority: template.priority,
    required: template.required,
    status: "todo",
    evidenceRequired: template.evidenceRequired,
    completionRule: template.completionRule,
    sourceTriggerIds:
      matched.length > 0 ? matched : template.sourceTriggerIds,
    relatedProgramIds: template.relatedProgramIds,
  };
}
