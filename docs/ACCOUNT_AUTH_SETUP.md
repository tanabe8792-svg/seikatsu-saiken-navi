# マイページ登録 — セットアップ手順（ゆうさん向け）

| 項目 | 内容 |
|------|------|
| 目的 | マイページ登録（ユーザーのメール / ユーザーのLINEアカウント） |
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
  ├ あなたのメール → 登録用リンク → マイページ登録済み
  └ あなたのLINE   → LINEログイン → マイページ登録済み
                ↓
         Supabase Auth（サーバー）
                ↓
         進捗データをクラウドに保存（端末をまたいで引き継ぎ）
```

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

## ステップ3 — メール登録

1. Supabase **Authentication → Providers → Email** を **ON**
2. **Confirm email** を ON（メール確認を必須にする場合）
3. **Authentication → Email Templates** で「Magic Link」の文面を必要に応じて調整
4. Vercel で **Redeploy**

**動作確認:** アプリ → 設定 → マイページ登録 → メール入力 → 「登録用メールを送信」→ 届いたリンクをタップ

---

## ステップ4 — LINE 登録（任意）

> **LINE Login** チャネルを作成します（ユーザー自身のアカウントでログインする仕組みです）。

### 4-1. LINE Developers Console

1. https://developers.line.biz/console/ にログイン
2. プロバイダーを選択（なければ作成）
3. **Create a new channel** → **LINE Login**
4. チャネル名例: `生活再建ナビ ログイン`
5. **App types**: Web app にチェック
6. 作成後、**Basic settings** タブでメモ:
   - **Channel ID**
   - **Channel secret**

### 4-2. Callback URL（LINE側）

**LINE Login → Channel → LINE Login settings** で **Callback URL** に追加:

```
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

（Supabase ダッシュボード → Authentication → Providers → LINE に表示される Callback URL をそのままコピー）

### 4-3. Supabase 側

1. **Authentication → Providers → LINE** を **ON**
2. Channel ID / Channel Secret を貼り付け
3. Save
4. Vercel を Redeploy

**動作確認:** アプリ → 設定 → マイページ登録 → LINEで登録する

---

## チェックリスト

- [ ] Supabase プロジェクト URL を Vercel に設定した
- [ ] Supabase anon key を Vercel に設定した
- [ ] Redirect URL を Supabase に登録した
- [ ] Email provider を ON にした
- [ ] Vercel を Redeploy した
- [ ] （任意）LINE Login チャネルを作成し Supabase に接続した
