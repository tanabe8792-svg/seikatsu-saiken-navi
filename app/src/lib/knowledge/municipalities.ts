import type { Municipality } from "./types";

/** 全国地方公共団体コード（JIS X 0401 / 0402） */
export const MUNICIPALITY_CODES = {
  KUMAMOTO_CITY: "43100",
  YATSUSHIRO_CITY: "43202",
  HIKAWA_TOWN: "43441",
  UKI_CITY: "43442",
  UTO_CITY: "43443",
  KOSA_TOWN: "43445",
} as const;

export const PREFECTURE_KUMAMOTO = {
  code: "43",
  name: "熊本県",
} as const;

export const DISASTER_EVENT_R8_KUMAMOTO = {
  id: "DE-R8-KUMAMOTO-20260728",
  name: "令和8年（2026年）7月28日 熊本地震",
  occurredAt: "2026-07-28",
} as const;

export const MUNICIPALITIES: Municipality[] = [
  {
    code: MUNICIPALITY_CODES.KUMAMOTO_CITY,
    name: "熊本市",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.city.kumamoto.jp/",
    disasterApplicable: true,
  },
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
    code: MUNICIPALITY_CODES.YATSUSHIRO_CITY,
    name: "八代市",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.city.yatsushiro.lg.jp/",
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
    code: MUNICIPALITY_CODES.UTO_CITY,
    name: "宇土市",
    prefecture: PREFECTURE_KUMAMOTO.name,
    prefectureCode: PREFECTURE_KUMAMOTO.code,
    officialUrl: "https://www.city.uto.lg.jp/",
    disasterApplicable: true,
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

/** チャット入力などから市町村名を推定（熊本県内） */
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
    const short = municipality.name.replace(/[市区町]$/, "");
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
