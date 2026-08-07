/**
 * 全手続きの「申請案内」— 表示専用（ActionQueue / KB 生成は変更しない）
 *
 * 方針: 被災者が自分で検索しなくても進めるよう、公式の直接リンク・窓口・見通しを
 * 手続きごとにこのナビ（司令塔）へ載せる。
 */

import {
  DISASTER_EVENT_R8_KUMAMOTO,
  getMunicipalityByCode,
  MUNICIPALITY_CODES,
  resolveMunicipalityCode,
} from "@/lib/knowledge/municipalities";
import type { UserProfile } from "@/lib/types";
import { getCertificateHubForProfile } from "./certificate-hub";
import {
  getBusinessContactAssistPlan,
  type ContactAssistPlan,
} from "./contact-assist";
import { profileForBusinessGuidance } from "./municipality-context";

export interface ProcedureGuidanceLink {
  label: string;
  href: string;
  kind: "online" | "official" | "guide" | "consult" | "window";
  primary?: boolean;
}

export interface ProcedureGuidanceFact {
  label: string;
  value: string;
}

export interface ProcedureGuidanceView {
  /** カード見出し（例: 熊本市の申請案内） */
  title: string;
  /** 短い導入（調べなくてよい、という安心） */
  intro: string;
  summary: string | null;
  facts: ProcedureGuidanceFact[];
  links: ProcedureGuidanceLink[];
  /** KB の更新日時（生。UI で整形） */
  sourceUpdatedAt: string | null;
  /** 優先順位つき相談カンペ（電話・メール） */
  contactAssist?: ContactAssistPlan;
}

const SHIEN_PORTAL = "https://kumamoto-shien.jp/";
const MIRASAPO_R8 =
  "https://mirasapo-plus.go.jp/infomation/24559/";
const PREF_SME_WINDOW =
  "https://www.pref.kumamoto.jp/soshiki/61/274549.html";
const CITY_SME_WINDOW =
  "https://www.city.kumamoto.jp/kiji00372112/index.html";
const CITY_BIZ_CERTIFICATE =
  "https://www.city.kumamoto.jp/kiji00310012/index.html";
const CHAMBER_R8 = "https://www.kmt-cci.or.jp/news/r8soudan/";
const YOROZ_R8 = "https://www.kmt-ti.or.jp/archives/23253";
const YATSUSHIRO_CHAMBER_R8 = "https://8246cci.or.jp/hotnews/9126/";
const HIKAWA_CHAMBER = "https://hikawanet.com/contact";
const HIKAWA_TOWN_QUAKE =
  "https://www.town.hikawa.kumamoto.jp/list00849.html";
const JFC_HOME = "https://www.jfc.go.jp/";
const FSA_DISASTER = "https://www.dgl.or.jp/guideline/";
const MLIT_LIFE_REBUILD =
  "https://www.bousai.go.jp/taisaku/seikatsusaiken/";
const NTA_DISASTER =
  "https://www.nta.go.jp/taxes/shiraberu/saigai/index.htm";
const PREF_BLUE_SHEET =
  "https://www.pref.kumamoto.jp/soshiki/27/274885.html";
const CITY_EMERGENCY_REPAIR =
  "https://www.city.kumamoto.jp/kiji00372143/index.html";
const KYUDEN_EMERGENCY =
  "https://www.kyuden.co.jp/td_teiden/kyushu.html";
const SAIBUGAS_DISASTER =
  "https://www.saibugas.co.jp/";
const SONPO_DISASTER =
  "https://www.sonpo.or.jp/news/notice/2026/2607_002.html";
const DIGITAL_GOV_CERT =
  "https://digital-gov.note.jp/n/ne4f237bf506b";

function dedupeLinks(links: ProcedureGuidanceLink[]): ProcedureGuidanceLink[] {
  const seen = new Set<string>();
  return links.filter((l) => {
    const key = `${l.href}::${l.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fromCertificateHub(
  profile: UserProfile
): ProcedureGuidanceView | null {
  const hub = getCertificateHubForProfile(profile);
  if (!hub) return null;

  const facts: ProcedureGuidanceFact[] = [];
  facts.push({
    label: "進み方",
    value: `${hub.channelHeadline} ${hub.channelBody}`,
  });
  if (hub.officeHours) {
    facts.push({ label: "受付時間", value: hub.officeHours });
  }
  if (hub.dailyLimit) {
    facts.push({ label: "1日の受付の目安", value: hub.dailyLimit });
  } else if (hub.municipalitySelected) {
    facts.push({
      label: "1日の受付の目安",
      value:
        "公式で公開されていない、またはこのナビでは未確認です。申請前に公式ページ・窓口で当日の受付状況を確認してください。",
    });
  }
  if (hub.ticketSystem) {
    facts.push({ label: "整理券", value: hub.ticketSystem });
  }
  if (hub.notes) {
    facts.push({ label: "補足", value: hub.notes });
  }
  facts.push({
    label: "申請の流れ（目安）",
    value:
      "①市町村を確認 → ②持ち物を揃える → ③オンラインまたは窓口で申請 → ④調査・判定の連絡を待つ → ⑤証明書を受け取る。窓口の指示に従って進めてください。",
  });
  facts.push({
    label: "交付までの目安",
    value:
      "調査〜交付にかかる日数は、混雑や被害の大きさで市町村ごとに変わります。目安は保証できません。催促はせず、受付番号を控えて公式の連絡を待ちつつ、写真・保険連絡など自分で進められる確認を続けましょう。",
  });

  const introByChannel =
    hub.applyChannel === "mynaportal"
      ? "選んだ市町村はマイナポータル等のオンライン申請に対応しています。下のボタンから公式の申請案内へ進んでください。"
      : hub.applyChannel === "online_other"
        ? "選んだ市町村はオンライン申請に対応しています。下のボタンから公式案内へ進んでください。"
        : hub.applyChannel === "window_only"
          ? "選んだ市町村は、いま確認できる範囲では窓口申請が中心です。公式ページで手続きを確認し、窓口へ進んでください。"
          : hub.channelBody;

  return {
    title: hub.municipalitySelected
      ? `${hub.municipalityName}の罹災証明・申請案内`
      : "罹災証明・申請案内",
    intro: `${introByChannel}\n\n${hub.independenceNote}`,
    summary: hub.summary,
    facts,
    links: hub.links,
    sourceUpdatedAt: hub.sourceUpdatedAt,
  };
}

function businessGuidance(profile: UserProfile): ProcedureGuidanceView {
  const bizProfile = profileForBusinessGuidance(profile);
  const code = resolveMunicipalityCode(bizProfile.municipality);
  const municipality = code ? getMunicipalityByCode(code) : null;
  const name = municipality?.name ?? bizProfile.municipality ?? "お住まいの地域";
  const homeName = profile.municipality ?? "住まい";
  const isKumamotoCity = code === MUNICIPALITY_CODES.KUMAMOTO_CITY;
  const isYatsushiro = code === MUNICIPALITY_CODES.YATSUSHIRO_CITY;
  const isHikawa = code === MUNICIPALITY_CODES.HIKAWA_TOWN;
  const shopDiffers =
    !!profile.businessMunicipality &&
    profile.businessMunicipality !== profile.municipality;

  const links: ProcedureGuidanceLink[] = [];

  if (isYatsushiro) {
    links.push({
      label: "八代商工会議所：特別相談窓口の公式案内",
      href: YATSUSHIRO_CHAMBER_R8,
      kind: "consult",
      primary: true,
    });
  } else if (isHikawa) {
    links.push({
      label: "氷川町商工会：お問い合わせページ",
      href: HIKAWA_CHAMBER,
      kind: "consult",
      primary: true,
    });
  } else if (isKumamotoCity) {
    links.push(
      {
        label: "熊本市：事業者向け特別相談窓口",
        href: CITY_SME_WINDOW,
        kind: "consult",
        primary: true,
      },
      {
        label: "熊本市：事業用り災証明",
        href: CITY_BIZ_CERTIFICATE,
        kind: "official",
      }
    );
  }

  links.push(
    {
      label: "熊本県：中小企業者向け特別相談窓口",
      href: PREF_SME_WINDOW,
      kind: "consult",
    },
    {
      label: "ミラサポplus（国の事業者支援の一覧）",
      href: MIRASAPO_R8,
      kind: "guide",
    }
  );

  return {
    title: `${name}の店舗・事業再建 申請案内`,
    intro: shopDiffers
      ? `店舗は${name}、住まいは${homeName}です。店舗向けの相談を下にまとめました。`
      : "店舗・事業所向けの相談先です。上から順に連絡してみてください。",
    summary:
      "住家の手続きとは別です。くわしい条件は、連絡先の案内に従ってください。",
    facts: [],
    links: dedupeLinks(links),
    sourceUpdatedAt: "2026-08-03 12:00",
    contactAssist: getBusinessContactAssistPlan(bizProfile),
  };
}

function staticGuidance(
  title: string,
  intro: string,
  summary: string,
  facts: ProcedureGuidanceFact[],
  links: ProcedureGuidanceLink[],
  updatedAt: string
): ProcedureGuidanceView {
  return {
    title,
    intro,
    summary,
    facts,
    links: dedupeLinks(links),
    sourceUpdatedAt: updatedAt,
  };
}

function withMunicipalitySite(
  profile: UserProfile,
  links: ProcedureGuidanceLink[],
  options?: { primary?: boolean; place?: "start" | "end" }
): ProcedureGuidanceLink[] {
  const code = resolveMunicipalityCode(profile.municipality);
  const municipality = code ? getMunicipalityByCode(code) : null;
  if (!municipality?.officialUrl) return links;

  const disaster = code ? MUNICIPALITY_DISASTER_SUPPORT[code] : undefined;
  const localLink: ProcedureGuidanceLink = {
    label: disaster?.label ?? `${municipality.name}の公式サイト（支援・お知らせ）`,
    href: disaster?.href ?? municipality.officialUrl,
    kind: "official",
    primary: options?.primary === true,
  };

  if (options?.place === "start") {
    return dedupeLinks([localLink, ...links]);
  }
  return dedupeLinks([...links, localLink]);
}

/** 市町村ごとの災害・支援案内（分かるものだけ。なければ公式トップ） */
const MUNICIPALITY_DISASTER_SUPPORT: Record<
  string,
  { label: string; href: string }
> = {
  [MUNICIPALITY_CODES.HIKAWA_TOWN]: {
    label: "氷川町：地震・災害のお知らせ",
    href: HIKAWA_TOWN_QUAKE,
  },
  [MUNICIPALITY_CODES.KUMAMOTO_CITY]: {
    label: "熊本市：災害・被災者向け情報",
    href: "https://www.city.kumamoto.jp/",
  },
  [MUNICIPALITY_CODES.YATSUSHIRO_CITY]: {
    label: "八代市：公式サイト（支援・お知らせ）",
    href: "https://www.city.yatsushiro.lg.jp/",
  },
  [MUNICIPALITY_CODES.UKI_CITY]: {
    label: "宇城市：公式サイト（支援・お知らせ）",
    href: "https://www.city.uki.kumamoto.jp/",
  },
  [MUNICIPALITY_CODES.UTO_CITY]: {
    label: "宇土市：公式サイト（支援・お知らせ）",
    href: "https://www.city.uto.lg.jp/",
  },
  [MUNICIPALITY_CODES.KOSA_TOWN]: {
    label: "甲佐町：公式サイト（支援・お知らせ）",
    href: "https://www.town.kosa.lg.jp/",
  },
};


/**
 * アクション詳細に載せる申請案内。該当なしは null。
 * 災害イベント: 令和8年熊本地震（表示文脈）
 */
export function getProcedureGuidanceForAction(
  actionId: string,
  profile: UserProfile
): ProcedureGuidanceView | null {
  void DISASTER_EVENT_R8_KUMAMOTO;

  switch (actionId) {
    case "rw-j03-cert-prep":
      return fromCertificateHub(profile);

    case "rw-j04-business-recovery":
      return businessGuidance(profile);

    case "rw-j04-insurance-report":
      return staticGuidance(
        "保険の連絡・申請案内",
        "契約会社ごとの入口は異なります。まずは損保の災害案内と、証券に載っている連絡先へ直接進めてください。",
        "火災保険・地震保険は、まず「事故報告・相談」から始めます。証券番号が分からなくても、会社名が分かれば総合窓口で案内してもらえます。",
        [
          {
            label: "はじめに伝えること",
            value: "令和8年熊本地震で住家（または店舗）に被害があったこと",
          },
          {
            label: "控えるもの",
            value: "受付番号・担当名・今後の必要書類",
          },
        ],
        withMunicipalitySite(profile, [
          {
            label: "日本損害保険協会：自然災害の保険案内",
            href: SONPO_DISASTER,
            kind: "guide",
            primary: true,
          },
          {
            label: "熊本県被災者支援ナビ",
            href: SHIEN_PORTAL,
            kind: "guide",
          },
        ]),
        "2026-07-29 12:00"
      );

    case "rw-j04-loan-relief":
      return staticGuidance(
        "住宅ローン負担軽減の申請案内",
        "自然災害の債務整理ガイドライン公式と、借入先の相談窓口につながるページです。",
        "被災ローン減免などの枠組みは、金融機関ごとに手続きが違います。まずは借入先に「災害のローン相談」と伝え、公的案内で流れを確認します。",
        [
          {
            label: "相談の入口",
            value: "返済口座のある銀行・金庫など借入先の相談窓口",
          },
        ],
        withMunicipalitySite(profile, [
          {
            label: "自然災害債務整理ガイドライン（公式）",
            href: FSA_DISASTER,
            kind: "official",
            primary: true,
          },
          {
            label: "金融庁トップ（関連案内の入口）",
            href: "https://www.fsa.go.jp/",
            kind: "guide",
          },
          {
            label: "熊本県被災者支援ナビ",
            href: SHIEN_PORTAL,
            kind: "guide",
          },
        ]),
        "2026-08-01 12:00"
      );

    case "rw-j04-life-rebuild":
      return staticGuidance(
        "生活再建支援金の申請案内",
        "国の制度説明と、地域の支援ポータルへ直接進めます。申請の窓口は、市町村の案内に従ってください。",
        "罹災証明の被害認定（全壊・半壊など）が支給の前提になることが多いです。結果が出たら、市町村の被災者支援窓口の案内に沿って申請します。",
        [
          {
            label: "よく必要なもの",
            value: "罹災証明、所得に関する書類、振込口座",
          },
        ],
        withMunicipalitySite(profile, [
          {
            label: "内閣府：被災者生活再建支援制度",
            href: MLIT_LIFE_REBUILD,
            kind: "official",
            primary: true,
          },
          {
            label: "国土交通省：住まい関連の案内",
            href: "https://www.mlit.go.jp/jutakukentiku/house/",
            kind: "guide",
          },
          {
            label: "熊本県被災者支援ナビ（申請の入口）",
            href: SHIEN_PORTAL,
            kind: "guide",
            primary: true,
          },
          {
            label: "罹災証明のオンライン申請案内（デジタル庁）",
            href: DIGITAL_GOV_CERT,
            kind: "guide",
          },
        ]),
        "2026-08-01 12:00"
      );

    case "rw-j05-emergency-repair": {
      const code = resolveMunicipalityCode(profile.municipality);
      const name = profile.municipality ?? "お住まいの地域";
      const isKumamotoCity = code === MUNICIPALITY_CODES.KUMAMOTO_CITY;
      const repairLinks: ProcedureGuidanceLink[] = [
        {
          label: "熊本県：緊急の修理（ブルーシート展張等）",
          href: PREF_BLUE_SHEET,
          kind: "official",
          primary: !isKumamotoCity,
        },
        {
          label: "熊本県被災者支援ナビ（応急修理など）",
          href: SHIEN_PORTAL,
          kind: "guide",
          primary: true,
        },
      ];
      if (isKumamotoCity) {
        repairLinks.unshift({
          label: "熊本市：住家の緊急の修理（ブルーシート等）",
          href: CITY_EMERGENCY_REPAIR,
          kind: "official",
          primary: true,
        });
      }
      return staticGuidance(
        `${name}の応急・緊急修理 申請案内`,
        "雨の前に確認したい屋根・ブルーシート等の緊急修理と、当面住むための応急修理の公式ページです。県の案内に加え、選んだ市町村の公式も出します。",
        "緊急修理は被害拡大防止（ブルーシート等）、応急修理は当面の居住のための修理、と案内が分かれていることがあります。対象・期限・り災証明が必要かは、自治体の公式案内で確認してください。情報は更新されるので、開いたページの日付も見てください。",
        [
          {
            label: "大事な注意",
            value: "業者と先に本契約すると対象外になる場合があります。申込の順番を公式で確認してください。",
          },
          ...(isKumamotoCity
            ? [
                {
                  label: "熊本市の緊急修理問合せ（例）",
                  value: "096-328-2449（受付は原則9〜16時・閉庁日除く。最新は公式で確認）",
                },
              ]
            : [
                {
                  label: "市町村の案内",
                  value: `${name}の公式サイトでも、町・市独自の案内がないか確認できます。県ナビとあわせて見てください。`,
                },
              ]),
        ],
        withMunicipalitySite(profile, repairLinks, {
          primary: !isKumamotoCity,
          place: "start",
        }),
        "2026-08-03 12:00"
      );
    }

    case "rw-j02-water-station":
    case "rw-j02-water-children":
      return staticGuidance(
        "給水・ライフラインの申請案内",
        "給水情報と、水道料金の減免、電気・ガスの安全確認につながる公式ページです。自分で復旧状況を探さなくても進めます。",
        "断水中は給水の確保が先です。あわせて水道減免の届出、停電・ガス停止時の事業者案内を確認すると、あとで手続きを忘れにくくなります。",
        [
          {
            label: "水道・減免",
            value: "復旧後でも届出が必要なことがあります。上下水道の公式・支援ナビで確認してください。",
          },
          {
            label: "ガスの安全",
            value: "匂いがする・不安なときは自分で無理に再開せず、事業者か消防の案内に従ってください。",
          },
        ],
        withMunicipalitySite(profile, [
          {
            label: "熊本県被災者支援ナビ（給水・生活情報）",
            href: SHIEN_PORTAL,
            kind: "official",
            primary: true,
          },
          {
            label: "九州電力：停電情報（九州）",
            href: KYUDEN_EMERGENCY,
            kind: "consult",
          },
          {
            label: "西部ガス（ガスの相談・案内）",
            href: SAIBUGAS_DISASTER,
            kind: "consult",
          },
        ]),
        "2026-08-03 12:00"
      );

    case "rw-j04-programs": {
      const name = profile.municipality ?? "お住まいの地域";
      return staticGuidance(
        `${name}で使える支援を一覧で見る`,
        `県の支援ナビに加え、はじめに選んだ「${name}」の公式案内も出しています。別の市町村を選んでいれば、その市町村のサイトがここに出ます。`,
        "国・県・市町村の支援が並んでいます。自分の状況に合いそうなものを開き、詳細ページの条件を確認してください。対象かどうかは、公式案内で最終確認してください。",
        [
          {
            label: "見落としやすい確認",
            value: "緊急・応急修理、水道減免、住まい、事業の相談。加えて勤務先・学校・通院の連絡。",
          },
          {
            label: "地域の公式",
            value: `${name}を選んでいるので、その自治体の支援・お知らせページを優先して案内しています。`,
          },
        ],
        withMunicipalitySite(
          profile,
          [
            {
              label: "熊本県被災者支援ナビを開く",
              href: SHIEN_PORTAL,
              kind: "official",
              primary: true,
            },
            {
              label: "熊本県：緊急の修理（ブルーシート展張等）",
              href: PREF_BLUE_SHEET,
              kind: "guide",
            },
          ],
          { primary: true, place: "start" }
        ),
        "2026-08-04 12:00"
      );
    }

    case "rw-j04-tax-social":
      return staticGuidance(
        "税・社会保険の申請案内",
        "国税の災害減免案内と、市町村の窓口につながるページです。",
        "所得税・住民税・国保・年金などで、減免や猶予の届出ができることがあります。自分が払っているものから確認します。",
        [],
        withMunicipalitySite(profile, [
          {
            label: "国税庁：災害に関する税の案内",
            href: NTA_DISASTER,
            kind: "official",
            primary: true,
          },
          {
            label: "熊本県被災者支援ナビ",
            href: SHIEN_PORTAL,
            kind: "guide",
          },
        ]),
        "2026-08-01 12:00"
      );

    case "rw-j05-housing":
    case "rw-j05-temp-housing":
      return staticGuidance(
        "住まい・仮設住宅の申請案内",
        "仮設・みなし仮設などの募集は期間が区切られることがあります。公式ポータルから直接確認してください。",
        "対象条件・必要書類・締切は、県・市町村の最新の発表を確認してください。通勤・通学・通院の条件も、申し込み前にメモしておくと後で困りにくいです。",
        [],
        withMunicipalitySite(profile, [
          {
            label: "熊本県被災者支援ナビ（住まい支援）",
            href: SHIEN_PORTAL,
            kind: "official",
            primary: true,
          },
        ]),
        "2026-08-04 12:00"
      );

    case "rw-j03-photo":
      return staticGuidance(
        "被害写真の残し方（案内）",
        "写真は罹災証明や保険、応急・緊急修理の材料になります。撮り方の要点だけここにまとめます。",
        "外観と損傷箇所（屋根・雨漏り含む）を、安全な場所から多めに。修理前に残すのが大切です。",
        [
          {
            label: "安全のお願い",
            value:
              "立っているように見えても、時間差で倒壊・落下することがあります。危険な建物には近づかず、撮れる範囲で十分です。",
          },
          {
            label: "あとで必要になる手続き",
            value: "罹災証明、保険、緊急・応急修理、事業用り災証明",
          },
          {
            label: "雨の前に",
            value: "屋根の様子を残しておくと、被害拡大の説明がしやすくなります",
          },
        ],
        [
          {
            label: "熊本県：緊急の修理（ブルーシート展張等）",
            href: PREF_BLUE_SHEET,
            kind: "guide",
            primary: true,
          },
          {
            label: "罹災証明のオンライン申請案内（デジタル庁）",
            href: DIGITAL_GOV_CERT,
            kind: "guide",
          },
          {
            label: "熊本県被災者支援ナビ",
            href: SHIEN_PORTAL,
            kind: "guide",
          },
        ],
        "2026-08-06 12:00"
      );

    default:
      return null;
  }
}
