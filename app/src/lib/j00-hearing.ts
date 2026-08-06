/**
 * J-00 被災認知フロー — 定数・CaseProfile 変換・KB 評価
 * Knowledge Base 本体は変更せず、既存 API を利用する。
 */

import type { CaseProfile, CaseTrigger } from "@/lib/knowledge/types";
import {
  buildCaseWorkerKnowledgeContext,
  caseProfileFromUserProfile,
} from "@/lib/knowledge";
import {
  derivePriorityJourney,
  shouldPrioritizeSafetyJourney,
} from "@/lib/knowledge/priority-journey";
import { DISASTER_EVENT_R8_KUMAMOTO, MUNICIPALITIES } from "@/lib/knowledge/municipalities";
import type { CaseWorkerSummary, UserProfile } from "./types";

export const J00_TOTAL_STEPS = 5;

/** 熊本地震専用 — J-00 では常に固定 */
export const J00_DISASTER_TYPE = "地震" as const;

export const J00_DISASTER_EVENT_LABEL = DISASTER_EVENT_R8_KUMAMOTO.name;

/** J-00 ステップ1 — 熊本地震専用の案内（表示専用） */
export const J00_STEP1_COPY = {
  lead:
    "このあと、お住まいの地域や被害の状況などを、いくつかお聞きします。",
  helpLead: "お聞きした内容をもとに、次のことをお手伝いします。",
  helpItems: [
    "今のあなたに必要な確認や手続きを、順番に案内します",
    "支援制度など、公式の情報源へつなぎます",
    "推測ではなく、確認できる情報を軸に進めます",
  ],
} as const;

export const DISASTER_TYPE_OPTIONS = [J00_DISASTER_TYPE] as const;

export const HOUSING_DAMAGE_OPTIONS = [
  "なし",
  "一部損壊",
  "半壊",
  "全壊",
  "わからない",
] as const;

export const LIFELINE_OPTIONS = [
  { key: "hasPowerOutage" as const, label: "停電（いま）" },
  { key: "hasWaterOutage" as const, label: "断水（いま）" },
  { key: "hasGasOutage" as const, label: "ガス停止（いま）" },
  { key: "none" as const, label: "今は使える" },
] as const;

/** J-00 ステップ3 — ライフライン質問（表示専用） */
export const J00_LIFELINE_STEP_COPY = {
  title: "いまのライフライン（複数選べます）",
  subtitle:
    "今も使えないものを選んでください。一時的に止まっていたが、もう復旧している場合は「今は使える」を選んでください。",
  hint: "当てはまるものを1つ選んでください。「今は使える」も選べます",
} as const;

export const MUNICIPALITY_OPTIONS = [
  ...MUNICIPALITIES.map((m) => m.name),
  "その他",
];

export const HOUSING_TENURE_OPTIONS = ["持ち家", "賃貸", "その他"] as const;

const SIGNIFICANT_DAMAGE = new Set(["一部損壊", "半壊", "全壊", "全壊（住めない）"]);

function hasSignificantDamage(housingDamage?: string): boolean {
  if (!housingDamage || housingDamage === "なし" || housingDamage === "わからない") {
    return false;
  }
  return SIGNIFICANT_DAMAGE.has(housingDamage) || housingDamage.includes("全壊");
}

/** UserProfile → CaseProfile 拡張フィールド */
export function profileToCaseProfileExtras(
  profile: UserProfile
): Partial<CaseProfile> {
  const extras: Partial<CaseProfile> = {
    housingTenure: profile.housingTenure,
    hasMortgage: profile.hasMortgage,
    prior2016Disaster: profile.prior2016Disaster,
    hasPet: profile.hasPet,
  };

  if (profile.isSelfEmployed) {
    extras.employmentType = "自営業";
    if (profile.hasBusinessDamage === true) {
      extras.hasBusinessDamage = true;
    } else if (profile.hasBusinessDamage === false) {
      extras.hasBusinessDamage = false;
    } else if (hasSignificantDamage(profile.housingDamage)) {
      // 旧データ互換: 未回答なら住家被害がある場合のみ事業被害ありとみなす
      extras.hasBusinessDamage = true;
    }
  }

  if (profile.currentShelter) {
    extras.shelterStatus = profile.currentShelter;
  } else if (
    profile.housingDamage === "全壊" ||
    profile.housingDamage?.includes("全壊")
  ) {
    extras.shelterStatus = "避難所";
  }

  if (profile.housingDamage === "なし") {
    extras.damageLevel = undefined;
  }

  return extras;
}

const PRIMARY_TRIGGER_ORDER = [
  "TRIGGER-WATER-PRIORITY",
  "TRIGGER-TEMP-HOUSING-PRIORITY",
  "TRIGGER-WELFARE-SHELTER",
  "TRIGGER-BUSINESS-RECOVERY",
  "TRIGGER-2016-LOAN-RELIEF",
  "TRIGGER-PHOTO-RECORD",
];

/** ホーム表示用に最優先トリガーを選ぶ（KB 本体は変更しない） */
function pickPrimaryTrigger(
  triggers: CaseTrigger[],
  profile: CaseProfile
): CaseTrigger | undefined {
  if (triggers.length === 0) return undefined;

  if (shouldPrioritizeSafetyJourney(profile)) {
    const welfare = triggers.find((t) => t.id === "TRIGGER-WELFARE-SHELTER");
    if (welfare) return welfare;
  }

  for (const id of PRIMARY_TRIGGER_ORDER) {
    const found = triggers.find((t) => t.id === id);
    if (found) return found;
  }

  return triggers[0];
}

function pickNextTrigger(
  triggers: CaseTrigger[],
  primary: CaseTrigger | undefined
): CaseTrigger | undefined {
  if (!primary) return triggers[1];
  return triggers.find((t) => t.id !== primary.id);
}

export function buildCaseProfileFromUserProfile(
  profile: UserProfile
): CaseProfile {
  const housingDamage =
    profile.housingDamage === "なし" ? undefined : profile.housingDamage;

  return caseProfileFromUserProfile(
    { ...profile, housingDamage },
    profileToCaseProfileExtras(profile)
  );
}

/** KB 評価 → ホーム表示用サマリー */
export function buildCaseWorkerSummary(
  profile: UserProfile
): CaseWorkerSummary {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const { triggerEvaluation } = buildCaseWorkerKnowledgeContext(caseProfile);
  const triggers = triggerEvaluation.triggers;
  const priorityJourney = derivePriorityJourney(triggers, caseProfile);

  const primary = pickPrimaryTrigger(triggers, caseProfile);
  const next = pickNextTrigger(triggers, primary);

  if (!primary) {
    return {
      priorityJourney,
      primaryAction: {
        title: "状況を確認しましょう",
        message: "ケースワーカーに相談して、次の一歩を決めましょう。",
        triggerId: "none",
      },
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    priorityJourney,
    primaryAction: {
      title: primary.title,
      message: primary.message,
      triggerId: primary.id,
    },
    nextAction: next
      ? {
          title: next.title,
          message: next.message,
          triggerId: next.id,
        }
      : undefined,
    generatedAt: new Date().toISOString(),
  };
}

/** 各ステップの入力が揃っているか */
export function isJ00StepComplete(
  step: number,
  profile: UserProfile
): boolean {
  switch (step) {
    case 1:
      return !!profile.disasterType;
    case 2:
      return !!profile.municipality;
    case 3:
      return (
        !!profile.housingDamage &&
        profile.hasPowerOutage !== undefined &&
        profile.hasWaterOutage !== undefined &&
        profile.hasGasOutage !== undefined
      );
    case 4:
      return (
        profile.hasChildren !== undefined &&
        profile.hasElderly !== undefined &&
        profile.hasPet !== undefined &&
        profile.isSelfEmployed !== undefined &&
        (profile.isSelfEmployed !== true ||
          (profile.hasBusinessDamage !== undefined &&
            (profile.hasBusinessDamage !== true ||
              !!profile.businessMunicipality)))
      );
    case 5:
      return (
        !!profile.housingTenure &&
        profile.hasMortgage !== undefined &&
        profile.prior2016Disaster !== undefined
      );
    default:
      return false;
  }
}

/** 6検証ケース相当の入力例（開発・報告用） */
export const J00_VALIDATION_EXAMPLES: Array<{
  name: string;
  profile: UserProfile;
}> = [
  {
    name: "Case1: 宇城市・半壊・断水・子ども・持ち家",
    profile: {
      disasterType: "地震",
      municipality: "宇城市",
      housingDamage: "半壊",
      hasWaterOutage: true,
      hasPowerOutage: false,
      hasGasOutage: false,
      hasChildren: true,
      hasElderly: false,
      hasPet: false,
      isSelfEmployed: false,
      housingTenure: "持ち家",
      hasMortgage: false,
      prior2016Disaster: false,
    },
  },
  {
    name: "Case2: 氷川町・全壊・高齢者・賃貸",
    profile: {
      disasterType: "地震",
      municipality: "氷川町",
      housingDamage: "全壊",
      hasWaterOutage: true,
      hasPowerOutage: false,
      hasGasOutage: false,
      hasChildren: false,
      hasElderly: true,
      hasPet: false,
      isSelfEmployed: false,
      housingTenure: "賃貸",
      hasMortgage: false,
      prior2016Disaster: false,
    },
  },
  {
    name: "Case3: 八代市・被害なし・断水のみ",
    profile: {
      disasterType: "地震",
      municipality: "八代市",
      housingDamage: "なし",
      hasWaterOutage: true,
      hasPowerOutage: false,
      hasGasOutage: false,
      hasChildren: false,
      hasElderly: false,
      hasPet: false,
      isSelfEmployed: false,
      housingTenure: "持ち家",
      hasMortgage: false,
      prior2016Disaster: false,
    },
  },
  {
    name: "Case4: 熊本市・半壊・ローン・2016年経験",
    profile: {
      disasterType: "地震",
      municipality: "熊本市",
      housingDamage: "半壊",
      hasPowerOutage: false,
      hasWaterOutage: false,
      hasGasOutage: false,
      hasChildren: false,
      hasElderly: false,
      hasPet: false,
      isSelfEmployed: false,
      housingTenure: "持ち家",
      hasMortgage: true,
      prior2016Disaster: true,
    },
  },
  {
    name: "Case5: 宇土市・一部損壊・単身",
    profile: {
      disasterType: "地震",
      municipality: "宇土市",
      housingDamage: "一部損壊",
      hasPowerOutage: false,
      hasWaterOutage: false,
      hasGasOutage: false,
      hasChildren: false,
      hasElderly: false,
      hasPet: false,
      isSelfEmployed: false,
      housingTenure: "持ち家",
      hasMortgage: false,
      prior2016Disaster: false,
    },
  },
  {
    name: "Case6: 自営業・半壊・店舗被害",
    profile: {
      disasterType: "地震",
      municipality: "熊本市",
      housingDamage: "半壊",
      hasPowerOutage: false,
      hasWaterOutage: false,
      hasGasOutage: false,
      hasChildren: false,
      hasElderly: false,
      hasPet: false,
      isSelfEmployed: true,
      housingTenure: "持ち家",
      hasMortgage: false,
      prior2016Disaster: false,
    },
  },
];
