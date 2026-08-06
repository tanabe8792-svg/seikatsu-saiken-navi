/**
 * 住まいと店舗の所在地を分けるための解決ヘルパー（表示・案内専用）
 */

import type { UserProfile } from "@/lib/types";
import {
  getMunicipalityByCode,
  resolveMunicipalityCode,
} from "@/lib/knowledge/municipalities";

/** 店舗・事業所の案内に使う市町村名（未設定なら住まい） */
export function resolveBusinessMunicipalityName(
  profile: UserProfile
): string {
  const raw =
    profile.businessMunicipality?.trim() ||
    profile.municipality?.trim() ||
    "";
  if (!raw) return "お住まいの地域";
  const code = resolveMunicipalityCode(raw);
  const m = code ? getMunicipalityByCode(code) : null;
  return m?.name ?? raw;
}

/** 住まいの市町村名 */
export function resolveHomeMunicipalityName(profile: UserProfile): string {
  const raw = profile.municipality?.trim() || "";
  if (!raw) return "お住まいの地域";
  const code = resolveMunicipalityCode(raw);
  const m = code ? getMunicipalityByCode(code) : null;
  return m?.name ?? raw;
}

export function isBusinessMunicipalitySameAsHome(
  profile: UserProfile
): boolean {
  if (!profile.businessMunicipality || !profile.municipality) return true;
  return (
    resolveBusinessMunicipalityName(profile) ===
    resolveHomeMunicipalityName(profile)
  );
}

/** 事業案内用に、店舗所在地を優先したプロフィール複製 */
export function profileForBusinessGuidance(
  profile: UserProfile
): UserProfile {
  const businessName = resolveBusinessMunicipalityName(profile);
  if (businessName === "お住まいの地域") return profile;
  return {
    ...profile,
    municipality: businessName,
  };
}
