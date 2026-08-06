# 13 Procedure Tracking 設計書

被災者の **現実行動（Action）** と **外部機関手続き（Procedure）** を分離し、AIケースワーカーが申請・結果待ちを追跡する V3 レイヤー設計。

- **関連:** docs/11 Case Management / docs/12 Real World Evidence / docs/15 Deadline / docs/16 Recovery Phase
- **実装:** `procedures.ts`, `procedure-dependencies.ts`, `recovery-dashboard.ts`（一覧表示）
- **検証:** `validate:procedures`, `validate:procedure-extension`

---

## 1. 目的

| レイヤー | 責務 | 例 |
|---------|------|-----|
| **Action** | 被災者が今やる行動 | 被害写真を撮影する、生活再建支援制度を確認する |
| **Procedure** | 外部機関との手続き進捗 | 罹災証明書（自治体）、生活再建支援金（国） |
| **Evidence** | 行動・手続きの証跡 | 写真記録、申請受付スクショ |

**原則:** Action 完了 ≠ 手続き完了。Procedure は `submitted` / `waiting_response` など外部状態を保持する。

---

## 2. ExternalProcedure 型

```typescript
ExternalProcedure {
  id, type, name, organization,
  relatedActionId, relatedProgramId,
  status, submittedAt, updatedAt,
  sourceUrl, note
}
```

### type（Phase 1 拡張込み）

| type | 用途 |
|------|------|
| disaster_certificate | 罹災証明 |
| insurance_claim | 火災・地震保険 事故報告 |
| life_rebuild_grant | 被災者生活再建支援制度 |
| emergency_repair | 応急修理制度 |
| tax_social_insurance | 税・社会保険 被災者手続 |
| loan_relief | ローン減免 |
| housing_support | 仮設・住居支援 |
| utility_reduction | 水道等減免 |
| business_support | 事業復旧支援 |

### status

| status | 表示 | ケースワーカーメッセージ |
|--------|------|------------------------|
| not_started | 未着手 | まず申請準備をしましょう |
| preparing | 申請準備中 | 必要書類を確認しています |
| submitted | 申請済み | 申請済みです。結果を待ちながら次の準備を進めます |
| waiting_response | 結果待ち | 自治体からの連絡待ちです |
| completed | 完了 | 完了しました |
| rejected | 却下 | 再申請が必要です |
| unknown | 確認中 | 状況を確認中です |

---

## 3. ProcedureTemplate

```typescript
ProcedureTemplate {
  programId, type, name, organization
  linkedActionIds[]
  prerequisiteProgramIds?   // 前提制度（KB requiredDocuments 由来）
  requiredEvidence?         // KB requiredDocuments 由来
  activateOnActionComplete?
  submitOnActionComplete?
}
```

**ファイル:** `PROCEDURE_TEMPLATES` in `procedures.ts`

### 登録制度（2026-08-05）

| programId | type |
|-----------|------|
| SP-DISASTER-CERTIFICATE | disaster_certificate |
| SP-INSURANCE-CLAIM | insurance_claim |
| SP-LIFE-REBUILD | life_rebuild_grant |
| SP-EMERGENCY-REPAIR | emergency_repair |
| SP-TAX-SOCIAL-INSURANCE | tax_social_insurance |
| SP-DISASTER-LOAN-RELIEF | loan_relief |
| SP-TEMP-HOUSING | housing_support |
| SP-WATER-RATE-REDUCTION | utility_reduction |
| SP-BUSINESS-SME-RECOVERY | business_support |

---

## 4. ProcedureDependency

**ファイル:** `procedure-dependencies.ts`

KB `support-programs.requiredDocuments` に「罹災証明」を含む制度のみ依存定義（推測追加禁止）。

```
SP-DISASTER-CERTIFICATE
    ↓
SP-LIFE-REBUILD
SP-EMERGENCY-REPAIR
SP-DISASTER-LOAN-RELIEF
```

**チェック:** `syncProceduresOnActionComplete` 内 `areProcedurePrerequisitesMet`

- 前提 Procedure が `preparing | submitted | waiting_response | completed` でない場合、dependent は **preparing にならない**

### 状態遷移（現行）

| 完了 Action | Procedure 更新（前提充足時） |
|------------|---------------------------|
| rw-j03-photo | 罹災証明・保険請求 → preparing |
| rw-j03-cert-prep | 罹災証明 submit / 生活再建・応急修理・ローン減免 → preparing |
| rw-j04-life-rebuild | 生活再建 → submit |
| rw-j04-business-recovery | business_support → preparing |

**重要:** ローン減免は **罹災証明準備完了後**（写真のみでは preparing にならない）。

---

## 5. Action Queue / Deadline 連携

```
completeCaseAction
    ↓
syncProceduresOnActionComplete（依存チェック込み）
    ↓
syncDeadlinesAfterProcedureChange（docs/15）
    ↓
getPrimaryProcedure / getProcedureOverview（UI）
```

---

## 6. Evidence 接続（V2）

Evidence に `procedureId?`。`syncProcedureOnEvidenceSubmit` で submitted 更新。

---

## 7. UI（home-dashboard）

- **現在の手続き:** `getProcedureOverview`（最大3件）
- 主 Procedure の workerMessage

---

## 8. 検証

```bash
npm run validate:procedures           # acute 6ケース（後方互換）
npm run validate:procedure-extension  # recovery Case1/4/6
```

| ケース | Recovery 期待 |
|--------|--------------|
| Case1 | 写真 → 罹災証明 preparing → 証明準備後 生活再建 preparing |
| Case4 | 罹災証明後 ローン減免 preparing |
| Case6 | 事業復旧後 business_support preparing |

---

## 9. 将来 API 連携（V4）

- 自治体オンライン申請 API → status 自動同期
- 保険会社マイページ連携
- Webhook + CaseDecision ログ

---

## 10. 実装との差分

| 項目 | 旧 docs/13（v1.0） | 現行実装 |
|------|-------------------|---------|
| Case4 ローン減免 | 写真後 preparing | **罹災証明準備後** preparing（依存導入） |
| Procedure type | 7種 | 9種（+life_rebuild, emergency_repair, tax_social_insurance 等） |
| UI | 単一 Procedure | 最大3件 overview |
| 依存関係 | なし | procedure-dependencies.ts |

---

*v1.1 — 2026-08-05: Procedure 拡張・依存・Deadline 連携を正式反映*
