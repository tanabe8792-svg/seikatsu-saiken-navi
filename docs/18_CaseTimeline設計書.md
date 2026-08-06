# 18 CaseTimeline 設計書

## 目的

被災者が数週間〜数年後でも、自分の再建履歴を確認できるようにする。

- 何をしたか
- 何が完了したか
- 現在どこで止まっているか
- 次に何をするか

専門家向け案件管理ではなく、**被災者本人の理解**を最優先する。

## 位置づけ

```
J-00 → CaseProfile → KB → Trigger → RecoveryPhase → ActionQueue
  → Evidence → DocumentRecord → Procedure → Deadline → CaseDecision → UI
                                                              ↑
                                                    CaseTimeline（派生）
```

CaseTimeline は **既存データから生成する読み取りモデル** である。  
ActionQueue / Evidence / Procedure / Deadline / CaseDecision / RecoveryPhase の構造は変更しない。

## 役割分担（重複回避）

| ソース | 役割 | Timeline の扱い |
|--------|------|-----------------|
| `CaseDecision[]` | 内部判断ログ（triggerIds, confidence） | `phase_transition` / `document_gap_priority` のみ要約 |
| `Evidence[]` | 証跡の生データ | `evidence_added` として被災者向け要約 |
| `ExternalProcedure[]` | 手続きの現在状態 | 現在 milestone を `procedure_*` として要約（状態履歴は持たない） |
| `CaseDeadline[]` | 期限インスタンス | `deadline_created` |
| `completedActions[]` | 完了 Action | `action_completed` |
| `RecoveryPhase` | フェーズ | `phase_transition` |

CaseDecision の `selected` / `completed` は Action 完了イベントと重複するため Timeline には載せない。

## データモデル

```typescript
interface CaseTimelineEvent {
  id: string;
  caseId: string;
  timestamp: string;
  type:
    | "action_completed"
    | "evidence_added"
    | "procedure_started"
    | "procedure_updated"
    | "deadline_created"
    | "decision_recorded"
    | "phase_transition";
  summary: string;       // 被災者向け短文
  relatedIds: string[];
  source:
    | "action_queue"
    | "evidence"
    | "procedure"
    | "deadline"
    | "decision"
    | "recovery_phase";
}
```

`CaseFile.timeline?: CaseTimelineEvent[]` に保持する。  
`syncCaseTimeline(caseFile)` で既存状態から冪等に再構築する。

## 生成ルール

| ソース | type | timestamp | summary 例 |
|--------|------|-----------|------------|
| completedActions | action_completed | completedAt | 被害写真の確認完了 |
| evidences | evidence_added | createdAt | 被害状況の記録を残しました |
| procedures (preparing) | procedure_started | updatedAt | 罹災証明の準備を開始 |
| procedures (waiting_response 等) | procedure_updated | submittedAt / updatedAt | 罹災証明の結果確認待ち |
| deadlines | deadline_created | createdAt | ○○の期限を確認しました |
| decisions (gap/phase) | decision_recorded | timestamp | 次に準備することを整理しました |
| recoveryPhase | phase_transition | enteredAt | 生活再建の伴走を開始しました |

推測情報の追加は禁止。KB にない制度名・書類名を invent しない。

## UI（home-dashboard）

ブロック名: **「これまでの再建状況」**

- 直近 3〜5 件の履歴（✓ 付きリスト）
- **現在：** 主手続きの状態（例: 罹災証明の結果確認待ち）
- **次：** 既存 ActionQueue の current Action title

専門家向け用語（Trigger, ProcedureStatus, 申請準備中 等）は使わない。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `case-timeline.ts` | 生成・同期・ダッシュボード |
| `validation-timeline.ts` | Case1/4/6 Recovery 検証 |
| `run-validation-timeline.ts` | CLI エントリ |

## 検証

```bash
npm run validate:timeline
```

既存 `validate:*` も引き続き通過すること。

## 制約

- J-00〜J-06 変更禁止
- KB / Trigger 削除禁止
- 推測情報追加禁止
- UI 最小変更
- git commit 禁止（作業指示時）
