"use client";

import { useRouter } from "next/navigation";

interface HeaderBackButtonProps {
  /** 履歴がないとき（直接URLで開いたなど）の行き先 */
  fallbackHref?: string;
  label?: string;
  onBack?: () => void;
}

export function HeaderBackButton({
  fallbackHref = "/",
  label = "← 戻る",
  onBack,
}: HeaderBackButtonProps) {
  const router = useRouter();

  const className =
    "text-base font-medium text-muted-foreground hover:text-foreground hover:underline";

  if (onBack) {
    return (
      <button type="button" onClick={onBack} className={className}>
        {label}
      </button>
    );
  }

  function handleBack() {
    if (typeof window === "undefined") {
      router.push(fallbackHref);
      return;
    }

    const referrer = document.referrer;
    let sameOrigin = false;
    if (referrer) {
      try {
        sameOrigin = new URL(referrer).origin === window.location.origin;
      } catch {
        sameOrigin = false;
      }
    }

    if (sameOrigin && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button type="button" onClick={handleBack} className={className}>
      {label}
    </button>
  );
}
