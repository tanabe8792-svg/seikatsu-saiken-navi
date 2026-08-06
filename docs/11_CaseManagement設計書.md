# 11 Case Management 設計書

被災者ケースの継続支援のための **Case Management Layer** 設計。

- **関連:** docs/05 ジャーニー / docs/06 ケースワーカー / docs/08 RW Action / docs/09 KB / docs/10 検証
- **拡張:** docs/12 Evidence / docs/13 Procedure / docs/14 判断説明 / docs/15 Deadline / docs/16 Recovery Phase
- **実装:** `app/src/lib/case-management/`

---

## 1. 概要

J-00 完了後、Knowledge Base のトリガー評価結果を **Real World Action キュー** に変換し、
被災者ケース（Case File）として session/localStorage に保持する。

| 従来 | 拡張後（Phase 1 完了） |
|------|------------------------|
| CaseWorkerSummary（1件提案） | CaseFile + Action Queue |
| 静的表示 | 完了 → 次 Action 自動提示 |
| 判断根拠なし | CaseDecision ログ + 判断説明 UI（docs/14） |
| — | Evidence V2 / Procedure V3 / Deadline MVP / Recovery Phase |

### 全体アーキテクチャ（固定）

```
J-00 UserProfile
    ↓
CaseProfile ← KB（support-programs, triggers, program-deadlines, alerts）
    ↓
RecoveryPhase（acute | recovery）→ ActionQueue（phaseScope フィルタ）
    ↓
CaseFile { pendingActions, procedures, deadlines, evidences, decisions }
    ↓
getCurrentAction() ← sortOrder + prioritizePendingActionsByDeadline（recovery）
    ↓
Home UI（1 Action + 説明 + 手続き + 期限 + フェーズ）
```

---

## 2. Case File

```typescript
CaseFile {
  caseId, createdAt, updatedAt
  municipalityCode, damageLevel, housingTenure
  familyAttributes { hasChildren, hasElderly, hasPet, isSelfEmployed }
  activeJourney          // J-00〜J-06
  pendingActions[]       // 未完了 RW Action
  completedActions[]     // 完了済み
  riskScore              // 0-100（トリガー優先度から算出）
  lastContactAt
  status                 // active | waiting_user | waiting_external | completed
  decisions[]            // CaseDecision ログ
  evidences[]            // docs/12
  procedures[]           // docs/13
  recoveryPhase?         // docs/16
  deadlines[]            // docs/15
  workerMessage?         // ケースワーカー最新メッセージ
}
```

**保存:** `UserSession.caseFile` → localStorage（`STORAGE_KEY`）  
**将来:** Supabase `sessions` JSON カラムへ同一構造で移行可能

---

## 3. CaseAction（RW Action）

docs/08 の RW Action + `action-templates.ts`。

```typescript
CaseAction {
  id, rwActionId, journeyId
  title, description, reason
  priority: critical | high | medium | low
  required, status, evidenceRequired, completionRule
  sourceTriggerIds[]     // KB トリガー（説明可能性）
  relatedProgramIds[]    // KB 制度 ID
}
```

**status:** `todo` | `doing` | `done` | `skipped`  
**phaseScope（テンプレート）:** `acute` | `recovery` | `both` — docs/16

---

## 4. ActionQueue 優先制御

### 4.1 生成

```
generateActionQueue(caseProfile, family, { phaseMode })
  → evaluateTriggers（KB・変更なし）
  → ACTION_TEMPLATES フィルタ（phaseScope + trigger/when）
  → sortActions（sortOrder → priority）
```

### 4.2 提示（getCurrentAction）

```
pendingActions
  → prioritizePendingActionsByDeadline（recovery のみ — docs/15）
  → 先頭 todo | doing を1件返す
```

| モード | 優先ロジック |
|--------|-------------|
| acute | sortOrder + priority（給水・避難 first） |
| recovery | 上記 + overdue/due_soon 期限に紐づく Action を先頭へ（1件のみ） |

**UX 原則:** 常に **1 Action** を主提示。並び替えのみでキュー構造は維持。

---

## 5. データフロー（Action 完了）

```
completeCaseAction(actionId, evidence?)
    ↓
Evidence 検証（docs/12）
    ↓
pending → completed、次 Action 選択
    ↓
syncProceduresOnActionComplete（docs/13 + procedure-dependencies）
    ↓
syncDeadlinesAfterProcedureChange（docs/15）
    ↓
shouldTransitionToRecovery? → applyRecoveryPhaseTransition（docs/16）
    ↓
CaseDecision 追記 + workerMessage 更新
```

---

## 6. CaseDecision（判断ログ）

```typescript
CaseDecision {
  timestamp, triggerIds[]
  selectedActionId, selectedActionTitle
  reason, confidence
  previousAction?, nextAction?
  evidenceStatus?
  outcome: selected | completed | blocked_missing_evidence | phase_transition
  previousPhase?, nextPhase?   // フェーズ移行時
}
```

**原則:** ブラックボックス禁止。提示・完了・ブロック・フェーズ移行すべてログ化。

**UI 連携:** docs/14 `buildActionDecisionExplanation`

---

## 7. Journey 進行

Action 完了時 `activeJourney` を完了 Action の journeyId と比較し、必要なら前進（J-00〜J-06 順序は docs/05 固定）。

---

## 8. 検証

```bash
cd app && npm run validate:case-actions    # acute 6ケース
npm run validate:evidence
npm run validate:procedures
npm run validate:procedure-extension
npm run validate:decision-explanation
npm run validate:recovery-phase
npm run validate:recovery-strengthen
npm run validate:deadlines
```

---

## 9. 残課題

- Supabase テーブル正規化（cases / case_actions / case_decisions / deadlines）
- チャット API からの Action 更新連携
- Procedure / Deadline の一覧 UI
- `fixed_date` 期限テンプレート（告示確認後 — docs/15）

---

*v1.2 — 2026-08-05: Phase 1 正式化（docs/14〜16 連携、ActionQueue 優先制御、CaseFile 拡張フィールド）*
