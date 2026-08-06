# メール／LINE 本人確認 — セットアップ手順（ゆうさん向け）

| 項目 | 内容 |
|------|------|
| 目的 | マイページ登録＝**本人確認**（通知配信ではない） |
| 公式LINE ID | `@272pshvm`（友だち追加とは別に **LINE Login** が必要） |

---

## 全体像

```
ユーザー
  ├ メール → 確認メールのリンク → 本人確認済み
  └ LINE   → LINEログイン画面   → 本人確認済み
                ↓
         Supabase Auth（サーバー）
                ↓
         進捗データをクラウドに保存（端末をまたいで引き継ぎ）
```

**Messaging API（メッセージ配信）は不要**です。LINE Login チャネルだけ作ればOKです。

---

## ステップ1 — Supabase プロジェクト

1. https://supabase.com/dashboard でプロジェクトを開く（なければ新規作成）
2. **Project Settings → API** から以下をコピー
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Vercel → プロジェクト → **Settings → Environment Variables** に上記2つを追加
4. **Authentication → URL Configuration**
   - Site URL: `https://seikatsu-saiken-navi.vercel.app`
   - Redirect URLs に追加:
     - `https://seikatsu-saiken-navi.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`（ローカル開発用）

---

## ステップ2 — データベース

Supabase **SQL Editor** で `/database/supabase-schema.sql` を実行（未実行の場合）。

続けて `/database/supabase-schema-auth-extension.sql` も実行（進捗の引き継ぎ用カラム追加）。

**Authentication → Providers → Anonymous sign-ins** を **ON**（端末内保存との併用のため）。

---

## ステップ3 — メール本人確認

1. Supabase **Authentication → Providers → Email** を **ON**
2. **Confirm email** を ON（確認メール必須にする場合）
3. **Authentication → Email Templates** で「Magic Link」の文面を必要に応じて調整
4. 独自ドメインのメール送信を使う場合は Supabase の SMTP 設定（任意）

**動作確認:** アプリ → 設定 → マイページ登録 → メール入力 → 届いたリンクをタップ

---

## ステップ4 — LINE Login（本人確認用）

> ⚠️ **Messaging API チャネル ≠ LINE Login チャネル**  
> 公式アカウント `@272pshvm` とは別に、または紐づけて **LINE Login** チャネルを作成します。

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

**動作確認:** アプリ → 設定 → マイページ登録 → LINEでログイン

---

## ステップ5 — Vercel 再デプロイ

環境変数を追加・変更したら **Redeploy** してください。

---

## よくあるつまずき

| 症状 | 確認すること |
|------|----------------|
| 「認証の設定が完了していません」 | Supabase の URL / anon key が Vercel に入っているか |
| メールが届かない | Supabase の Email provider、迷惑メールフォルダ |
| LINEログインが始まらない | Supabase で LINE provider ON、Callback URL 一致 |
| ログイン後に進捗が消える | SQL extension 実行済みか、同じメール/LINEで再ログイン |

---

## 公式LINE（@272pshvm）との関係

| 機能 | 必要なもの |
|------|-----------|
| 友だち追加リンク | 公式アカウント Basic ID だけ（済） |
| **本人確認ログイン** | LINE **Login** チャネル + Supabase |
| プッシュ通知配信 | Messaging API（**今回は不要**） |

---

## チェックリスト

- [ ] Supabase プロジェクト URL を Vercel に設定した
- [ ] Supabase anon key を Vercel に設定した
- [ ] Redirect URL を Supabase に登録した
- [ ] LINE Login チャネルを作成した
- [ ] Supabase の LINE provider を ON にした
