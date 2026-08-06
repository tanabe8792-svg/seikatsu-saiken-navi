# 15 Deadline Management 設計書

被災者ケースにおける **制度申請期限** の KB 定義と Case インスタンス管理。Phase 1 MVP。

- **関連:** docs/09 KB / docs/11 Case Management / docs/13 Procedure Tracking / docs/16 Recovery Phase
- **実装（KB）:** `app/src/lib/knowledge/program-deadlines.ts`
- **実装（Case）:** `app/src/lib/case-management/deadlines.ts`
- **UI:** `app/src/components/home/home-dashboard.tsx`（最優先1件表示のみ）
- **検証:** `npm run validate:deadlines`

---

## 1. 目的

| 課題 | 方針 |
|------|------|
| 支援制度には申請期限がある | KB に **出典付きテンプレート** のみ保持 |
| 期限日が告示前・未確認 | 推測せず `status: unknown` |
| Action と手続きが別 | Procedure 生成・更新タイミングで CaseDeadline を生成 |
| 期限が近い Action を優先 | Recovery Mode のみ ActionQueue 並び替え（1件 UX 維持） |

**非目的（MVP 外）:** プッシュ通知、メール/SMS Reminder、カレンダー連携、固定日の自動スクレイピング。

---

## 2. アーキテクチャ位置づけ

```
support-programs.ts（制度・sourceUrl）
        ↓
program-deadlines.ts（ProgramDeadlineTemplate）  ← KB 層・不変テンプレート
        ↓ getDeadlineTemplateByProgramId（出典検証）
deadlines.ts（CaseDeadline）                    ← Case 層・インスタンス
        ↓
CaseFile.deadlines[]
        ↑ syncDeadlinesAfterProcedureChange
CaseFile.procedures[]（ExternalProcedure）
        ↑ completeCaseAction → syncProceduresOnActionComplete
ActionQueue
        ↑ getCurrentAction ← prioritizePendingActionsByDeadline（recovery のみ）
Home UI「期限確認」ブロック
```

**原則:** Template（KB）と Instance（Case）を分離。Case には **検証済みテンプレートからのみ** 生成する。

---

## 3. ProgramDeadlineTemplate（KB）

**ファイル:** `app/src/lib/knowledge/program-deadlines.ts`

```typescript
ProgramDeadlineTemplate {
  id                    // 例: DL-SP-LIFE-REBUILD
  programId             // support-programs.ts の ID と 1:1
  type                  // application | document_submission | procedure_followup
  label                 // UI 表示用
  calculation           // fixed_date | reference_only（いずれも sourceUrl 必須）
  targetConditions?     // CaseProfile 条件（任意）
  reminderDaysBefore[]  // due_soon 判定閾値（日）
  relatedActionIds?     // ActionQueue 優先制御の紐付け
}
```

### calculation

| kind | dueDate | 用途 |
|------|---------|------|
| `fixed_date` | `date` を CaseDeadline に設定 | 告示日等が KB で確認できた場合（**現行テンプレートは未使用**） |
| `reference_only` | `null` → CaseDeadline.status = `unknown` | 公式ページ参照のみ。note に確認先を記載 |

### 登録済みテンプレート（2026-08-05 時点）

| id | programId | relatedActionIds |
|----|-----------|------------------|
| DL-SP-DISASTER-CERTIFICATE | SP-DISASTER-CERTIFICATE | rw-j03-cert-prep |
| DL-SP-LIFE-REBUILD | SP-LIFE-REBUILD | rw-j04-life-rebuild |
| DL-SP-EMERGENCY-REPAIR | SP-EMERGENCY-REPAIR | rw-j05-emergency-repair |
| DL-SP-INSURANCE-CLAIM | SP-INSURANCE-CLAIM | rw-j04-insurance-report |
| DL-SP-DISASTER-LOAN-RELIEF | SP-DISASTER-LOAN-RELIEF | rw-j04-loan-relief |
| DL-SP-TEMP-HOUSING | SP-TEMP-HOUSING | rw-j05-temp-housing |

**未登録（仕様通り）:** `SP-BUSINESS-SME-RECOVERY`（support-programs.sourceUrl = 確認不可）、`SP-TAX-SOCIAL-INSURANCE` 等。

---

## 4. CaseDeadline（Case インスタンス）

**ファイル:** `app/src/lib/case-management/deadlines.ts`

```typescript
CaseDeadline {
  id, templateId, programId
  procedureId?, relatedActionId?
  type, label
  dueDate: string | null
  sourceUrl, updatedAt
  status: unknown | upcoming | due_soon | overdue | completed
  reminderDaysBefore[]
  createdAt
}
```

| status | 条件 | UI 表示 |
|--------|------|---------|
| `unknown` | dueDate なし、または reference_only | 期限: 確認中 |
| `upcoming` | 期限まで > reminder 閾値 | 申請期限まで N 日 |
| `due_soon` | 期限まで ≤ max(reminderDaysBefore, 14) | 申請期限まで N 日 |
| `overdue` | 期限超過 | 申請期限を N 日過ぎています |
| `completed` | 紐づく Procedure.status = completed | （ホーム優先表示から除外） |

---

## 5. 出典必須ルール

`getDeadlineTemplateByProgramId(programId)` は **以下をすべて満たす場合のみ** テンプレートを返す。

1. `PROGRAM_DEADLINE_TEMPLATES` に programId が存在
2. `support-programs.ts` の当該制度 `sourceUrl` が有効（空・`確認不可` 以外）
3. `calculation.sourceUrl` が有効

**CaseDeadline 生成:** `createCaseDeadlineFromTemplate()` は上記検証済みテンプレートのみ受け付ける。失敗時は `null`（Case に追加しない）。

**推測禁止:** 期限日・制度内容を LLM やヒューリスティックで補完しない。告示確認後に KB へ `fixed_date` を追加する運用とする。

---

## 6. unknown 状態の扱い

| シナリオ | 動作 |
|---------|------|
| `reference_only` テンプレート | `dueDate: null`, `status: unknown` で Case に保存 |
| `fixed_date` だが日付パース失敗 | `computeDeadlineStatus` → `unknown` |
| 再計算（`recomputeDeadlineStatuses`） | dueDate なしは常に `unknown` に戻す |
| ホーム表示 | `getPrimaryDeadlineDisplay` は overdue > due_soon > upcoming > **unknown** の優先度。unknown も1件表示可 |
| workerMessage | Recovery Mode で overdue/due_soon のみ Action 完了後メッセージ上書き |

**利用者向け文言:** 「確認中」— 公式出典リンクから本人確認を促す（推測日付は表示しない）。

---

## 7. Procedure との連携

### 生成タイミング

1. **Case 初期化**（`createCaseFile`）: `generateProceduresForActions` → `generateDeadlinesForProcedures` → `mergeDeadlinesIntoCaseFile`
2. **Action 完了**（`completeCaseAction`）: `syncProceduresOnActionComplete` 後 → `syncDeadlinesAfterProcedureChange`

### syncDeadlinesAfterProcedureChange

対象 Procedure:

```
preparing | submitted | waiting_response | not_started
```

（`not_started` も含む — Procedure 生成直後から期限エントリを持てる）

各 Procedure について `getDeadlineTemplateByProgramId(relatedProgramId)` を参照。テンプレートがなければスキップ。

### Procedure 完了

`markCompletedDeadlines`: 紐づく Procedure が `completed` なら CaseDeadline.status → `completed`。

### 重複排除

キー: `${programId}:${procedureId}` — 同一 Procedure への再同期はマージ更新。

---

## 8. ActionQueue との連携

### 基本優先（全モード）

`generateActionQueue` → `ACTION_TEMPLATES.sortOrder` + `priority` でソート。

### 期限優先（Recovery Mode のみ）

**関数:** `prioritizePendingActionsByDeadline(caseFile)`

**条件:** `caseFile.recoveryPhase.mode === "recovery"`

**動作:**

1. `deadlines` から `overdue` または `due_soon` を抽出
2. 先頭 urgent 期限について:
   - `relatedActionId` が pending ならその Action を先頭へ
   - なければ `relatedProgramIds` に programId を含む pending Action を先頭へ
3. **1件のみ** 先頭移動（UX: 常に1 Action 提示を維持）

**呼び出し:** `getCurrentAction(caseFile)` 内。

**Acute Mode:** 並び替えしない（給水・避難所優先の acute キューを維持）。

---

## 9. UI（現行 MVP）

`home-dashboard.tsx` — 「期限確認」ブロック:

- `getPrimaryDeadlineDisplay(caseFile)` の1件
- label + `formatDeadlineDisplay` + 出典リンク

**未実装:** 期限一覧、カレンダー、Reminder 設定 UI。

---

## 10. 検証

```bash
cd app && npm run validate:deadlines
```

| ケース | 期待 |
|--------|------|
| Case1（Recovery） | 写真+罹災証明準備後、SP-DISASTER-CERTIFICATE / SP-LIFE-REBUILD の期限が存在、出典 URL あり |
| Case4（Recovery） | 罹災証明準備後、ローン減免 Procedure preparing + Deadline に procedureId |
| Case6（Recovery） | business_support Procedure はあるが SP-BUSINESS 期限は **生成されない** |

---

## 11. 将来 Reminder 拡張方針

| フェーズ | 内容 | 前提 |
|---------|------|------|
| **Phase 2a** | `fixed_date` テンプレート追加（告示確認済みのみ） | KB 更新 + validate:deadlines 拡張 |
| **Phase 2b** | CaseDeadline ベースの in-app Reminder（ホームバッジ・未読） | `reminderDaysBefore` を複数段階通知に利用 |
| **Phase 3** | プッシュ / メール（オプトイン） | Supabase + 通知基盤。推測期限は送信禁止 |
| **Phase 4** | 自治体 API 連携で dueDate 自動更新 | Procedure V4 と同一パイプライン |

**設計上の约束（将来も維持）:**

- Reminder 対象は **CaseDeadline インスタンスのみ**（Template から直接通知しない）
- `unknown` 期限に対する「期限切れ Alert」は送らない
- 通知本文には `sourceUrl` を必ず含める

---

## 12. 実装との差分・不一致

| 項目 | 設計書（本 doc） | 実装 | 備考 |
|------|----------------|------|------|
| Procedure 連動対象 status | preparing 以上を主用途 | `not_started` も含む | 実装は早期表示寄り。仕様として許容 |
| `fixed_date` | 型定義あり | テンプレート0件 | 不一致ではなく **未実装予定** |
| Reminder 通知 | Phase 2 以降 | 未実装 | MVP 範囲外 |
| 期限一覧 UI | 将来 | 最優先1件のみ | MVP 範囲内 |
| Acute Mode 期限優先 | なし | なし | 一致 |
| SP-TAX 期限 | KB 追加時にテンプレート追加 | 未登録 | 制度 sourceUrl はあるが期限テンプレート未作成 |

---

## 13. 変更履歴

| 版 | 日付 | 内容 |
|----|------|------|
| v1.0 | 2026-08-05 | Phase 1 MVP 正式化。ProgramDeadlineTemplate / CaseDeadline 分離、Procedure・ActionQueue 連携定義 |
