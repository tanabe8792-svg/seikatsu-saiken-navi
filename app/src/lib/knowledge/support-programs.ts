import type { SupportProgram } from "./types";
import {
  DISASTER_EVENT_R8_KUMAMOTO,
  MUNICIPALITY_CODES,
  PREFECTURE_KUMAMOTO,
} from "./municipalities";

export const SUPPORT_PROGRAMS: SupportProgram[] = [
  {
    id: "SP-DISASTER-CERTIFICATE",
    name: "罹災証明書（り災証明書）",
    journeyId: "J-03",
    description:
      "住家の被害程度を市町村が証明する書類。支援制度・保険請求の入口。",
    targetConditions: [
      {
        field: "damageLevel",
        operator: "in",
        value: ["全壊", "半壊", "一部損壊", "浸水"],
      },
    ],
    requiredDocuments: ["身分証明書", "被害状況がわかる写真"],
    municipalityScope: {
      type: "municipalities",
      codes: [
        MUNICIPALITY_CODES.KUMAMOTO_CITY,
        MUNICIPALITY_CODES.UKI_CITY,
        MUNICIPALITY_CODES.HIKAWA_TOWN,
        MUNICIPALITY_CODES.YATSUSHIRO_CITY,
        MUNICIPALITY_CODES.KOSA_TOWN,
        MUNICIPALITY_CODES.UTO_CITY,
      ],
    },
    sourceUrl: "https://digital-gov.note.jp/n/ne4f237bf506b",
    updatedAt: "2026-07-30",
  },
  {
    id: "SP-EMERGENCY-REPAIR",
    name: "応急修理制度",
    journeyId: "J-05",
    description: "被災住宅の応急的な修理支援（自治体制度）。",
    targetConditions: [
      {
        field: "damageLevel",
        operator: "in",
        value: ["半壊", "一部損壊", "浸水"],
      },
    ],
    requiredDocuments: ["罹災証明", "確認不可"],
    municipalityScope: {
      type: "municipalities",
      codes: [MUNICIPALITY_CODES.KUMAMOTO_CITY],
    },
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-04",
  },
  {
    id: "SP-LIFE-REBUILD",
    name: "被災者生活再建支援制度",
    journeyId: "J-04",
    description:
      "被災住宅の再建等に必要な費用の一部を支援する国の制度。",
    targetConditions: [
      {
        field: "damageLevel",
        operator: "in",
        value: ["全壊", "半壊"],
      },
      {
        field: "disasterCertificateStatus",
        operator: "in",
        value: ["applied", "issued"],
      },
    ],
    requiredDocuments: ["罹災証明", "所得証明", "振込口座"],
    municipalityScope: { type: "national" },
    sourceUrl: "https://www.mlit.go.jp/toshi/toshi-hukko-kenko/plan/000060682.html",
    updatedAt: "2026-08-01",
  },
  {
    id: "SP-WATER-RATE-REDUCTION",
    name: "水道料金減免",
    journeyId: "J-04",
    description: "被災による水道料金の減免・猶予（自治体・水道事業者による）。",
    targetConditions: [{ field: "hasWaterOutage", operator: "true" }],
    requiredDocuments: ["確認不可"],
    municipalityScope: {
      type: "prefecture",
      code: PREFECTURE_KUMAMOTO.code,
    },
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-03",
  },
  {
    id: "SP-DISASTER-VOLUNTEER",
    name: "災害ボランティア",
    journeyId: "J-06",
    description: "被災地でのボランティア活動の募集・受入。",
    targetConditions: [{ field: "damageLevel", operator: "exists" }],
    requiredDocuments: [],
    municipalityScope: {
      type: "prefecture",
      code: PREFECTURE_KUMAMOTO.code,
    },
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-04",
  },
  {
    id: "SP-DISASTER-WASTE",
    name: "災害ゴミ",
    journeyId: "J-03",
    description: "被災ごみ・災害廃棄物の回収に関する自治体制度。",
    targetConditions: [
      {
        field: "damageLevel",
        operator: "in",
        value: ["全壊", "半壊", "一部損壊", "浸水"],
      },
    ],
    requiredDocuments: [],
    municipalityScope: {
      type: "municipalities",
      codes: [
        MUNICIPALITY_CODES.KUMAMOTO_CITY,
        MUNICIPALITY_CODES.UKI_CITY,
        MUNICIPALITY_CODES.YATSUSHIRO_CITY,
        MUNICIPALITY_CODES.HIKAWA_TOWN,
        MUNICIPALITY_CODES.KOSA_TOWN,
        MUNICIPALITY_CODES.UTO_CITY,
      ],
    },
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-03",
  },
  {
    id: "SP-TEMP-HOUSING",
    name: "仮設住宅",
    journeyId: "J-05",
    description: "被災により住居を失った世帯向けの仮設住宅・みなし仮設。",
    targetConditions: [
      {
        field: "damageLevel",
        operator: "in",
        value: ["全壊", "半壊"],
      },
    ],
    requiredDocuments: ["罹災証明", "確認不可"],
    municipalityScope: {
      type: "prefecture",
      code: PREFECTURE_KUMAMOTO.code,
    },
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-04",
  },
  {
    id: "SP-DISASTER-LOAN-RELIEF",
    name: "被災ローン減免制度",
    journeyId: "J-04",
    description:
      "被災による住宅ローン等の返済猶予・減免に関する制度（金融機関・国）。",
    targetConditions: [
      { field: "hasMortgage", operator: "true" },
      {
        field: "damageLevel",
        operator: "in",
        value: ["全壊", "半壊", "一部損壊", "浸水"],
      },
    ],
    requiredDocuments: ["罹災証明", "ローン契約書", "確認不可"],
    municipalityScope: { type: "national" },
    sourceUrl: "https://www.fsa.go.jp/policy/disaster/index.html",
    updatedAt: "2026-08-01",
  },
  {
    id: "SP-BUSINESS-SME-RECOVERY",
    name: "中小企業向け災害復旧支援",
    journeyId: "J-04",
    description:
      "被災した中小企業・小規模事業者の事業復旧に関する支援制度。詳細は確認中。",
    targetConditions: [
      { field: "hasBusinessDamage", operator: "true" },
      {
        field: "employmentType",
        operator: "in",
        value: ["self_employed", "自営業"],
      },
    ],
    requiredDocuments: ["確認不可"],
    municipalityScope: { type: "national" },
    sourceUrl: "確認不可",
    updatedAt: "確認不可",
  },
  {
    id: "SP-BUSINESS-JFC-LOAN",
    name: "日本政策金融公庫 災害融資",
    journeyId: "J-04",
    description:
      "被災事業者向けの災害復旧ローン等。金利・条件の詳細は確認中。",
    targetConditions: [
      { field: "hasBusinessDamage", operator: "true" },
      {
        field: "employmentType",
        operator: "in",
        value: ["self_employed", "自営業"],
      },
    ],
    requiredDocuments: ["確認不可"],
    municipalityScope: { type: "national" },
    sourceUrl: "確認不可",
    updatedAt: "確認不可",
  },
  {
    id: "SP-BUSINESS-CHAMBER",
    name: "商工会・商工会議所 相談",
    journeyId: "J-04",
    description:
      "地域の商工会・商工会議所による事業復旧相談。連絡先・受付方法は確認中。",
    targetConditions: [
      { field: "hasBusinessDamage", operator: "true" },
      {
        field: "employmentType",
        operator: "in",
        value: ["self_employed", "自営業"],
      },
    ],
    requiredDocuments: [],
    municipalityScope: {
      type: "prefecture",
      code: PREFECTURE_KUMAMOTO.code,
    },
    sourceUrl: "確認不可",
    updatedAt: "確認不可",
  },
  {
    id: "SP-INSURANCE-CLAIM",
    name: "火災・地震保険 事故報告",
    journeyId: "J-04",
    description:
      "火災保険・地震保険等への被害報告。契約内容・報告期限は加入保険会社の案内を確認。",
    targetConditions: [
      {
        field: "damageLevel",
        operator: "in",
        value: ["全壊", "半壊", "一部損壊", "浸水"],
      },
    ],
    requiredDocuments: ["被害状況がわかる写真", "確認不可"],
    municipalityScope: { type: "national" },
    sourceUrl: "https://www.sonpo.or.jp/news/disaster/",
    updatedAt: "2026-08-05",
  },
  {
    id: "SP-TAX-SOCIAL-INSURANCE",
    name: "税・社会保険 被災者向け手続",
    journeyId: "J-04",
    description:
      "所得税・住民税の期限延長、社会保険料の免除・猶予等。詳細は所管機関の告示を確認。",
    targetConditions: [
      {
        field: "damageLevel",
        operator: "in",
        value: ["全壊", "半壊", "一部損壊", "浸水"],
      },
    ],
    requiredDocuments: ["確認不可"],
    municipalityScope: { type: "national" },
    sourceUrl: "https://www.nta.go.jp/life/support/shien/index.htm",
    updatedAt: "2026-08-05",
  },
];

const PROGRAM_BY_ID = new Map(SUPPORT_PROGRAMS.map((p) => [p.id, p]));

export function getSupportProgramById(id: string): SupportProgram | undefined {
  return PROGRAM_BY_ID.get(id);
}

export function getAllSupportPrograms(): SupportProgram[] {
  return SUPPORT_PROGRAMS;
}

export function getProgramsForDisaster(
  disasterEventId: string = DISASTER_EVENT_R8_KUMAMOTO.id
): SupportProgram[] {
  void disasterEventId;
  return SUPPORT_PROGRAMS;
}
