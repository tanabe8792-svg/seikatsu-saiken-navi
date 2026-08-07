/**
 * 改善の足跡 — 静的データのみ（サーバー負荷なし）
 * 最新を上に並べる。全部は書かず、利用者に伝わる改善だけ残す。
 */

export interface ImprovementFootprint {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  summary: string;
}

export const IMPROVEMENT_FOOTPRINTS: ImprovementFootprint[] = [
  {
    id: "2026-08-07-photo-ask-album",
    date: "2026-08-07",
    title: "写真アプリへの保存は確認してから",
    summary:
      "撮ったあとに勝手に写真アプリを開かず、「残しますか？」と聞いてから開くようにしました。くるくるが止まらない不具合も直しています。",
  },
  {
    id: "2026-08-07-photo-dual-save",
    date: "2026-08-07",
    title: "写真をナビと写真アプリの両方に残せるように",
    summary:
      "撮るとナビにすぐ残り、必要な人は写真アプリにも同じ写真を残せます。",
  },
  {
    id: "2026-08-07-photo-no-auto-album",
    date: "2026-08-07",
    title: "撮影後の止まりにくさを改善",
    summary:
      "撮ったあとに待ちが長くなる動きをやめ、サイト内への保存を先に完了するようにしました。",
  },
  {
    id: "2026-08-07-check-urls",
    date: "2026-08-07",
    title: "確認ボタンと公式リンクを見直し",
    summary:
      "手順の確認が分かりやすいボタンになり、もう一度押すと戻せます。開けない公式リンクも、いま使える案内に差し替えました。",
  },
  {
    id: "2026-08-07-album-save",
    date: "2026-08-07",
    title: "撮った写真をこのサイトに残す",
    summary:
      "撮影した写真をサーバーに送らず、この端末のサイト内に残せるようにしました。アルバムへのコピーは必要なときだけ行えます。",
  },
  {
    id: "2026-08-07-photo-flow",
    date: "2026-08-07",
    title: "写真は手順を確認してから撮影",
    summary:
      "手順にチェックする前はカメラを開かず、確認後に撮影へ進むようにしました。下のボタンの浮きにくさも改善しています。",
  },
  {
    id: "2026-08-07-plain-japanese",
    date: "2026-08-07",
    title: "わかりやすい日本語に整理",
    summary:
      "英語っぽい言い回しや難しい説明を減らし、相談先の案内を短くしました。",
  },
  {
    id: "2026-08-07-notify-line",
    date: "2026-08-07",
    title: "お知らせとLINEログインの説明を整理",
    summary:
      "LINEはログイン用であること、重要なお知らせはメール希望で受け取れることをはっきり書きました。",
  },
  {
    id: "2026-08-06-certificate",
    date: "2026-08-06",
    title: "り災証明の進み方を見やすく",
    summary:
      "申請後に「いま待っていること」を残せるようにし、情報の日付も分かるようにしました。",
  },
  {
    id: "2026-08-06-brand-name",
    date: "2026-08-06",
    title: "公開名を「熊本 生活再建ナビ」に",
    summary: "サービス名と共有文を、伝わりやすい表現に整えました。",
  },
  {
    id: "2026-08-05-support-donate",
    date: "2026-08-05",
    title: "活動費の応援と改善の声",
    summary:
      "任意の活動費支援と、改善の声の送信完了が分かる表示を追加しました。",
  },
  {
    id: "2026-08-05-photo-device",
    date: "2026-08-05",
    title: "被害写真を端末に残す",
    summary:
      "撮影した写真をサーバーに送らず、この端末の中に残せるようにしました。",
  },
  {
    id: "2026-08-04-mypage-login",
    date: "2026-08-04",
    title: "かんたんログインとマイページ",
    summary: "メールやLINEでログインし、保存した内容を見返せるようにしました。",
  },
];

export function formatFootprintDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`;
}
