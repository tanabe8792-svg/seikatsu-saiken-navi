# 生活再建ナビ — Webアプリ（MVP）

災害被災者向けの「災害後の行動OS」。AI相談で状況を整理し、やることリストと手続き詳細を案内します。

## 起動方法

```bash
cd app
npm install
cp .env.example .env.local   # 必要に応じて API キーを設定
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

**API キーなしでも起動可能です。** OpenAI / Supabase 未設定時はフォールバック動作します。

## 機能（MVP）

| 機能 | パス | 説明 |
|------|------|------|
| トップ | `/` | サービス概要・「はじめる」 |
| AI相談 | `/chat` | 状況を入力し、やることを整理 |
| 行動リスト | `/actions` | チェックリスト形式の進捗管理 |
| 手続き詳細 | `/actions/[id]` | 必要書類・提出先・期限・注意事項 |
| マイページ | `/mypage` | プロフィール・進捗の保存 |

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui 相当コンポーネント
- Supabase（任意）
- OpenAI API（任意）
- Vercel デプロイ想定

## 環境変数

`.env.local` に設定:

```env
OPENAI_API_KEY=sk-...                    # AI相談（未設定時はルールベース）
NEXT_PUBLIC_SUPABASE_URL=https://...     # マイページ永続化（任意）
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # マイページ永続化（任意）
```

## Supabase セットアップ（任意）

1. Supabase プロジェクトを作成
2. `../database/supabase-schema.sql` を SQL Editor で実行
3. Authentication > Anonymous sign-ins を有効化
4. `.env.local` に URL / anon key を設定

## ディレクトリ構成

```
app/
├── src/
│   ├── app/              # ページ・API Routes
│   ├── actions/          # Server Actions
│   ├── components/       # UI・レイアウト
│   ├── hooks/            # クライアントフック
│   └── lib/              # 型・データ・ユーティリティ
├── .env.example
└── package.json
```

## デプロイ（Vercel）

詳しいクリック手順・役割分担はリポジトリの  
[`docs/RELEASE_ベータ公開手順.md`](../docs/RELEASE_ベータ公開手順.md) を参照。

最短:

1. GitHub にこのリポジトリを置く
2. [vercel.com](https://vercel.com) で Import（**Root Directory = `app`**）
3. 環境変数は空でも可 → Deploy
4. 発行された `*.vercel.app` URL を動画・共有に使う

## 注意

- 本サービスは参考情報の提供です。最新情報は自治体等の公式情報をご確認ください。
- 個別の被災相談・法的助言は提供しません。
- ベータ版です。メール／LINE の実通知・確認メールは順次対応予定です。
