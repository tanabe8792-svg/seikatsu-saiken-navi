# 20 Onboarding UX 設計書

## 目的

被災者が安心して最初の一歩を踏み出せる **AI伴走サービス** としての初回導入体験。

- 情報検索アプリではない
- 行政書士向け導線ではない
- 「ここなら相談していい」という信用形成

## フロー

```
/ ホーム → /start
  → intro（安心導入）※ j00Step 途中再開時はスキップ
  → J-00 Step 1〜5（既存・変更なし）
  → initializeCase（既存）
  → / ホーム + 初回伴走メッセージ（1回）
  → 既存 survivor UX
```

## 実装

| ファイル | 役割 |
|----------|------|
| `onboarding-copy.ts` | 導入文・完了後メッセージ（pure） |
| `onboarding-intro.tsx` | 安心導入 UI |
| `start/page.tsx` | intro / hearing ゲート |
| `home-dashboard.tsx` | J-00 完了後 1 回メッセージ |
| `types.ts` | `showPostJ00Welcome`, `onboardingTimingHint` |
| `validation-onboarding.ts` | 体験品質検証 |

## UserSession 追加（表示専用）

```typescript
showPostJ00Welcome?: boolean;
onboardingTimingHint?: "acute" | "weeks" | "months" | "partial";
```

- **CaseFile 変更なし**
- **ActionQueue / KB / Trigger 非連携**

## onboardingTimingHint

- 導入画面の任意チップ
- 完了後メッセージのトーン微調整のみ
- ActionQueue 生成には渡さない

## 検証

```bash
cd app && npm run validate:onboarding
```

## 制約

- J-00 質問・5ステップ変更禁止
- git commit 禁止（作業指示時）
