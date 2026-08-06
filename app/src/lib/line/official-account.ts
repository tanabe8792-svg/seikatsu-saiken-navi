/**
 * 熊本 生活再建ナビ — 公式 LINE アカウント（表示・友だち追加リンク）
 * Messaging API 連携前でも、友だち追加導線として利用する。
 */

/** LINE Official Account Basic ID（@ 付き） */
export const OFFICIAL_LINE_BASIC_ID = "@272pshvm";

/** 友だち追加 URL（スマホ・PC 共通） */
export const OFFICIAL_LINE_ADD_FRIEND_URL = `https://line.me/R/ti/p/${OFFICIAL_LINE_BASIC_ID}`;

export function getOfficialLineAddFriendUrl(): string {
  return OFFICIAL_LINE_ADD_FRIEND_URL;
}

export function formatOfficialLineBasicId(): string {
  return OFFICIAL_LINE_BASIC_ID;
}
