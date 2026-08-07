"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useVisualViewportBottomOffset } from "@/hooks/use-visual-viewport-bottom";

interface BottomChromeContextValue {
  /** visualViewport 由来の下方向オフセット（px） */
  viewportBottomOffset: number;
  /** 下部タブの高さ（safe-area 除く） */
  navHeightPx: number;
}

const BottomChromeContext = createContext<BottomChromeContextValue>({
  viewportBottomOffset: 0,
  navHeightPx: 56,
});

export function BottomChromeProvider({ children }: { children: ReactNode }) {
  const viewportBottomOffset = useVisualViewportBottomOffset();
  const value = useMemo(
    () => ({
      viewportBottomOffset,
      navHeightPx: 56,
    }),
    [viewportBottomOffset]
  );

  return (
    <BottomChromeContext.Provider value={value}>
      {children}
    </BottomChromeContext.Provider>
  );
}

export function useBottomChrome(): BottomChromeContextValue {
  return useContext(BottomChromeContext);
}
