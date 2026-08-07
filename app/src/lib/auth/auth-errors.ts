/**
 * 認証エラーを利用者向けのやさしい日本語に変換する。
 * 英語の生メッセージをそのまま画面に出さない。
 */

export interface UserFacingAuthError {
  /** 短い見出し */
  title: string;
  /** 想定される原因 */
  cause: string;
  /** 利用者が取れる対処 */
  actions: string[];
}

function normalize(raw: string): string {
  return raw.trim().toLowerCase();
}

export function explainAuthError(rawMessage: string): UserFacingAuthError {
  const msg = normalize(rawMessage);

  if (
    /error sending confirmation (email|mail)|unable to send|smtp|mail\.send|email.*fail|failed to send/i.test(
      rawMessage
    ) ||
    msg.includes("confirmation email") ||
    msg.includes("confirmation mail")
  ) {
    return {
      title: "登録用メールを送れませんでした",
      cause:
        "メール送信の途中で止まった可能性があります（送信設定の不具合、一時的な通信障害、送りすぎの制限など）。",
      actions: [
        "1〜2分待ってから、もう一度「登録用メールを送信」を押してください。",
        "メールアドレスの打ち間違いがないか確認してください。",
        "それでも届かないときは、下の「LINE」で登録を試してください。",
        "状況の入力や進捗は、この端末に残ったままです。登録できなくても案内は使えます。",
      ],
    };
  }

  if (/rate.?limit|too many|over.?quota|429/.test(msg)) {
    return {
      title: "しばらく待ってから、もう一度お試しください",
      cause: "短時間に何度も送ったため、一時的に制限がかかっている可能性があります。",
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
      cause: "登録メールのリンク先が、いまのサイト設定と合っていない可能性があります。",
      actions: [
        "時間をおいてもう一度試してください。",
        "直らないときは LINE での登録を試すか、改善の声からお知らせください。",
      ],
    };
  }

  if (
    /supabase|vercel|env|smtp|管理者|docs\/|authapierror|internal server|500|503/.test(
      msg
    )
  ) {
    return {
      title: "いまはログインできませんでした",
      cause: "サービスの準備側で一時的な不具合が起きている可能性があります。",
      actions: [
        "時間をおいて、もう一度お試しください。",
        "LINE での登録も選べます。",
        "状況の入力や進捗は端末に残っています。",
      ],
    };
  }

  // すでに日本語で書かれた案内はそのまま見出しに使う
  if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(rawMessage) && rawMessage.length < 120) {
    return {
      title: rawMessage,
      cause: "登録・ログインの処理で問題が起きました。",
      actions: [
        "時間をおいて、もう一度お試しください。",
        "うまくいかないときは LINE での登録を試してください。",
        "進捗はこの端末に残っています。",
      ],
    };
  }

  return {
    title: "登録・ログインできませんでした",
    cause: "原因を特定できませんでしたが、通信やメール送信の途中で止まった可能性があります。",
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
