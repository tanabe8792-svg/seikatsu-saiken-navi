import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_LEN = {
  message: 4000,
  steps: 2000,
  device: 400,
  contact: 200,
} as const;

function trimField(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

async function sendViaResend(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "生活再建ナビ <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
    }),
  });
  return res.ok;
}

/** 宛先メールはサーバー環境変数のみ。クライアントには出さない */
async function sendViaFormSubmit(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const res = await fetch(`https://formsubmit.co/ajax/${params.to}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: params.subject,
      message: params.text,
      _template: "box",
    }),
  });
  return res.ok;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`feedback:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "送信が多すぎます。しばらく待ってから再度お試しください。" },
        { status: 429 }
      );
    }

    const to = process.env.TRUST_FEEDBACK_EMAIL?.trim();
    if (!to) {
      return NextResponse.json(
        { error: "送信の準備がまだです。しばらくしてからお試しください。" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const message = trimField(body.message, MAX_LEN.message);
    const steps = trimField(body.steps, MAX_LEN.steps);
    const device = trimField(body.device, MAX_LEN.device);
    const contact = trimField(body.contact, MAX_LEN.contact);

    if (message.length < 5) {
      return NextResponse.json(
        { error: "ご意見を少し詳しく書いてください。" },
        { status: 400 }
      );
    }

    const subject = "【生活再建ナビ】改善のご意見";
    const text = [
      "生活再建ナビへの改善のご意見です。",
      "",
      "【気になったこと】",
      message,
      "",
      "【再現のしかた】",
      steps || "（未記入）",
      "",
      "【端末・ブラウザ】",
      device || "（未記入）",
      "",
      "【返信先（任意）】",
      contact || "（未記入）",
      "",
      `受信時刻: ${new Date().toISOString()}`,
    ].join("\n");

    const sentResend = await sendViaResend({ to, subject, text });
    const sent =
      sentResend || (await sendViaFormSubmit({ to, subject, text }));

    if (!sent) {
      return NextResponse.json(
        { error: "送信に失敗しました。時間をおいて再度お試しください。" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "送信に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
