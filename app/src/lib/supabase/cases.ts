"use client";

import type { CaseFile } from "@/lib/case-management/types";
import {
  normalizeInviteCode,
  type AcceptedInviteResult,
  type CaseAccessLevel,
  type CaseMembershipSummary,
} from "@/lib/case-management/case-sharing";
import { getSupabaseBrowserClient } from "./browser";
import { isSupabaseConfigured } from "./config";

function mapRpcError(message: string): string {
  if (/LOGIN_REQUIRED/i.test(message)) {
    return "ログインが必要です。メールまたはLINEでログインしてください。";
  }
  if (/OWNER_ONLY/i.test(message)) {
    return "案内の続きを家族に渡せるのは、はじめに記録を始めた人だけです。";
  }
  if (/CASE_OWNED_BY_OTHER/i.test(message)) {
    return "この記録は、すでに別の方がはじめたものです。";
  }
  if (/INVITE_NOT_FOUND/i.test(message)) {
    return "招待コードが見つかりません。コードを確認してください。";
  }
  if (/INVITE_EXPIRED|INVITE_REVOKED|INVITE_EXHAUSTED/i.test(message)) {
    return "この招待は使えなくなっています。家族に新しい招待を送ってもらってください。";
  }
  if (/ALREADY_OWNER/i.test(message)) {
    return "あなたがはじめに記録を始めた人です。";
  }
  if (/EDIT_FORBIDDEN/i.test(message)) {
    return "この記録の書きかえは許可されていません。「見るだけ」の招待の場合は、家族に「書きかえもできる」招待を送ってもらってください。";
  }
  if (/schema cache|does not exist|function .* not found/i.test(message)) {
    return "ただいま家族への共有機能の準備中です。しばらくしてから、もう一度お試しください。";
  }
  return "操作に失敗しました。時間をおいて、もう一度お試しください。";
}

export async function publishOwnedCase(params: {
  publicCaseId: string;
  internalCaseId: string;
  caseFile: CaseFile;
  municipalityCode?: string;
}): Promise<{ ok: true; caseId: string } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "ただいま共有機能の準備中です。しばらくしてからお試しください。",
    };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "接続できませんでした。" };
  }

  const { data, error } = await supabase.rpc("publish_owned_case", {
    p_public_case_id: params.publicCaseId,
    p_internal_case_id: params.internalCaseId,
    p_case_file: params.caseFile,
    p_municipality_code: params.municipalityCode ?? null,
  });

  if (error) {
    return { ok: false, message: mapRpcError(error.message) };
  }
  return { ok: true, caseId: String(data) };
}

export async function createFamilyInvite(params: {
  caseId: string;
  accessLevel: CaseAccessLevel;
  daysValid?: number;
}): Promise<
  | { ok: true; inviteCode: string; expiresAt: string | null; caseId: string }
  | { ok: false; message: string }
> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "接続できませんでした。" };
  }

  const { data, error } = await supabase.rpc("create_family_invite", {
    p_case_id: params.caseId,
    p_access_level: params.accessLevel,
    p_days_valid: params.daysValid ?? 14,
  });

  if (error) {
    return { ok: false, message: mapRpcError(error.message) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.invite_code) {
    return { ok: false, message: "招待コードを発行できませんでした。" };
  }

  return {
    ok: true,
    inviteCode: String(row.invite_code),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    caseId: String(row.case_id ?? params.caseId),
  };
}

export async function acceptFamilyInvite(
  inviteCode: string
): Promise<
  { ok: true; result: AcceptedInviteResult } | { ok: false; message: string }
> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "接続できませんでした。" };
  }

  const { data, error } = await supabase.rpc("accept_family_invite", {
    p_invite_code: normalizeInviteCode(inviteCode),
  });

  if (error) {
    return { ok: false, message: mapRpcError(error.message) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.case_id) {
    return { ok: false, message: "招待の受け取りに失敗しました。" };
  }

  return {
    ok: true,
    result: {
      caseId: String(row.case_id),
      publicCaseId: String(row.public_case_id),
      accessLevel: row.access_level === "edit" ? "edit" : "view",
      role: String(row.role ?? "family"),
      caseFile: row.case_file,
    },
  };
}

export async function listMyCaseMemberships(): Promise<
  { ok: true; items: CaseMembershipSummary[] } | { ok: false; message: string }
> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "接続できませんでした。" };
  }

  const { data, error } = await supabase.rpc("list_my_case_memberships");
  if (error) {
    return { ok: false, message: mapRpcError(error.message) };
  }

  const rows = Array.isArray(data) ? data : [];
  return {
    ok: true,
    items: rows.map((row) => ({
      caseId: String(row.case_id),
      publicCaseId: String(row.public_case_id),
      role: String(row.role),
      accessLevel: row.access_level === "edit" ? "edit" : "view",
      caseStatus: row.case_status ? String(row.case_status) : undefined,
      updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    })),
  };
}

export async function getCaseByPublicId(publicCaseId: string): Promise<
  | {
      ok: true;
      found: true;
      caseId: string;
      publicCaseId: string;
      role: string;
      accessLevel: CaseAccessLevel;
      caseStatus?: string;
      caseFile: unknown;
      updatedAt?: string;
    }
  | { ok: true; found: false }
  | { ok: false; message: string }
> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "接続できませんでした。" };
  }

  const { data, error } = await supabase.rpc("get_case_by_public_id", {
    p_public_case_id: publicCaseId.trim().toUpperCase(),
  });

  if (error) {
    return { ok: false, message: mapRpcError(error.message) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.case_id) {
    return { ok: true, found: false };
  }

  return {
    ok: true,
    found: true,
    caseId: String(row.case_id),
    publicCaseId: String(row.public_case_id),
    role: String(row.role),
    accessLevel: row.access_level === "edit" ? "edit" : "view",
    caseStatus: row.case_status ? String(row.case_status) : undefined,
    caseFile: row.case_file,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export async function updateSharedCaseFile(
  caseId: string,
  caseFile: CaseFile
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "接続できませんでした。" };
  }

  const { error } = await supabase.rpc("update_shared_case_file", {
    p_case_id: caseId,
    p_case_file: caseFile,
  });

  if (error) {
    return { ok: false, message: mapRpcError(error.message) };
  }
  return { ok: true };
}
