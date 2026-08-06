# 12 Real World Evidence 設計書

被災者の現実行動完了を **証跡（Evidence）** で確認する V2 レイヤー設計。

- **関連:** docs/08 現実世界接続（V1〜V4）/ docs/11 Case Management
- **実装:** `app/src/lib/case-management/evidence.ts`

---

## 1. 目的

| V1（従来） | V2（本設計） |
|-----------|-------------|
| 「確認する」タップで完了 | 証跡必須 Action は記録後に完了 |
| 判断根拠が弱い | CaseDecision + Evidence で説明可能 |
| 提案のみ | 完了確認まで伴走 |

**原則（docs/08）:** MVP は V1 中心。J-03 写真は **V2 必須**。

---

## 2. Evidence 型

```typescript
Evidence {
  id, actionId, type, createdAt, status, metadata
}
```

| type | 用途 | MVP |
|------|------|-----|
| photo | 被害写真 | metadata のみ（count, description） |
| document | 申請書類・受理票 | metadata |
| screenshot | 安否・申請スクショ | metadata |
| location | 避難所チェックイン | 将来 V3 |
| text | 自由メモ | metadata |

| status | 意味 |
|--------|------|
| submitted | 被災者が提出（MVP デフォルト） |
| verified | ケースワーカー/システム確認 |
| rejected | 不備あり再提出 |

**MVP:** ファイルアップロードなし。`metadata` JSON のみ localStorage 保存。

---

## 3. 完了ルール（completionRule）

| ルール | 意味 | 例 |
|--------|------|-----|
| SELF_CONFIRM | タップ完了（V1） | 給水確認、書類確認 |
| EVIDENCE_REQUIRED | 証跡必須（V2） | 被害写真 |
| DOCUMENT_REQUIRED | 書類証跡必須 | 将来：罹災証明受理 |

---

## 4. V1/V2/V3/V4 対応（docs/08 整合）

| レベル | 判定 | 本実装 |
|--------|------|--------|
| **V1** | 自己申告 | `SELF_CONFIRM` → 「完了する」 |
| **V2** | 証拠添付 | `EVIDENCE_REQUIRED` → 「証拠を追加」→「完了する」 |
| **V3** | 位置・時間 | 未実装（Evidence type: location 予約） |
| **V4** | 外部 API | 未実装（窓口 QR / 自治体 API 予約） |

---

## 5. 完了フロー

```
getCurrentAction()
    ↓
requiresEvidence?
  No → [完了する] → completeCaseAction(id)
  Yes → [証拠を追加] → addEvidenceToCaseFile()
         ↓
       [完了する] → completeCaseAction(id, evidence?)
         ↓
  証跡なし → blocked + workerMessage（リマインド）
  証跡あり → completed + 次 Action + CaseDecision 記録
```

---

## 6. CaseDecision 強化

```typescript
CaseDecision {
  ...既存,
  previousAction?: { id, title },
  evidenceStatus?: 'none' | 'submitted' | ... | 'not_required',
  nextAction?: { id, title },
  outcome?: 'selected' | 'completed' | 'blocked_missing_evidence'
}
```

**説明可能性:** 「写真完了（submitted）→ 次に罹災証明を案内した理由: J-03 ジャーニー進行」

---

## 7. 将来 API 連携

| フェーズ | 内容 |
|----------|------|
| Phase 1（現状） | metadata + localStorage |
| Phase 2 | Supabase Storage 写真アップロード |
| Phase 3 | 自治体罹災証明 API ステータス連携（V4） |
| Phase 4 | GPS 圏内チェック（V3） |

---

## 8. 検証

```bash
cd app && npm run validate:evidence
```

Case1 / Case4 / Case6 の Evidence フローを自動検証。

---

*v1.0 — 2026-08-05*
