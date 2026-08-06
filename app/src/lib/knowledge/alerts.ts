import type { RegionalAlert } from "./types";
import { MUNICIPALITY_CODES } from "./municipalities";

export const REGIONAL_ALERTS: RegionalAlert[] = [
  {
    id: "ALERT-UKI-CERT-CROWD",
    conditions: {
      municipalityCode: MUNICIPALITY_CODES.UKI_CITY,
      wantsDisasterCertificate: true,
    },
    title: "罹災証明の窓口混雑",
    message:
      "窓口混雑状況を確認してください。オンライン申請の有無を確認します。宇城市では1日200組の受付上限・整理券制です。",
    priority: "critical",
    journeyIds: ["J-03"],
    sourceUrl: "https://news.yahoo.co.jp/articles/71b5683b42720edfdf8ad0d2734c6aa0f0a82d2d",
    updatedAt: "2026-07-31",
  },
  {
    id: "ALERT-WATER-PRIORITY",
    conditions: {
      hasWaterOutage: true,
    },
    title: "給水情報を優先表示",
    message:
      "断水が続いています。最寄りの給水所情報を優先して確認してください。",
    priority: "critical",
    journeyIds: ["J-02"],
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-03",
  },
  {
    id: "ALERT-WATER-CHILDREN",
    conditions: {
      hasWaterOutage: true,
      hasChildren: true,
    },
    title: "子ども世帯の水確保",
    message:
      "お子さまがいる世帯は、飲料水・ミルク・おむつを最優先で確保してください。",
    priority: "critical",
    journeyIds: ["J-02"],
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-03",
  },
  {
    id: "ALERT-KUMAMOTO-ONLINE-CERT",
    conditions: {
      municipalityCode: MUNICIPALITY_CODES.KUMAMOTO_CITY,
      wantsDisasterCertificate: true,
    },
    title: "マイナポータル申請を検討",
    message:
      "熊本市ではマイナポータルからの電子申請を受け付けています。窓口の混雑回避にご利用ください。",
    priority: "high",
    journeyIds: ["J-03"],
    sourceUrl: "https://www.city.kumamoto.jp/bousai/kiji0032451/index.html",
    updatedAt: "2026-08-01",
  },
  {
    id: "ALERT-YATSUSHIRO-ONLINE",
    conditions: {
      municipalityCode: MUNICIPALITY_CODES.YATSUSHIRO_CITY,
      wantsDisasterCertificate: true,
    },
    title: "八代市オンライン申請",
    message:
      "八代市では専用フォームからオンライン申請できます。窓口は8月10日目途開始予定です。",
    priority: "high",
    journeyIds: ["J-03"],
    sourceUrl: "https://www.city.yatsushiro.lg.jp/kiji00324826/index.html",
    updatedAt: "2026-07-31",
  },
  {
    id: "ALERT-HIKAWA-LONG-WATER",
    conditions: {
      municipalityCode: MUNICIPALITY_CODES.HIKAWA_TOWN,
      hasWaterOutage: true,
    },
    title: "氷川町：長期断水の見込",
    message:
      "復旧まで長期化する可能性があります。給水所情報をこまめに確認してください。",
    priority: "critical",
    journeyIds: ["J-02"],
    sourceUrl: "https://mainichi.jp/articles/20260731/k00/00m/040/285000c",
    updatedAt: "2026-07-31",
  },
  {
    id: "ALERT-HEAT-CAR-SHELTER",
    conditions: {
      damageLevels: ["全壊", "半壊"],
    },
    title: "車中泊・猛暑に注意",
    message:
      "2016年の熊本地震では関連死の多くが避難生活に起因しました。熱中症・エコノミークラス症候群に注意してください。",
    priority: "high",
    journeyIds: ["J-01", "J-02"],
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-04",
  },
  {
    id: "ALERT-FRAUD-WARNING",
    conditions: {},
    title: "修理・保険の勧誘に注意",
    message:
      "「保険金で無料で直せます」等の勧誘に注意。消費者ホットライン188へ。",
    priority: "medium",
    journeyIds: ["J-04", "J-05"],
    sourceUrl: "https://kumamoto-shien.jp/",
    updatedAt: "2026-08-04",
  },
];

export function getAllAlerts(): RegionalAlert[] {
  return REGIONAL_ALERTS;
}
