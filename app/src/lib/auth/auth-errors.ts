/**
 * 認証エラーを利用者向けのやさしい日本語に変換する。
 * 英語の生メッセージをそのまま画面に出さない。
 *
 * 注意: signInWithOtp は「新規登録」も「既存ログイン」も同じメール送信です。
 * 「Error sending confirmation email」は、多くの場合「すでに登録済み」ではなく
 * Supabase 側のメール送信失敗（SMTP・送信上限など）です。
 */

export interface UserFacingAuthError {
  /** 短い見出し */
  title: string;
  /** 想定される原因 */
  cause: string;
  /** 利用者が取れる対処 */
  actions: string[];
}

export interface AuthErrorExtras {
  status?: number;
  code?: string;
}

function normalize(raw: string): string {
  return raw.trim().toLowerCase();
}

export function explainAuthError(
  rawMessage: string,
  extras?: AuthErrorExtras
): UserFacingAuthError {
  const msg = normalize(rawMessage);
  const status = extras?.status;
  const code = (extras?.code ?? "").toLowerCase();

  // すでに案内済みの見出しが再入力された場合も、同じ内容を返す（二重変換対策）
  if (
    /error sending confirmation (email|mail)|unable to send|smtp|mail\.send|email.*fail|failed to send|登録用メールを送れませんでした|いまメールを送れませんでした/i.test(
      rawMessage
    ) ||
    msg.includes("confirmation email") ||
    msg.includes("confirmation mail") ||
    code.includes("email") && status === 500
  ) {
    return {
      title: "いまメールを送れませんでした",
      cause:
        "メールを送る準備がまだ整っていないか、一時的に送れない状態です。",
      actions: [
        "1〜2分待ってから、もう一度送ってください。",
        "急ぐときは下の「LINEで登録・ログインを試す」を使ってください。",
        "やることの進捗は、この端末に残っています。",
      ],
    };
  }

  if (
    /user already|already registered|already been registered|email.*exists|already exists/i.test(
      rawMessage
    ) ||
    code.includes("user_already_exists")
  ) {
    return {
      title: "このメールでは、届いたリンクから続けられます",
      cause:
        "同じメールで登録したことがある場合でも、届いたメールのリンクを開けば続けられます。",
      actions: [
        "もう一度メールを送り、届いたリンクを開いてください。",
        "メールが来ないときは LINE でのログインも試せます。",
        "この端末の進捗は残っています。",
      ],
    };
  }

  if (
    /rate.?limit|too many|over.?quota|429|email_rate_limit/i.test(msg) ||
    status === 429
  ) {
    return {
      title: "しばらく待ってから、もう一度お試しください",
      cause:
        "短時間に何度も送ったため、送信制限がかかっている可能性があります。",
      actions: [
        "5分ほど待ってから、もう一度送ってください。",
        "急ぐときは LINE での登録を試してください。",
      ],
    };
  }

  if (/network|fetch|failed to fetch|offline|timeout|timed out/.test(msg)) {
    return {
      title: "通信が不安定なため、送れませんでした",
      cause: "ネット接続が切れているか、一時的につながりにくい状態です。",
      actions: [
        "Wi-Fi やモバイル通信を確認してから、もう一度お試しください。",
        "オフラインでも、入力した状況はこの端末に残ります。",
      ],
    };
  }

  if (/invalid.*email|email.*invalid|形式/.test(msg)) {
    return {
      title: "メールアドレスを確認してください",
      cause: "メールアドレスの形が正しくないか、使えない可能性があります。",
      actions: [
        "半角英数字で、もう一度入力してください。",
        "別のメールアドレスや LINE での登録も試せます。",
      ],
    };
  }

  if (/redirect|redirect_uri|callback|site url|allow.?list/.test(msg)) {
    return {
      title: "ログインの戻り先設定に問題があります",
      cause:
        "登録メールのリンク先が、サイト設定と合っていない可能性があります（運営側の設定）。",
      actions: [
        "時間をおいてもう一度試してください。",
        "直らないときは LINE での登録を試すか、改善の声からお知らせください。",
      ],
    };
  }

  if (
    /supabase|vercel|env|管理者|docs\/|authapierror|internal server|500|503/.test(
      msg
    ) ||
    status === 500 ||
    status === 503
  ) {
    return {
      title: "いまはログインできませんでした",
      cause:
        "サービスの準備側（認証サーバー）で一時的な不具合が起きている可能性があります。",
      actions: [
        "時間をおいて、もう一度お試しください。",
        "LINE での登録も選べます。",
        "状況の入力や進捗は端末に残っています。",
      ],
    };
  }

  // 日本語の短い案内はそのまま見出しに（原因はぼかさない）
  if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(rawMessage) && rawMessage.length < 120) {
    return {
      title: rawMessage,
      cause:
        "登録・ログインの途中で止まった可能性があります。すでに登録済みかどうかは、このメッセージだけでは判断できません。",
      actions: [
        "時間をおいて、もう一度お試しください。",
        "うまくいかないときは LINE での登録を試してください。",
        "進捗はこの端末に残っています。",
      ],
    };
  }

  return {
    title: "登録・ログインできませんでした",
    cause:
      "原因を特定できませんでしたが、通信やメール送信の途中で止まった可能性があります。すでに登録済みだけが原因とは限りません。",
    actions: [
      "時間をおいて、もう一度お試しください。",
      "メールが届かないときは、迷惑メールフォルダも確認してください。",
      "LINE での登録も試せます。進捗はこの端末に残っています。",
    ],
  };
}

/** 一行だけ必要なときの要約（トースト等） */
export function summarizeAuthError(rawMessage: string): string {
  return explainAuthError(rawMessage).title;
}
