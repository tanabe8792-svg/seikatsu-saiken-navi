/**
 * AI相談 — プロフィールの引き継ぎ・重複質問防止（表示・フォールバック専用）
 */

import type { ChatMessage, UserProfile } from "./types";
import { J00_DISASTER_TYPE } from "./j00-hearing";
import {
  MUNICIPALITIES,
  resolveMunicipalityName,
} from "./knowledge/municipalities";
import { parseProfileFromText } from "./procedures";

const INTAKE_LABELS: Record<string, string> = {
  municipality: "お住まいの市町村",
  housingDamage: "住宅の被害",
  currentShelter: "今いる場所",
  hasChildren: "お子さまの有無",
  hasElderly: "高齢者の有無",
  hasPowerOutage: "停電",
  hasWaterOutage: "断水",
  hasGasOutage: "ガス停止",
  housingTenure: "住居の形態",
};

function assistantAskedForMunicipality(content: string): boolean {
  return /市町村|お住まいの地域|どちら.*(?:住|お住)/.test(content);
}

function assistantAskedForHousingDamage(content: string): boolean {
  return /被害.*どのくらい|お住まい.*状態|全壊|半壊/.test(content);
}

function parseUserMessageInContext(
  content: string,
  previousAssistant?: string
): Partial<UserProfile> {
  const parsed = parseProfileFromText(content);

  if (!parsed.municipality && previousAssistant) {
    if (assistantAskedForMunicipality(previousAssistant)) {
      const resolved = resolveMunicipalityName(content);
      if (resolved) parsed.municipality = resolved;
    }
  }

  if (!parsed.housingDamage && previousAssistant) {
    if (assistantAskedForHousingDamage(previousAssistant)) {
      if (/全壊|倒壊/.test(content)) parsed.housingDamage = "全壊（住めない）";
      else if (/半壊/.test(content)) parsed.housingDamage = "半壊";
      else if (/一部/.test(content)) parsed.housingDamage = "一部損壊";
      else if (/わからない|不明/.test(content)) parsed.housingDamage = "わからない";
      else if (/なし|被害なし/.test(content)) parsed.housingDamage = "なし";
    }
  }

  return parsed;
}

/** 会話全体＋保存済みプロフィールをマージ */
export function mergeChatProfileFromMessages(
  base: UserProfile,
  messages: ChatMessage[]
): UserProfile {
  let merged: UserProfile = {
    ...base,
    disasterType: J00_DISASTER_TYPE,
  };

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message.role !== "user") continue;

    const previousAssistant =
      i > 0 && messages[i - 1].role === "assistant"
        ? messages[i - 1].content
        : undefined;

    merged = {
      ...merged,
      ...parseUserMessageInContext(message.content, previousAssistant),
      disasterType: J00_DISASTER_TYPE,
    };
  }

  return merged;
}

/** LLM・フォールバック向け — 把握済み項目の説明 */
export function formatKnownProfileForChat(profile: UserProfile): string {
  const lines: string[] = [];

  if (profile.j00Completed) {
    lines.push("- 初回の状況入力（はじめに）は完了済み");
  }
  if (profile.municipality) lines.push(`- 市町村: ${profile.municipality}（再質問禁止）`);
  if (profile.housingDamage) lines.push(`- 住宅の被害: ${profile.housingDamage}（再質問禁止）`);
  if (profile.currentShelter) lines.push(`- 今いる場所: ${profile.currentShelter}（再質問禁止）`);
  if (profile.hasChildren === true) lines.push("- お子さま: いる");
  if (profile.hasChildren === false) lines.push("- お子さま: いない");
  if (profile.hasElderly === true) lines.push("- 高齢者: いる");
  if (profile.hasElderly === false) lines.push("- 高齢者: いない");
  if (profile.hasPet === true) lines.push("- ペット: いる");
  if (profile.hasPet === false) lines.push("- ペット: いない");
  if (profile.hasPowerOutage === true) lines.push("- 停電: あり");
  if (profile.hasPowerOutage === false) lines.push("- 停電: なし");
  if (profile.hasWaterOutage === true) lines.push("- 断水: あり");
  if (profile.hasWaterOutage === false) lines.push("- 断水: なし");
  if (profile.hasGasOutage === true) lines.push("- ガス停止: あり");
  if (profile.hasGasOutage === false) lines.push("- ガス停止: なし");
  if (profile.housingTenure) lines.push(`- 住居: ${profile.housingTenure}`);

  if (lines.length === 0) {
    return "（まだ把握している項目はありません）";
  }

  return lines.join("\n");
}

/** 初回ヒアリング完了、またはチャットだけで必要項目が揃った */
export function isChatIntakeComplete(profile: UserProfile): boolean {
  if (profile.j00Completed) return true;

  if (!profile.municipality && !profile.address) return false;
  if (!profile.housingDamage) return false;
  if (!profile.currentShelter) return false;
  if (profile.hasChildren === undefined && profile.hasElderly === undefined) {
    return false;
  }

  return true;
}

type IntakeField =
  | "municipality"
  | "housingDamage"
  | "currentShelter"
  | "family";

function getNextIntakeField(profile: UserProfile): IntakeField | null {
  if (profile.j00Completed || isChatIntakeComplete(profile)) return null;
  if (!profile.municipality && !profile.address) return "municipality";
  if (!profile.housingDamage) return "housingDamage";
  if (!profile.currentShelter) return "currentShelter";
  if (profile.hasChildren === undefined && profile.hasElderly === undefined) {
    return "family";
  }
  return null;
}

/** 把握済み項目の再質問を除去 */
export function sanitizeChatReplyAgainstDuplicateQuestions(
  message: string,
  profile: UserProfile
): string {
  const blockedPatterns: RegExp[] = [];

  if (profile.municipality || profile.address) {
    blockedPatterns.push(/市町村/u);
    blockedPatterns.push(/お住まいの地域/u);
    blockedPatterns.push(/どちら.*(?:住|お住)/u);
    blockedPatterns.push(/例：.*熊本/u);
  }
  if (profile.housingDamage) {
    blockedPatterns.push(/被害.*どのくらい/u);
    blockedPatterns.push(/お住まい.*(?:状態|被害)/u);
  }
  if (profile.currentShelter) {
    blockedPatterns.push(/どこにいらっしゃ/u);
    blockedPatterns.push(/今はどこ/u);
  }
  if (profile.hasChildren !== undefined || profile.hasElderly !== undefined) {
    blockedPatterns.push(/お子さま.*高齢者/u);
    blockedPatterns.push(/ご家族について/u);
  }
  if (profile.disasterType || profile.j00Completed) {
    blockedPatterns.push(/どんな災害/u);
    blockedPatterns.push(/地震.*水害/u);
  }

  if (blockedPatterns.length === 0) return message;

  const paragraphs = message.split(/\n\n+/);
  const filtered = paragraphs.filter(
    (p) => !blockedPatterns.some((re) => re.test(p))
  );

  if (filtered.length === 0) {
    return buildJ00ContinuedReply(profile);
  }

  return filtered.join("\n\n").trim();
}

/** はじめに済み・把握済みのときの返答 */
export function buildJ00ContinuedReply(profile: UserProfile): string {
  const parts: string[] = [];

  if (profile.municipality && profile.housingDamage) {
    parts.push(
      `${profile.municipality}・${profile.housingDamage}の状況、把握しています。`
    );
  } else if (profile.municipality) {
    parts.push(`${profile.municipality}のこと、把握しています。`);
  } else if (profile.j00Completed) {
    parts.push("いただいた状況、引き継いでいます。");
  }

  parts.push("いま一番困っていることや、確認したいことを教えてください。");
  return parts.join("");
}

export function buildIntakeQuestion(
  field: IntakeField,
  profile: UserProfile,
  municipalityHint: string
): string {
  switch (field) {
    case "municipality":
      return `お住まいの市町村を教えてください。案内を地域に合わせます。\n\n例：${municipalityHint} など`;
    case "housingDamage":
      return "お住まいの被害は、どのくらいですか？\n\n・全壊（住めない）\n・半壊\n・一部損壊\n・わからない";
    case "currentShelter":
      return "今はどこにいらっしゃいますか？\n\n・自宅\n・避難所\n・親戚・知人の家\n・その他";
    case "family":
      return "ご家族について教えてください。お子さまや高齢者の方は一緒に避難されていますか？（はい / いいえ で大丈夫です）";
    default:
      return buildJ00ContinuedReply(profile);
  }
}

export function getIntakeFieldLabel(field: IntakeField): string {
  return INTAKE_LABELS[field] ?? field;
}

export { getNextIntakeField };
