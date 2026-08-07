import type { ChatMessage, UserProfile, ActionItem } from "./types";
import { MUNICIPALITIES } from "./knowledge/municipalities";
import {
  buildIntakeQuestion,
  buildJ00ContinuedReply,
  getNextIntakeField,
  isChatIntakeComplete,
  mergeChatProfileFromMessages,
} from "./chat-profile";
import {
  generateDefaultActions,
  hasEnoughProfile,
} from "./procedures";

const PHOTO_HINT =
  "片付けの前に、外観全体と損傷部分の写真を残しておくと、あとの手続きに役立ちます。";

const SYSTEM_PROMPT = `あなたは日本の災害被災者向けWebアプリ「生活再建ナビ」のAIアシスタントです。
令和8年（2026年）7月28日 熊本地震の被災者向けです。生活再建（被害記録・支援制度・手続き）の案内を、やさしい日本語で短く答えてください。

役割:
1. まだ分かっていないことだけを質問する
2. 一度に多くの質問をしない（1〜2項目ずつ）
3. 専門用語は避け、必要ならかっこ書きで説明する
4. 十分な情報が集まったら、やるべきことを整理する

対象:
- 熊本地震専用。災害の種類は聞かない（disasterType は常に「地震」）
- 1つの返答は1つの流れで書く
- すでに把握している項目（市町村・被害・家族・ライフライン等）は絶対に聞き直さない
- j00Completed が true の場合、初回の状況入力済み。ヒアリング質問はしない

把握したい情報（未入力のものだけ）:
- お住まいの市町村（熊本県内）
- 住宅の被害（全壊/半壊/一部損壊など）
- 今いる場所（自宅/避難所など）
- 高齢者や子どもの有無

十分な情報が集まったら、通常の返答の末尾に必ず以下のJSONブロックを1つだけ付けてください:

\`\`\`json
{
  "profile": {
    "address": "",
    "municipality": "",
    "disasterType": "地震",
    "housingDamage": "",
    "currentShelter": "",
    "householdSize": 0,
    "hasElderly": false,
    "hasChildren": false,
    "notes": ""
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
医療や安全に関わる内容は最優先で案内してください。
分からないことは推測せず、「公式の案内でご確認ください」と伝えてください。
支援の受給を保証するような表現は禁止です。`;

function hasSignificantHousingDamage(damage?: string): boolean {
  if (!damage || damage === "なし" || damage === "わからない") return false;
  return true;
}

function withPhotoHintIfNeeded(message: string, profile: UserProfile): string {
  if (!hasSignificantHousingDamage(profile.housingDamage)) return message;
  if (/写真/.test(message)) return message;
  return `${PHOTO_HINT}\n\n${message}`;
}

export function extractJsonBlock(content: string): {
  text: string;
  data?: {
    profile?: UserProfile;
    actions?: ActionItem[];
    isComplete?: boolean;
  };
} {
  const match = content.match(/```json\s*([\s\S]*?)```/);
  if (!match) {
    return { text: content.trim() };
  }

  try {
    const parsed = JSON.parse(match[1]) as {
      profile?: UserProfile;
      actions?: Array<Omit<ActionItem, "completed">>;
      isComplete?: boolean;
    };

    const actions = parsed.actions?.map((action) => ({
      ...action,
      completed: false,
    }));

    const text = content.replace(match[0], "").trim();
    return { text, data: { ...parsed, actions } };
  } catch {
    return { text: content.replace(match[0], "").trim() };
  }
}

export function buildFallbackReply(
  messages: ChatMessage[],
  profile: UserProfile
): {
  message: string;
  profile: UserProfile;
  actions?: ActionItem[];
  isComplete?: boolean;
} {
  const mergedProfile = mergeChatProfileFromMessages(profile, messages);
  const municipalityHint = MUNICIPALITIES.map((m) => m.name).join("、");

  if (isChatIntakeComplete(mergedProfile)) {
    if (!profile.j00Completed && hasEnoughProfile(mergedProfile)) {
      const actions = generateDefaultActions(mergedProfile);
      return {
        message:
          "教えてくださった内容をもとに、確認したいことを整理しました。\n\n下のボタンから一覧を見られます。",
        profile: mergedProfile,
        actions,
        isComplete: true,
      };
    }

    return {
      message: buildJ00ContinuedReply(mergedProfile),
      profile: mergedProfile,
    };
  }

  const nextField = getNextIntakeField(mergedProfile);
  if (nextField) {
    const question = buildIntakeQuestion(
      nextField,
      mergedProfile,
      municipalityHint
    );
    return {
      message:
        nextField === "housingDamage"
          ? question
          : withPhotoHintIfNeeded(question, mergedProfile),
      profile: mergedProfile,
    };
  }

  return {
    message: withPhotoHintIfNeeded(
      "停電や断水など、いま使えないものがあれば教えてください。すでに復旧している場合は、その旨を書いていただいて大丈夫です。",
      mergedProfile
    ),
    profile: mergedProfile,
  };
}

export { SYSTEM_PROMPT };
