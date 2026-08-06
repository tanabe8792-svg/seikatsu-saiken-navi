"use server";

import type { UserProfile, UserSession } from "@/lib/types";

export async function validateProfile(profile: UserProfile): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (profile.householdSize !== undefined && profile.householdSize < 1) {
    errors.push("世帯人数は1以上で入力してください");
  }

  if (profile.address && profile.address.length > 200) {
    errors.push("住所は200文字以内で入力してください");
  }

  return { valid: errors.length === 0, errors };
}

export async function getSessionSummary(session: UserSession): Promise<{
  totalActions: number;
  completedActions: number;
  progressPercent: number;
}> {
  const totalActions = session.actions.length;
  const completedActions = session.actions.filter((a) => a.completed).length;
  const progressPercent = totalActions
    ? Math.round((completedActions / totalActions) * 100)
    : 0;

  return { totalActions, completedActions, progressPercent };
}
