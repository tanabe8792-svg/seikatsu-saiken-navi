# LINE登録のエラーを止める手順（ゆうさん向け）

マイページの登録は **LINE を本線** にします（メールは予備）。  
下の設定ができていれば、赤いエラーは止まります。

---

## いま起きていること（短く）

1. 利用者が「LINEでログイン・登録」を押す  
2. LINE の画面が開く  
3. 許可したあと、このナビに戻る  
4. **どこかで止まるとエラー**になる  

止まりやすい場所は、**(A) LINE側の戻り先URL** と **(B) Supabase の LINE 設定** です。

---

## 手順1 — LINE Developers

1. https://developers.line.biz/console/ を開く  
2. プロバイダー → **LINE Login** チャネル（生活再建ナビ用）を開く  
3. **LINE Login** 設定タブ  
4. **Callback URL** に、次を**そのまま**入れる  

```
https://sxhpjkhxzjwhjpbdltqx.supabase.co/auth/v1/callback
```

（Supabase の Authentication → Sign In / Providers → LINE に出る Callback URL と同じ）

5. **保存**

---

## 手順2 — Supabase の LINE

1. https://supabase.com/dashboard/project/sxhpjkhxzjwhjpbdltqx を開く  
2. **Authentication** → **Sign In / Providers**  
3. **LINE** を探す（または Custom providers の `line`）  
4. **Enable** を ON  
5. LINE の **Channel ID** / **Channel secret** を貼る  
6. **メールがなくても登録できる**（Allow users without an email など）を **ON**  
   ※ LINE はメールを持たない人が多いです  
7. Save  

---

## 手順3 — 戻り先URL（アプリ側）

1. Authentication → **URL Configuration**  
2. **Site URL**  
   `https://seikatsu-saiken-navi.vercel.app`  
3. **Redirect URLs** に次があること  
   - `https://seikatsu-saiken-navi.vercel.app/auth/callback`  
   - `http://localhost:3000/auth/callback`（開発用）

---

## 手順4 — アプリで確認

1. https://seikatsu-saiken-navi.vercel.app/mypage  
2. **LINEでログイン・登録** を押す  
3. LINE で許可 → マイページに戻る → 「ログイン中」になれば完了  

---

## よくある勘違い

| 勘違い | 実際 |
|--------|------|
| メールのエラーと同じ？ | いいえ。LINE は別ルートです |
| アプリのボタンを直せば全部直る？ | 画面は直せますが、**Callback URL と Provider ON** が本体です |
| LINE のメッセージ通知？ | いいえ。ログインだけです。友だち追加は不要です |

---

## チェックリスト

- [ ] LINE Login の Callback URL が Supabase の `/auth/v1/callback`  
- [ ] Supabase で LINE（または custom:line）が ON  
- [ ] メールなしユーザーを許可している  
- [ ] Site URL / Redirect URLs が本番になっている  
- [ ] マイページから LINE ログインできる  

わからない画面があったら、そのスクショを送ってください。
