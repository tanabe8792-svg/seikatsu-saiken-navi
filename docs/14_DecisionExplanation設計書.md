# 14 Decision Explanation 設計書

「なぜ今この Action か」を **Trigger / KB / CaseDecision / Procedure / Evidence** のみから組み立てる説明レイヤー。

- **関連:** docs/06 ケースワーカー / docs/11 Case Management
- **実装:** `app/src/lib/case-management/decision-explanation.ts`
- **UI:** `home-dashboard.tsx`「なぜ今これ？」ブロック
- **検証:** `npm run validate:decision-explanation`

---

## 1. 原則

| 許可 | 禁止 |
|------|------|
| evaluateTriggers() の結果 | LLM による制度推測 |
| support-programs の name/description/sourceUrl | 出典なし制度の invented 説明 |
| CaseDecision.reason / confidence | 根拠のない優先理由 |
| getPrimaryProcedure / Evidence 状態 | |

---

## 2. ActionDecisionExplanation 型

```typescript
ActionDecisionExplanation {
  actionId, actionTitle
  primaryReason          // Trigger.message または CaseDecision.reason
  conditions[]           // マッチ Trigger（label + detail）
  relatedPrograms[]      // action.relatedProgramIds → KB
  sources[]              // sourceUrl 有効なもののみ
  decisionTimestamp?, confidence?
  procedureNote?         // 進行中 Procedure の状態
  evidenceNote?          // 証跡不足時
}
```

**組み立て:** `buildActionDecisionExplanation(caseFile, currentAction, profile)`

---

## 3. データソース優先順位

1. **primaryReason:** 最新 `CaseDecision`（outcome=selected）の reason → なければ Action.reason → マッチ Trigger.message
2. **conditions:** Action.sourceTriggerIds と evaluateTriggers の突合
3. **relatedPrograms:** relatedProgramIds → getSupportProgramById（sourceUrl 確認不可は description のみ）
4. **sources:** programs + triggers + alerts の有効 sourceUrl
5. **procedureNote:** getPrimaryProcedure が active なら状態ラベル
6. **evidenceNote:** evidenceRequired かつ未提出

---

## 4. CaseDecision 連携

| outcome | 説明 UI への影響 |
|---------|----------------|
| selected | 次 Action 提示理由 |
| completed | primaryReason の元（完了→次の CaseDecision） |
| blocked_missing_evidence | evidenceNote |
| phase_transition | フェーズ移行（説明ブロック外。workerMessage に反映） |

---

## 5. UI

ホーム Action カード内:

- なぜ今これ？（primaryReason）
- 優先された条件（conditions）
- 関連する支援（relatedPrograms）
- 出典（sources）

**変更禁止（MVP）:** チャット API からの説明生成は別系統。本レイヤーは read-only 表示。

---

## 6. 検証

```bash
npm run validate:decision-explanation
```

Case1 acute: 給水 Action に断水関連 Trigger・出典が含まれること等。

---

*v1.0 — 2026-08-05*
