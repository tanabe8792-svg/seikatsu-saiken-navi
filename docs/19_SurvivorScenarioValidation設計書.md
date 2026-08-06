# 19 Survivor Scenario Validation 設計書

## 目的

機能が動くかではなく、**被災者本人の体験品質**を検証する。

- 迷わない
- 次に進める
- 不安が軽減される

行政書士向け SaaS 検証ではない。

## 位置づけ

既存 `validate:survivor-ux`（伴走 UI 単体）を補完し、  
**Case1 / Case4 / Case6 Recovery のシナリオ通し**で体験を検証する。

```
validate:survivor-scenarios  ← 本設計（シナリオ・体験品質）
validate:survivor-ux         ← 伴走 UI 文言・4項目（既存・不変）
validate:timeline          ← Timeline 派生（既存・不変）
...
```

## 検証ケース

### Case1 — 宇城市・半壊・Recovery

| フェーズ | 期待 |
|----------|------|
| 開始 | 生活再建フェーズ表示、「次に一緒に確認すること」存在 |
| 写真後 | 罹災証明準備へ自然誘導、completedItems + progressReassurance |
| 罹災証明後 | 生活再建支援制度への流れが見える、手続き preparing |

### Case4 — ローンあり・Recovery

| フェーズ | 期待 |
|----------|------|
| 開始〜罹災証明後 | ローン関連支援が表示される |
| 説明 | 罹災証明と支援の関係が理解できる |
| 判断 | なぜ案内されているか説明可能 |

### Case6 — 自営業・Recovery

| フェーズ | 期待 |
|----------|------|
| 開始 | 事業再建 Action が伴走表示 |
| 事業復旧後 | 事業支援手続き preparing、次ステップ可視 |
| 推測禁止 | 確認不可制度を推測表示しない |

## UX品質チェック（全フェーズ共通）

| # | 内容 |
|---|------|
| 1 | nextAction あり → friendlyReason または companionHeadline あり |
| 2 | currentSituation 非空 |
| 3 | completedItems あり → progressReassurance あり |
| 4 | needsAttention.kind ∈ {deadline, waiting, preparation} |
| 5 | 被災者向け文字列に内部用語なし（Procedure/Evidence/Trigger 等） |
| 6 | DecisionExplanation で「なぜこの案内か」説明可能 |

## 禁止 / 許可文言

**禁止:** Procedure, Evidence, Trigger, CaseDecision, 証跡, KB, ActionQueue

**許可:** 手続き, 準備, 確認, 次に進む（伴走表現）

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `validation-survivor-scenarios.ts` | シナリオ + UX品質検証 |
| `run-validation-survivor-scenarios.ts` | CLI |

## 実行

```bash
cd app && npm run validate:survivor-scenarios
```

## 制約

- 既存 validate:* 変更禁止
- UI / CaseFile / Action 生成 / KB / Trigger 変更禁止
- 追加検証のみ
