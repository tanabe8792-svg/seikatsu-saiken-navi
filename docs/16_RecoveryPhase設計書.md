# 16 Recovery Phase 設計書

被災直後（Acute）と生活再建伴走（Recovery）の **フェーズ分離** と Action 包含制御。

- **関連:** docs/05 ジャーニー / docs/11 Case Management / docs/15 Deadline / docs/13 Procedure
- **実装:** `recovery-phase.ts`, `recovery-dashboard.ts`, `action-templates.ts`（phaseScope）
- **UI:** `home-dashboard.tsx`
- **検証:** `validate:recovery-phase`, `validate:recovery-strengthen`

---

## 1. 目的

| モード | 対象期間 | Action 方針 |
|--------|---------|------------|
| **acute** | 発災直後〜安全確保 | 給水・避難所・家族安否（J-01/J-02）優先 |
| **recovery** | 被災後数か月〜数年 | 被害記録・支援・手続き（J-03〜J-06）優先 |

**J-00〜J-06 定義は変更しない。** 同一 Journey 内 Action の **包含/除外** でフェーズを表現する。

---

## 2. データモデル

```typescript
RecoveryPhase {
  mode: "acute" | "recovery"
  enteredAt: string
  transitionReason: string
  transitionTriggerIds?: string[]
}

CaseFile.recoveryPhase?: RecoveryPhase
```

### Action phaseScope（action-templates.ts）

| phaseScope | acute | recovery |
|------------|-------|----------|
| `acute` | 表示 | **非表示** |
| `recovery` | 非表示 | 表示 |
| `both` | 表示 | 表示 |

**acute 専用 Action（削除禁止）:** 給水（rw-j02-water-station）、福祉避難所（rw-j01-welfare-shelter）等。

---

## 3. 初期フェーズ判定

**関数:** `createInitialRecoveryPhase(profile, caseProfile, options?)`

| 順序 | 条件 | mode |
|------|------|------|
| 1 | `options.forceMode`（検証用） | 指定値 |
| 2 | `profile.startRecoveryPhase === true` | recovery（TRIGGER-USER-RECOVERY-START） |
| 3 | 被災から ≥ 7 日（RECOVERY_AUTO_DAYS） | recovery（TRIGGER-RECOVERY-ELAPSED） |
| 4 | ライフライン問題あり かつ < 3 日（ACUTE_WINDOW_DAYS） | acute（TRIGGER-WATER-PRIORITY） |
| 5 | デフォルト | recovery |

**既存 localStorage ケース:** `normalizeRecoveryPhase` 未設定時 → `recovery`（migration デフォルト）。

---

## 4. acute → recovery 移行

### 自動移行（既存ロジック・変更禁止）

**関数:** `shouldTransitionToRecovery(caseFile, completedAction?)`

| 条件 | 移行 |
|------|------|
| mode !== acute | しない |
| 完了 Action が rw-j01-welfare-shelter / rw-j01-family-safety | する |
| 被災から ≥ 7 日 | する |

**処理:** `applyRecoveryPhaseTransition` → `CaseDecision.outcome = phase_transition` → `refreshActionQueueForPhase(..., "recovery")`

### ユーザー明示移行（Recovery 強化）

**関数:** `canUserStartRecoveryPhase` / `applyUserRecoveryPhaseTransition`

- 条件: `mode === "acute"` のみ
- トリガー ID: `TRIGGER-USER-RECOVERY-START`（J-00 `startRecoveryPhase` と同一）
- UI: ホーム「再建伴走を開始する」ボタン → `session.startRecoveryPhase()`

**新規判定ルールは追加しない。** 既存 TRIGGER と CaseDecision パターンの再利用。

---

## 5. ActionQueue 再生成

フェーズ移行時:

```
refreshActionQueueForPhase(caseFile, caseProfile, "recovery")
  → generateActionQueue(..., { phaseMode: "recovery" })
  → 完了済み Action ID は保持、pending を差し替え
  → 新 Procedure マージ + syncDeadlinesAfterProcedureChange
```

---

## 6. Acute 外部導線（Recovery Mode）

給水・避難 Action は **削除せず** Recovery では非表示。

**代替:** `getAcuteExternalLinksForRecovery(profile, caseFile)`

- 条件: mode === recovery
- ソース: `REGIONAL_ALERTS` の J-01/J-02 アラート（sourceUrl 必須）
- UI: 「ライフライン・避難情報（外部）」リンク一覧

---

## 7. UI（home-dashboard）

| ブロック | 関数 |
|---------|------|
| 現在: 生活再建フェーズ + サブタイトル | `getRecoveryPhaseDisplay` |
| 再建開始ボタン（acute のみ） | `canUserStartRecoveryPhase` |
| 外部導線 | `getAcuteExternalLinksForRecovery` |
| 現在の手続き（最大3件） | `getProcedureOverview` |

**注意:** `getRecoveryPhaseLabel` は「再建フェーズ」、`getRecoveryPhaseDisplay` は「生活再建フェーズ」— UI は後者を使用。

---

## 8. Deadline / Action 優先との関係

- **Deadline 並び替え:** Recovery Mode のみ（docs/15 参照）
- **Acute:** sortOrder + Trigger 優先のまま（validate:case-actions は forcePhaseMode: acute）

---

## 9. 検証

```bash
npm run validate:recovery-phase      # 先頭 Action・mode
npm run validate:recovery-strengthen # UI helpers + Case1/4/6 フロー
```

| ケース | Recovery 先頭 Action |
|--------|---------------------|
| Case1 | 被害写真を撮影する（給水は非表示） |
| Case4 | 被害写真 + キューにローン減免 |
| Case6 | 事業復旧を確認 |

---

## 10. 実装との差分

| 項目 | 設計 | 実装 | 備考 |
|------|------|------|------|
| J-00 再建開始 UI | ロードマップに言及 | ホームのみ | J-00 統合は未実装 |
| フェーズ表示文言 | 2系統（label / display） | 一致 | UI は display |
| 自動移行 7日 | RECOVERY_AUTO_DAYS | 一致 | 災害日は DISASTER_EVENT_R8_KUMAMOTO |

---

*v1.0 — 2026-08-05: Recovery Phase 強化込みで正式化*
