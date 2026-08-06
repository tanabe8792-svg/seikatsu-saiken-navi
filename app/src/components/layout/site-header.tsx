import { AppLogo } from "@/components/brand/app-logo";
import { SiteNavMenu } from "@/components/layout/site-nav-menu";
import { HeaderBackButton } from "@/components/layout/header-back-button";

interface SiteHeaderProps {
  title?: string;
  showBack?: boolean;
  /** 履歴がないときの戻り先（省略時は /） */
  backHref?: string;
  /** ページ内の「前へ」（J-00 など） */
  onBack?: () => void;
  backLabel?: string;
}

export function SiteHeader({
  title = "生活再建ナビ",
  showBack = false,
  backHref = "/",
  onBack,
  backLabel = "← 戻る",
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-3">
          {showBack ? (
            <HeaderBackButton
              fallbackHref={backHref}
              label={backLabel}
              onBack={onBack}
            />
          ) : (
            <AppLogo href="/" size="sm" showWordmark className="min-w-0" />
          )}
        </div>
        <SiteNavMenu />
      </div>
      {showBack && title !== "生活再建ナビ" && (
        <div className="mx-auto max-w-lg px-4 pb-3">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      )}
    </header>
  );
}
