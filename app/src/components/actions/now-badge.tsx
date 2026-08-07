/** 次に確認する項目の目印。小さい文字色だけだと見えにくいので、大きめ・白字・濃いオレンジにする */
export function NowBadge({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span
      className={
        size === "lg"
          ? "inline-flex items-center rounded-md bg-[hsl(24_90%_38%)] px-3.5 py-1.5 text-base font-bold tracking-wide text-white shadow-sm"
          : "inline-flex items-center rounded-md bg-[hsl(24_90%_38%)] px-3 py-1 text-sm font-bold tracking-wide text-white shadow-sm"
      }
      aria-label="いま確認する項目"
    >
      いま確認する
    </span>
  );
}
