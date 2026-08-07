# マイページ登録 — セットアップ手順（ゆうさん向け）

| 項目 | 内容 |
|------|------|
| 目的 | マイページ登録（本線: LINE / 予備: メール） |
| 配信 | メッセージ配信は行いません |

---

## なぜボタンが押せない／メールが届かないか

アプリは **Supabase Auth** でメール登録リンクを送ります。  
Vercel に次の2つが入っていないと、送信できません。

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

この2つを入れたあと、**必ず Redeploy** してください。

---

## 全体像

```
ユーザー
  └ あなたのLINE   → LINEログイン → マイページ登録済み
  （予備）メール → 登録用リンク → マイページ登録済み
                ↓
         Supabase Auth（サーバー）
                ↓
         進捗データをクラウドに保存（端末をまたいで引き継ぎ）
```

くわしい LINE の直し方は **`docs/LINE登録を直す手順.md`** を見てください。

---

## ステップ1 — Supabase プロジェクト

1. https://supabase.com/dashboard でプロジェクトを開く（なければ新規作成）
2. **Project Settings → API** から以下をコピー
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Vercel → プロジェクト → **Settings → Environment Variables** に上記2つを追加（Production / Preview 両方）
4. **Authentication → URL Configuration**
   - Site URL: `https://seikatsu-saiken-navi.vercel.app`
   - Redirect URLs に追加:
     - `https://seikatsu-saiken-navi.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`（ローカル開発用）

---

## ステップ2 — データベース

Supabase **SQL Editor** で `/database/supabase-schema.sql` を実行（未実行の場合）。

続けて `/database/supabase-schema-auth-extension.sql` も実行（進捗の引き継ぎ用カラム追加）。

**ケース共有（家族招待）を使う場合**は、続けて `/database/supabase-schema-cases.sql` も実行してください。

**Authentication → Providers → Anonymous sign-ins** を **ON**（端末内保存との併用のため）。

---

## ステップ3 — LINE 登録（本線）

くわしい手順は **`docs/LINE登録を直す手順.md`** を見てください。

要点だけ：

1. LINE Developers で **LINE Login** チャネルを作る  
2. Callback URL に Supabase の `/auth/v1/callback` を入れる  
3. Supabase → Authentication → Providers → **LINE** を ON（Channel ID / Secret）  
4. **メールがなくても登録できる** を ON  
5. Site URL / Redirect URL を本番に合わせる  
6. マイページから「LINEでログイン・登録」を試す  

---

## ステップ4 — メール登録（予備）

くわしい手順は **`docs/登録メールエラーを止める手順.md`** を見てください。

メールはドメイン認証などが必要なため、**本線は LINE** です。

---

## チェックリスト

- [ ] Supabase プロジェクト URL を Vercel に設定した
- [ ] Supabase anon key を Vercel に設定した
- [ ] Redirect URL を Supabase に登録した
- [ ] LINE Login チャネルを作成し Supabase に接続した
- [ ] メールなしユーザーを許可した
- [ ] Vercel を Redeploy した
- [ ] （予備）Email / SMTP を設定した
