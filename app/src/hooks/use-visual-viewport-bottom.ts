"use client";

import { useEffect, useState } from "react";

/**
 * iOS Safari などでアドレスバーの出し入れ時に、fixed bottom が浮くのを抑える。
 * layout viewport と visual viewport の差を返す（px）。
 */
export function useVisualViewportBottomOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const next = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop)
      );
      setOffset(next);
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return offset;
}
