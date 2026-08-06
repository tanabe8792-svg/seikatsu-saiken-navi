# 生活再建ナビ — アーキテクチャレビュー記録

最終レビュー: 2026-08-05

## 修正済み（レビュー反映）

- Supabase クライアントの import パス不整合（ビルドエラー）
- ページ間でセッション状態が共有されない問題（SessionProvider 導入）
- チャット送信時の stale state / 二重永続化
- OpenAI API 入力バリデーション不足
- Supabase ローカル/リモートの盲目上書き
- 手続き詳細の Client Component + notFound 混在
- 未使用コード・依存の整理

## 残課題（Phase 2）

- レートリミット（Redis / Upstash）
- 認証（メールログイン）
- ユニットテスト / E2E
- CI パイプライン
