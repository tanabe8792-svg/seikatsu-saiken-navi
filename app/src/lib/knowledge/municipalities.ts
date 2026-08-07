import type { Municipality } from "./types";

/** 全国地方公共団体コード（JIS X 0401 / 0402） */
export const MUNICIPALITY_CODES = {
  // 熊本県 — 震度7・6強など被害の大きい地域を優先
  KUMAMOTO_CITY: "43100",
  YATSUSHIRO_CITY: "43202",
  UTO_CITY: "43443",
  HIKAWA_TOWN: "43441",
  UKI_CITY: "43442",
  MISATO_TOWN: "43444",
  MASHIKI_TOWN: "43403",
  KASHIMA_TOWN: "43404",
  KOSA_TOWN: "43445",
  // 県外（震度5強前後が観測された主な市）— 毎日の自動更新はせず、窓口案内用に静的登録
  MINAMISHIMABARA_CITY: "42213",
  SATSUMASENDAI_CITY: "46215",
  IZUMI_CITY: "46208",
} as const;

export const PREFECTURE_KUMAMOTO = {
  code: "43",
  name: "熊本県",
} as const;

export const PREFECTURE_NAGASAKI = {
  code: "42",
  name: "長崎県",
} as const;

export const PREFECTURE_KAGOSHIMA = {
  code: "46",
  name: "鹿児島県",
} as const;

export const DISASTER_EVENT_R8_KUMAMOTO = {
  id: "DE-R8-KUMAMOTO-20260728",
  name: "令和8年（2026年）7月28日 熊本地震",
  occurredAt: "2026-07-28",
} as const;

/**
 * 選択リスト用。被害の大きい熊本県内 → 県外の主な市 →（UI側で「その他」）。
 * 毎日サーバー更新しない静的マスタ。
 */
export const MUNICIPALITIES: Municipality[] = [
  {
    code: MUNICIPALITY_CODES.UKI_CITY,
    name: "宇城市",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.city.uki.kumamoto.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.HIKAWA_TOWN,
    name: "氷川町",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.town.hikawa.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.KUMAMOTO_CITY,
    name: "熊本市",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.city.kumamoto.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.YATSUSHIRO_CITY,
    name: "八代市",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.city.yatsushiro.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.UTO_CITY,
    name: "宇土市",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.city.uto.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.MISATO_TOWN,
    name: "美里町",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.town.kumamoto-misato.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.MASHIKI_TOWN,
    name: "益城町",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.town.mashiki.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.KASHIMA_TOWN,
    name: "嘉島町",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.town.kashima.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.KOSA_TOWN,
    name: "甲佐町",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.town.kosa.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.MINAMISHIMABARA_CITY,
    name: "南島原市",
    prefecture: PREFECTURE_NAGASAKI.name,
    prefectureCode: PREFECTURE_NAGASAKI.code,
    officialUrl: "https://www.city.minamishimabara.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.SATSUMASENDAI_CITY,
    name: "薩摩川内市",
    prefecture: PREFECTURE_KAGOSHIMA.name,
    prefectureCode: PREFECTURE_KAGOSHIMA.code,
    officialUrl: "https://www.city.satsumasendai.lg.jp/",
    disasterApplicable: true,
  },
  {
    code: MUNICIPALITY_CODES.IZUMI_CITY,
    name: "出水市",
    prefecture: PREFECTURE_KAGOSHIMA.name,
    prefectureCode: PREFECTURE_KAGOSHIMA.code,
    officialUrl: "https://www.city.izumi.kagoshima.jp/",
    disasterApplicable: true,
  },
];

/** はじめに画面用：見出し付きグループ */
export const MUNICIPALITY_CHOICE_GROUPS: {
  label: string;
  names: string[];
}[] = [
  {
    label: "熊本県（被害の大きい地域）",
    names: MUNICIPALITIES.filter((m) => m.prefectureCode === "43").map(
      (m) => m.name
    ),
  },
  {
    label: "熊本県以外（揺れが大きかった主な市）",
    names: MUNICIPALITIES.filter((m) => m.prefectureCode !== "43").map(
      (m) => m.name
    ),
  },
  {
    label: "上にないとき",
    names: ["その他"],
  },
];

const MUNICIPALITY_BY_CODE = new Map(
  MUNICIPALITIES.map((m) => [m.code, m])
);

const MUNICIPALITY_BY_NAME = new Map(
  MUNICIPALITIES.map((m) => [m.name, m])
);

export function getMunicipalityByCode(
  code: string
): Municipality | undefined {
  return MUNICIPALITY_BY_CODE.get(code);
}

export function getMunicipalityByName(
  name: string
): Municipality | undefined {
  return MUNICIPALITY_BY_NAME.get(name);
}

/** チャット入力などから市町村名を推定 */
export function resolveMunicipalityName(input: string): string | undefined {
  const normalized = input
    .trim()
    .replace(/[です。、．.!！?？\s]/g, "")
    .replace(/に住んで|在住|から|です$/g, "");

  if (!normalized) return undefined;

  for (const municipality of MUNICIPALITIES) {
    if (
      normalized === municipality.name ||
      normalized.includes(municipality.name)
    ) {
      return municipality.name;
    }
    const short = municipality.name.replace(/[市区町村]$/, "");
    if (
      short.length >= 2 &&
      (normalized === short || normalized.startsWith(short))
    ) {
      return municipality.name;
    }
  }

  if (/^熊本(?!県)/.test(normalized)) return "熊本市";

  return undefined;
}

export function resolveMunicipalityCode(
  codeOrName?: string
): string | undefined {
  if (!codeOrName) return undefined;
  if (MUNICIPALITY_BY_CODE.has(codeOrName)) return codeOrName;
  return MUNICIPALITY_BY_NAME.get(codeOrName)?.code;
}
