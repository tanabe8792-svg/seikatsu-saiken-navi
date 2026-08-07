import type { ActionItem, ProcedureDetail, UserProfile } from "./types";
import { MUNICIPALITIES, resolveMunicipalityName } from "./knowledge/municipalities";

export const PROCEDURES: Record<string, ProcedureDetail> = {
  "evacuation-check": {
    id: "evacuation-check",
    title: "避難所・避難場所の確認",
    summary: "安全な場所にいるか確認し、必要なときは最寄りの避難所情報を調べます。",
    documents: ["身分証明書（あれば）", "常備薬（あれば）", "スマートフォン"],
    submissionPlace: "お住まいの市町村の避難所案内、または防災アプリ",
    deadline: "被災直後、できるだけ早く",
    notes: [
      "無理に移動せず、安全が最優先です",
      "市町村の公式サイトや防災無線で最新情報を確認してください",
      "高齢者や子どもがいる場合は、近くの支援者にも声をかけてください",
    ],
    contact: "お住まいの市町村の防災担当",
    relatedActions: ["避難所確認"],
  },
  "disaster-certificate": {
    id: "disaster-certificate",
    title: "罹災証明書の申請",
    summary:
      "市役所で「家が被災したこと」を証明する書類（罹災証明）をもらいます。多くの支援制度で必要になります。",
    documents: [
      "本人確認書類（運転免許証、マイナンバーカード等）",
      "印鑑（なくても申請できる場合があります）",
      "被災状況がわかる写真（あれば）",
    ],
    submissionPlace: "お住まいの市町村の役所（市役所・区役所・町村役場）",
    deadline: "被災後、できるだけ早く（1〜2週間以内が目安）",
    notes: [
      "罹災証明は「被災証明」と呼ばれる場合もあります",
      "窓口の混雑状況は、事前に電話で確認すると待ち時間が減りやすいです",
      "全壊・半壊・浸水等、損害の程度が記載されます",
    ],
    contact: "お住まいの市町村の窓口",
    relatedActions: ["罹災証明書申請", "罹災証明の取得"],
  },
  "insurance-contact": {
    id: "insurance-contact",
    title: "保険会社への連絡",
    summary:
      "火災保険・地震保険などに加入している場合、早めの連絡が重要です。",
    documents: [
      "保険証券または契約内容がわかる書類",
      "罹災証明（取得後）",
      "被災状況の写真",
    ],
    submissionPlace: "加入している保険会社（電話または窓口）",
    deadline: "被災後、できるだけ早く（契約により異なります）",
    notes: [
      "契約内容によって補償の範囲が異なります",
      "公的支援との併用が複雑な場合は専門家への相談も検討してください",
      "連絡前に保険証券の番号を確認しておくと、話が進みやすいです",
    ],
    contact: "保険会社のカスタマーセンター",
    relatedActions: ["保険会社へ連絡", "火災保険の連絡"],
  },
  "support-application": {
    id: "support-application",
    title: "支援金・補助制度の確認",
    summary:
      "被災者向けの生活支援や住まいの支援制度を確認し、該当しそうなものを調べます。",
    documents: [
      "罹災証明",
      "本人確認書類",
      "住民票（必要な場合）",
      "振込先口座情報",
    ],
    submissionPlace: "お住まいの市町村、または制度ごとの申請窓口",
    deadline: "制度ごとに異なります。早めの確認が重要です",
    notes: [
      "必ずしもすべての制度が対象とは限りません",
      "最新情報は自治体の公式サイトで確認してください",
      "申請期限を過ぎると受けられない場合があります",
    ],
    contact: "お住まいの市町村の福祉担当",
    relatedActions: ["支援金申請", "支援制度の確認"],
  },
  "lifeline-check": {
    id: "lifeline-check",
    title: "ライフライン（電気・ガス・水道）の確認",
    summary:
      "自宅の電気・ガス・水道が使えるか確認し、止まっている場合は復旧や代替手段を調べます。",
    documents: ["契約者情報", "お客様番号（わかる場合）"],
    submissionPlace: "各ライフライン会社（電力・ガス・水道）",
    deadline: "被災後、できるだけ早く",
    notes: [
      "停電・断水時は避難所の支援（給水・充電）を確認してください",
      "ガス漏れの疑いがある場合は、自己判断で復旧せず専門業者に相談してください",
      "お子さまがいる場合は、避難所のキッズスペース等も確認してください",
    ],
    contact: "各ライフライン会社のコールセンター",
    relatedActions: ["ライフライン確認"],
  },
  "safety-contact": {
    id: "safety-contact",
    title: "家族・知人への安否連絡",
    summary: "離れて暮らす家族や知人に、自分の安全と状況を伝えます。",
    documents: [],
    submissionPlace: "電話、メッセージ、安否確認システム",
    deadline: "被災後、できるだけ早く",
    notes: [
      "災害伝言ダイヤル（171）なども活用できます",
      "連絡がつきにくい場合は、自治体の安否情報も確認してください",
    ],
    relatedActions: ["安否連絡"],
  },
  "temporary-housing": {
    id: "temporary-housing",
    title: "仮設住宅・住まいの支援を調べる",
    summary:
      "自宅に住めない場合、仮設住宅や公営住宅などの支援制度を確認します。",
    documents: ["罹災証明", "本人確認書類", "住民票"],
    submissionPlace: "お住まいの市町村の住宅担当",
    deadline: "被災後、早めの相談がおすすめです",
    notes: [
      "自治体や支援制度によって支援内容が異なります",
      "避難所からの移行時期も含めて相談してください",
    ],
    contact: "お住まいの市町村の住宅・福祉担当",
    relatedActions: ["仮設住宅申請", "住まいの支援"],
  },
};

export function getProcedureById(id: string): ProcedureDetail | undefined {
  return PROCEDURES[id];
}

export function generateDefaultActions(profile: UserProfile): ActionItem[] {
  const actions: ActionItem[] = [];
  const damage = profile.housingDamage ?? "";
  const hasDamage =
    !!damage && !damage.includes("なし") && !damage.includes("わからない");

  if (hasDamage) {
    actions.push({
      id: "disaster-certificate",
      title: "罹災証明をもらう",
      description: "市役所で被災の証明書を取得します（支援申請に必要）",
      priority: "week",
      completed: false,
      procedureId: "disaster-certificate",
    });
  }

  const cannotStayHome =
    damage.includes("全壊") ||
    damage.includes("半壊") ||
    damage.includes("浸水") ||
    damage.includes("住めない");

  if (cannotStayHome || profile.currentShelter?.includes("避難")) {
    actions.push({
      id: "temporary-housing",
      title: "仮設住宅などを調べる",
      description: "自宅に戻れない場合の住まい支援を確認します",
      priority: "week",
      completed: false,
      procedureId: "temporary-housing",
    });
  }

  actions.push(
    {
      id: "insurance-contact",
      title: "保険会社に連絡",
      description: "火災保険・地震保険の連絡を検討します",
      priority: "week",
      completed: false,
      procedureId: "insurance-contact",
    },
    {
      id: "support-application",
      title: "支援制度を調べる",
      description: "使える可能性のある生活再建支援を確認します",
      priority: "month",
      completed: false,
      procedureId: "support-application",
    }
  );

  if (profile.hasPowerOutage || profile.hasWaterOutage) {
    actions.push({
      id: "lifeline-check",
      title: "電気・水の状況を確認",
      description: profile.hasPowerOutage && profile.hasWaterOutage
        ? "停電と断水の復旧状況を確認します"
        : profile.hasPowerOutage
          ? "停電の復旧状況を確認します"
          : "断水の状況と給水場所を確認します",
      priority: "month",
      completed: false,
      procedureId: "lifeline-check",
    });
  }

  actions.push({
    id: "safety-contact",
    title: "家族に無事を伝える",
    description: "まだ連絡していなければ、安否を伝えましょう",
    priority: "month",
    completed: false,
    procedureId: "safety-contact",
  });

  return actions;
}

export function mergeActions(existing: ActionItem[], incoming: ActionItem[]): ActionItem[] {
  const map = new Map<string, ActionItem>();
  for (const action of existing) {
    map.set(action.id, action);
  }
  for (const action of incoming) {
    const prev = map.get(action.id);
    map.set(action.id, prev ? { ...action, completed: prev.completed } : action);
  }
  return Array.from(map.values());
}

export function parseProfileFromText(text: string): Partial<UserProfile> {
  const profile: Partial<UserProfile> = {};

  if (/地震|熊本地震|被災|被害|半壊|全壊|避難/.test(text)) {
    profile.disasterType = "地震";
  }

  if (/全壊|倒壊/.test(text)) profile.housingDamage = "全壊（住めない）";
  else if (/半壊/.test(text)) profile.housingDamage = "半壊";
  else if (/一部損壊|一部/.test(text)) profile.housingDamage = "一部損壊";

  for (const municipality of MUNICIPALITIES) {
    if (text.includes(municipality.name)) {
      profile.municipality = municipality.name;
      break;
    }
  }

  if (!profile.municipality) {
    const resolved = resolveMunicipalityName(text);
    if (resolved) profile.municipality = resolved;
  }

  if (/避難所/.test(text)) profile.currentShelter = "避難所";
  else if (/親戚|知人/.test(text)) profile.currentShelter = "親戚・知人の家";

  if (/高齢|お年寄|祖母|祖父|80|70/.test(text)) profile.hasElderly = true;
  if (/子ども|子供|小学生|未就学|赤ちゃん/.test(text)) profile.hasChildren = true;

  const householdMatch = text.match(/(\d)\s*人|(\d)\s*名/);
  if (householdMatch) {
    profile.householdSize = Number(householdMatch[1] ?? householdMatch[2]);
  }

  const addressMatch = text.match(
    /(北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)[^\s、。]{0,20}/
  );
  if (addressMatch) profile.address = addressMatch[0];

  return profile;
}

export function hasEnoughProfile(profile: UserProfile): boolean {
  if (profile.j00Completed && profile.municipality && profile.housingDamage) {
    return true;
  }

  const filled = [
    profile.disasterType,
    profile.housingDamage,
    profile.currentShelter,
    profile.address || profile.municipality,
  ].filter(Boolean).length;
  return filled >= 2;
}
