import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/logo.png";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  showWordmark?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
}

const SIZE = {
  sm: { box: "h-8 w-8", text: "text-sm" },
  md: { box: "h-10 w-10", text: "text-base" },
  lg: { box: "h-14 w-14", text: "text-lg" },
  hero: { box: "h-28 w-28", text: "text-xl" },
} as const;

export function AppLogo({
  size = "md",
  showWordmark = false,
  href,
  className,
  priority = false,
}: AppLogoProps) {
  const dims = SIZE[size];
  const content = (
    <>
      <Image
        src={LOGO_SRC}
        alt={APP_NAME}
        width={512}
        height={512}
        priority={priority}
        className={cn("shrink-0 rounded-full object-cover", dims.box)}
      />
      {showWordmark && (
        <span
          className={cn(
            "min-w-0 truncate font-semibold tracking-tight text-foreground",
            dims.text
          )}
        >
          {APP_NAME}
        </span>
      )}
    </>
  );

  const wrapClass = cn("inline-flex min-w-0 items-center gap-2.5", className);

  if (href) {
    return (
      <Link href={href} className={wrapClass} aria-label="ホームへ">
        {content}
      </Link>
    );
  }

  return <div className={wrapClass}>{content}</div>;
}
