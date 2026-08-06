# 17 Document Management 設計書（Evidence 実務化 Phase 1）

被災者の **再建伴走の記憶基盤** — 何を済ませたか・何が不足か・次に何を準備するか。

- **関連:** docs/12 Evidence V2 / docs/13 Procedure / docs/11 Case Management
- **実装:** `document-records.ts`, `document-requirements.ts`, `document-gap.ts`
- **検証:** `npm run validate:documents`

---

## 1. 目的（非目的）

| 目的 | 非目的 |
|------|--------|
| 忘却防止・不足確認・次の行動提示 | 書類管理 SaaS / 士業案件管理 |
| Evidence 拡張による案件内台帳 | ファイルアップロード（Phase 2） |
| KB requiredDocuments のみ | 推測による必要書類追加 |

---

## 2. モデル

```
Evidence（提出イベント・V2 維持）
    ↓ syncDocumentRecords
DocumentRecord（案件内台帳）
    ↑ 充足判定
DocumentRequirement（KB requiredDocuments 由来）
```

### DocumentRecord.status

`missing` | `preparing` | `submitted` | `verified` | `unknown`

### DocumentRequirement.kbStatus

`confirmed` — KB 原文 / `unknown` — 「確認不可」

---

## 3. ActionQueue 連携

新 Action **禁止**。不足時は既存 Action へ誘導:

| 不足 category | Action |
|--------------|--------|
| photo | rw-j03-photo |
| disaster_certificate / identity_document | rw-j03-cert-prep |
| insurance_submission | rw-j04-insurance-report |
| income_proof / bank_account | rw-j04-life-rebuild |
| loan_contract | rw-j04-loan-relief |

`getCurrentAction`: Deadline 優先 → DocumentGap 優先（recovery のみ）

---

## 4. CaseDecision

`outcome: document_gap_priority` — 準備項目に基づく優先表示の理由記録

---

## 5. UI（home-dashboard）

- 再建状況 / 準備済み / 次に準備するもの
- 被災者向け文言（「不足」ではなく「〜に向けて」）

---

*v1.0 — 2026-08-05*
