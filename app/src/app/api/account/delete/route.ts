import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * ログイン中ユーザーのアカウント削除（サーバー側）。
 * SUPABASE_SERVICE_ROLE_KEY が無い場合は 501（端末データの消去はクライアントで実施）。
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(ip);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "しばらく時間をおいてから、もう一度お試しください。" },
      { status: 429 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "認証の準備ができていません。" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    return NextResponse.json(
      { error: "ログインし直してから、もう一度お試しください。" },
      { status: 401 }
    );
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json(
      { error: "ログイン状態を確認できませんでした。" },
      { status: 401 }
    );
  }

  if (!serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        localOnly: true,
        error:
          "サーバー側のアカウント削除はまだ準備中です。端末のデータ消去とログアウトは進みます。",
      },
      { status: 501 }
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: deleteError } = await admin.auth.admin.deleteUser(
    userData.user.id
  );
  if (deleteError) {
    console.error("[account/delete]", deleteError);
    return NextResponse.json(
      { error: "アカウントの削除に失敗しました。時間をおいてお試しください。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
