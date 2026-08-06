import type { DisasterOverlay, SourcedValue } from "./types";
import {
  DISASTER_EVENT_R8_KUMAMOTO,
  MUNICIPALITY_CODES,
} from "./municipalities";

function verified<T>(
  value: T,
  sourceUrl: string,
  updatedAt: string
): SourcedValue<T> {
  return { value, sourceUrl, updatedAt };
}

function unverified<T = string>(): SourcedValue<T> {
  return { value: "確認不可", sourceUrl: null, updatedAt: "確認不可" };
}

export const DISASTER_OVERLAYS: DisasterOverlay[] = [
  {
    disasterEventId: DISASTER_EVENT_R8_KUMAMOTO.id,
    disasterName: DISASTER_EVENT_R8_KUMAMOTO.name,
    municipalityCode: MUNICIPALITY_CODES.KUMAMOTO_CITY,
    intensity: verified(
      "6強〜7（区域差）",
      "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
      "2026-08-01 12:00"
    ),
    damageSummary: verified(
      "令和8年7月28日発生の地震による住家被害。各区で罹災証明の申請受付中。",
      "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
      "2026-08-01 12:00"
    ),
    lifelineIssues: {
      waterOutage: verified(
        "区域により断水・にごり水",
        "https://kumamoto-shien.jp/",
        "2026-08-04 12:00"
      ),
      powerOutage: unverified(),
      gasOutage: unverified(),
      waterStationCount: unverified<number>(),
      waterStationInfoUrl: verified(
        "https://kumamoto-shien.jp/",
        "https://kumamoto-shien.jp/",
        "2026-08-04 12:00"
      ),
    },
    certificateInfo: {
      summary: verified(
        "住家のり災証明書。マイナポータル電子申請および各区福祉課・城南総合出張所等で窓口申請。",
        "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
        "2026-08-01 12:00"
      ),
      onlineAvailable: verified(
        true,
        "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
        "2026-08-01 12:00"
      ),
      onlineUrl: verified(
        "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
        "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
        "2026-08-01 12:00"
      ),
      officeHours: verified(
        "9:00〜16:00（土日臨時窓口あり）",
        "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
        "2026-08-01 12:00"
      ),
      dailyLimit: verified(
        null,
        "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
        "2026-08-01 12:00"
      ),
      ticketSystem: verified(
        false,
        "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
        "2026-08-01 12:00"
      ),
      requiredDocuments: unverified<string[]>(),
      notes: verified(
        "お住まいの区以外でも申請可。マイナポータル申請推奨。",
        "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
        "2026-08-01 12:00"
      ),
    },
    sourceUrl: "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
    updatedAt: "2026-08-01 12:00",
  },
  {
    disasterEventId: DISASTER_EVENT_R8_KUMAMOTO.id,
    disasterName: DISASTER_EVENT_R8_KUMAMOTO.name,
    municipalityCode: MUNICIPALITY_CODES.UKI_CITY,
    intensity: verified(
      "7",
      "https://www.city.uki.kumamoto.jp/",
      "2026-07-31 12:00"
    ),
    damageSummary: verified(
      "震度7を観測。罹災証明の受付は1日当たりの規定数を設ける。",
      "https://www.city.uki.kumamoto.jp/",
      "2026-07-31 12:00"
    ),
    lifelineIssues: {
      waterOutage: verified(
        "広域断水",
        "https://kumamoto-shien.jp/",
        "2026-08-03 12:00"
      ),
      powerOutage: unverified(),
      gasOutage: unverified(),
      waterStationCount: verified(
        10,
        "https://kumamoto-shien.jp/",
        "2026-08-03 12:00"
      ),
      waterStationInfoUrl: verified(
        "https://kumamoto-shien.jp/",
        "https://kumamoto-shien.jp/",
        "2026-08-03 12:00"
      ),
    },
    certificateInfo: {
      summary: verified(
        "宇城市役所本庁・三角支所・豊野支所等で罹災証明の申請受付。1日当たりの受付上限あり。",
        "https://www.city.uki.kumamoto.jp/",
        "2026-07-31 12:00"
      ),
      onlineAvailable: unverified<boolean>(),
      onlineUrl: unverified(),
      officeHours: verified(
        "9:00開始（整理券配布）",
        "https://www.city.uki.kumamoto.jp/",
        "2026-08-01 12:00"
      ),
      dailyLimit: verified(
        200,
        "https://www.city.uki.kumamoto.jp/",
        "2026-07-31 12:00"
      ),
      ticketSystem: verified(
        true,
        "https://www.city.uki.kumamoto.jp/",
        "2026-08-01 12:00"
      ),
      requiredDocuments: unverified<string[]>(),
      notes: verified(
        "本庁200組/日、三角・豊野支所各60組/日。上限到達で当日受付終了。",
        "https://www.city.uki.kumamoto.jp/",
        "2026-08-01 12:00"
      ),
    },
    sourceUrl: "https://www.city.uki.kumamoto.jp/",
    updatedAt: "2026-08-01 12:00",
  },
  {
    disasterEventId: DISASTER_EVENT_R8_KUMAMOTO.id,
    disasterName: DISASTER_EVENT_R8_KUMAMOTO.name,
    municipalityCode: MUNICIPALITY_CODES.HIKAWA_TOWN,
    intensity: verified(
      "7",
      "https://www.town.hikawa.kumamoto.jp/list00849.html",
      "2026-07-31 12:00"
    ),
    damageSummary: verified(
      "最大震度7。町内全域で断水が続く。",
      "https://www.town.hikawa.kumamoto.jp/list00849.html",
      "2026-07-31 12:00"
    ),
    lifelineIssues: {
      waterOutage: verified(
        "町内全域約3200戸が断水。復旧まで半年から1年かかる可能性。",
        "https://www.town.hikawa.kumamoto.jp/list00849.html",
        "2026-07-31 12:00"
      ),
      powerOutage: unverified(),
      gasOutage: unverified(),
      waterStationCount: verified(
        2,
        "https://kumamoto-shien.jp/",
        "2026-08-03 12:00"
      ),
      waterStationInfoUrl: verified(
        "https://kumamoto-shien.jp/",
        "https://kumamoto-shien.jp/",
        "2026-08-03 12:00"
      ),
    },
    certificateInfo: {
      summary: verified(
        "マイナポータルからオンライン申請可能（デジタル庁一覧掲載）。",
        "https://digital-gov.note.jp/n/ne4f237bf506b",
        "2026-07-30 12:00"
      ),
      onlineAvailable: verified(
        true,
        "https://digital-gov.note.jp/n/ne4f237bf506b",
        "2026-07-30 12:00"
      ),
      onlineUrl: verified(
        "https://digital-gov.note.jp/n/ne4f237bf506b",
        "https://digital-gov.note.jp/n/ne4f237bf506b",
        "2026-07-30 12:00"
      ),
      officeHours: unverified(),
      dailyLimit: unverified<number | null>(),
      ticketSystem: unverified<boolean>(),
      requiredDocuments: unverified<string[]>(),
      notes: unverified(),
    },
    sourceUrl: "https://digital-gov.note.jp/n/ne4f237bf506b",
    updatedAt: "2026-07-31 12:00",
  },
  {
    disasterEventId: DISASTER_EVENT_R8_KUMAMOTO.id,
    disasterName: DISASTER_EVENT_R8_KUMAMOTO.name,
    municipalityCode: MUNICIPALITY_CODES.YATSUSHIRO_CITY,
    intensity: verified(
      "6強",
      "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
      "2026-07-31 12:00"
    ),
    damageSummary: verified(
      "令和8年熊本地震に伴うり災証明書・被災証明書の申請受付。",
      "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
      "2026-07-31 12:00"
    ),
    lifelineIssues: {
      waterOutage: verified(
        "約2万5300世帯が断水（報道時点）",
        "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
        "2026-07-31 12:00"
      ),
      powerOutage: unverified(),
      gasOutage: unverified(),
      waterStationCount: verified(
        23,
        "https://kumamoto-shien.jp/",
        "2026-08-03 12:00"
      ),
      waterStationInfoUrl: verified(
        "https://kumamoto-shien.jp/",
        "https://kumamoto-shien.jp/",
        "2026-08-03 12:00"
      ),
    },
    certificateInfo: {
      summary: verified(
        "オンライン申請（専用フォーム）および窓口申請（8月10日目途開始予定）。",
        "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
        "2026-07-31 12:00"
      ),
      onlineAvailable: verified(
        true,
        "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
        "2026-07-31 12:00"
      ),
      onlineUrl: verified(
        "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
        "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
        "2026-07-31 12:00"
      ),
      officeHours: unverified(),
      dailyLimit: unverified<number | null>(),
      ticketSystem: unverified<boolean>(),
      requiredDocuments: verified(
        ["被害写真の撮影を必ず行う"],
        "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
        "2026-07-31 12:00"
      ),
      notes: verified(
        "窓口は本庁・坂本・千丁・東陽・泉・鏡支所・日奈久出張所で8月10日目途開始予定。",
        "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
        "2026-07-31 12:00"
      ),
    },
    sourceUrl: "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
    updatedAt: "2026-07-31 12:00",
  },
  {
    disasterEventId: DISASTER_EVENT_R8_KUMAMOTO.id,
    disasterName: DISASTER_EVENT_R8_KUMAMOTO.name,
    municipalityCode: MUNICIPALITY_CODES.KOSA_TOWN,
    intensity: unverified(),
    damageSummary: verified(
      "令和8年熊本地震における住家のり災証明書のオンライン申請を受付。",
      "https://www.town.kosa.lg.jp/q/aview/55/13547.html",
      "2026-07-31 12:00"
    ),
    lifelineIssues: {
      waterOutage: unverified(),
      powerOutage: unverified(),
      gasOutage: unverified(),
      waterStationCount: unverified<number>(),
      waterStationInfoUrl: verified(
        "https://kumamoto-shien.jp/",
        "https://kumamoto-shien.jp/",
        "2026-08-03 12:00"
      ),
    },
    certificateInfo: {
      summary: verified(
        "住家のり災証明書はオンライン申請。住家以外の被災証明書は役場特設窓口。",
        "https://www.town.kosa.lg.jp/q/aview/55/13547.html",
        "2026-07-31 12:00"
      ),
      onlineAvailable: verified(
        true,
        "https://www.town.kosa.lg.jp/q/aview/55/13547.html",
        "2026-07-31 12:00"
      ),
      onlineUrl: verified(
        "https://www.town.kosa.lg.jp/q/aview/55/13547.html",
        "https://www.town.kosa.lg.jp/q/aview/55/13547.html",
        "2026-07-31 12:00"
      ),
      officeHours: unverified(),
      dailyLimit: unverified<number | null>(),
      ticketSystem: unverified<boolean>(),
      requiredDocuments: unverified<string[]>(),
      notes: verified(
        "問い合わせ：甲佐町役場 税務課 096-234-1112",
        "https://www.town.kosa.lg.jp/q/aview/55/13547.html",
        "2026-07-31 12:00"
      ),
    },
    sourceUrl: "https://www.town.kosa.lg.jp/q/aview/55/13547.html",
    updatedAt: "2026-07-31 12:00",
  },
  {
    disasterEventId: DISASTER_EVENT_R8_KUMAMOTO.id,
    disasterName: DISASTER_EVENT_R8_KUMAMOTO.name,
    municipalityCode: MUNICIPALITY_CODES.UTO_CITY,
    intensity: unverified(),
    damageSummary: verified(
      "令和8年熊本地震の被災地域。詳細な被害集計は確認中。",
      "https://www.city.uto.lg.jp/",
      "2026-08-05 12:00"
    ),
    lifelineIssues: {
      waterOutage: unverified(),
      powerOutage: unverified(),
      gasOutage: unverified(),
      waterStationCount: unverified<number>(),
      waterStationInfoUrl: verified(
        "https://kumamoto-shien.jp/",
        "https://kumamoto-shien.jp/",
        "2026-08-05 12:00"
      ),
    },
    certificateInfo: {
      summary: unverified(),
      onlineAvailable: unverified<boolean>(),
      onlineUrl: unverified(),
      officeHours: unverified(),
      dailyLimit: unverified<number | null>(),
      ticketSystem: unverified<boolean>(),
      requiredDocuments: unverified<string[]>(),
      notes: verified(
        "罹災証明の受付方法・窓口情報は宇土市公式サイトで要確認。",
        "https://www.city.uto.lg.jp/",
        "2026-08-05 12:00"
      ),
    },
    sourceUrl: "https://www.city.uto.lg.jp/",
    updatedAt: "2026-08-05 12:00",
  },
];

const OVERLAY_BY_KEY = new Map(
  DISASTER_OVERLAYS.map((o) => [`${o.disasterEventId}:${o.municipalityCode}`, o])
);

export function getDisasterOverlay(
  municipalityCode: string,
  disasterEventId: string = DISASTER_EVENT_R8_KUMAMOTO.id
): DisasterOverlay | undefined {
  return OVERLAY_BY_KEY.get(`${disasterEventId}:${municipalityCode}`);
}

export function getOverlaysForDisaster(
  disasterEventId: string = DISASTER_EVENT_R8_KUMAMOTO.id
): DisasterOverlay[] {
  return DISASTER_OVERLAYS.filter(
    (o) => o.disasterEventId === disasterEventId
  );
}
