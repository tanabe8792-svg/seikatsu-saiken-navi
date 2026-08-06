# 21. 継続利用 UX 設計書

## 目的

被災者が数週間〜数年の生活再建期間で継続的に使える伴走体験を提供する。通知アプリ化はしない。

## 被災者が毎回知りたい3つ

1. 今どうなっているか → `buildCurrentSituation` / SurvivorDashboard
2. 次に何をすればいいか → ヒーローカード「次に一緒に確認すること」
3. 前に進めているか → CaseTimeline 差分（`ContinuitySnapshot`）

## データ

- `UserSession.continuitySnapshot` のみ追加（CaseFile 変更なし）
- ActionQueue / KB / Trigger 非連携

```typescript
interface ContinuitySnapshot {
  capturedAt: string;
  timelineEventIds: string[];
  primaryProcedureId?: string;
  primaryProcedureStatus?: string;
  currentActionId?: string;
  completedActionCount: number;
}
```

## 保存タイミング

**「次に一緒に確認すること」カード操作時**（`completeCaseAction` / `submitActionEvidence`）に `buildContinuitySnapshot` で保存。

ホーム表示のみでは保存しない（開いただけで前回確認済み扱いにしない）。

## 表示（home-dashboard）

| ブロック | ソース |
|---------|--------|
| あなたの再建状況 | `getContinuityDashboard.sectionTitle` |
| 前回から確認できたこと | `computeChangesSinceSnapshot` |
| 現在 | SurvivorDashboard |
| 次に一緒に確認すること | SurvivorDashboard.nextAction |
| 確認しておく期限 | `formatContinuityDeadlineMessage`（overdue / due_soon / unknown のみ） |
| ここまで進んだこと | completedItems（changes と dedupe） |
| 確認が必要なこと | needsAttention（deadline kind 除外） |

## 期限文言

- `deadlines.ts` の `formatDeadlineDisplay` は変更しない
- 伴走用は `formatContinuityDeadlineMessage`（「あとN日」「過ぎています」禁止）

## 検証

```bash
npm run validate:continuity-ux
```
