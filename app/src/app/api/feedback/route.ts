import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_LEN = {
  message: 4000,
  steps: 2000,
  device: 400,
  contact: 200,
} as const;

type FeedbackKind = "improvement" | "support";

function trimField(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

async function sendViaResend(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true; id: string } | { ok: false; detail: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, detail: "RESEND_API_KEY missing" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "生活再建ナビ <onboarding@resend.dev>";

  try {
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
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };
    if (!res.ok || !data.id) {
      console.error("[feedback] Resend failed", res.status, data);
      return {
        ok: false,
        detail: data.message || data.name || `status ${res.status}`,
      };
    }
    return { ok: true, id: data.id };
  } catch (error) {
    console.error("[feedback] Resend exception", error);
    return { ok: false, detail: "resend exception" };
  }
}

/** FormSubmit（Resend 未設定時の予備） */
async function sendViaFormSubmit(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  try {
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
        _captcha: "false",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };
    const ok =
      res.ok &&
      (data.success === true ||
        data.success === "true" ||
        typeof data.message === "string");
    if (!ok) {
      console.error("[feedback] FormSubmit failed", res.status, data);
    }
    return ok;
  } catch (error) {
    console.error("[feedback] FormSubmit exception", error);
    return false;
  }
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
      console.error("[feedback] TRUST_FEEDBACK_EMAIL is not set");
      return NextResponse.json(
        {
          error:
            "送信の準備がまだです。開発者側のメール設定が完了するまで、しばらくお待ちください。",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const kindRaw = trimField(body.kind, 32);
    const kind: FeedbackKind =
      kindRaw === "support" ? "support" : "improvement";
    const message = trimField(body.message, MAX_LEN.message);
    const steps = trimField(body.steps, MAX_LEN.steps);
    const device = trimField(body.device, MAX_LEN.device);
    const contact = trimField(body.contact, MAX_LEN.contact);

    if (message.length < 5) {
      return NextResponse.json(
        { error: "内容を少し詳しく書いてください。" },
        { status: 400 }
      );
    }

    const subject =
      kind === "support"
        ? "【生活再建ナビ】応援・ご連絡"
        : "【生活再建ナビ】改善のご意見";

    const text = [
      kind === "support"
        ? "生活再建ナビへの応援・ご連絡です。"
        : "生活再建ナビへの改善のご意見です。",
      "",
      kind === "support" ? "【メッセージ】" : "【気になったこと】",
      message,
      "",
      ...(kind === "improvement"
        ? [
            "【再現のしかた】",
            steps || "（未記入）",
            "",
            "【端末・ブラウザ】",
            device || "（未記入）",
            "",
          ]
        : []),
      "【返信先（任意）】",
      contact || "（未記入）",
      "",
      `受信時刻: ${new Date().toISOString()}`,
    ].join("\n");

    const resend = await sendViaResend({ to, subject, text });
    if (resend.ok) {
      return NextResponse.json({ ok: true, delivered: true });
    }

    // Resend が無い／失敗したときだけ予備経路
    const formOk = await sendViaFormSubmit({ to, subject, text });
    if (formOk) {
      return NextResponse.json({ ok: true, delivered: true });
    }

    console.error("[feedback] all channels failed", resend.detail);
    return NextResponse.json(
      {
        error:
          "送信に失敗しました。時間をおいて再度お試しいただくか、しばらくしてからもう一度お試しください。",
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("[feedback] unexpected", error);
    return NextResponse.json(
      { error: "送信に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
