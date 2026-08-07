import { ExternalLink } from "lucide-react";
import {
  SUPPORT_DONATION_TIERS,
  TRUST_CONTINUITY_SUPPORT,
  getSupportDonationTierUrl,
  getSupportPayPayUrl,
  hasAnySupportDonationLink,
} from "@/lib/trust/trust-copy";
import { cn } from "@/lib/utils";

/**
 * 活動費支援 — 金額の意味が分かるボタン群（Stripe / PayPay 等の外部リンク）
 */
export function SupportDonationPanel() {
  const ready = hasAnySupportDonationLink();
  const payPayUrl = getSupportPayPayUrl();

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-gradient-to-b from-muted/40 to-background px-4 py-5">
      <div className="space-y-2">
        <p className="text-base font-bold">活動費で応援する</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          任意です。無理のない金額で大丈夫です。開発・維持の足しに使わせていただきます。
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <PaymentChip label="Apple Pay" />
          <PaymentChip label="クレジットカード" />
          <PaymentChip label="PayPay" />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {TRUST_CONTINUITY_SUPPORT.paymentMethodsNote}
        </p>
      </div>

      <ul className="space-y-2.5">
        {SUPPORT_DONATION_TIERS.map((tier) => {
          const href = getSupportDonationTierUrl(tier.id);
          const enabled = Boolean(href);
          return (
            <li key={tier.id}>
              {enabled && href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left shadow-sm transition",
                    "hover:border-brand-green/50 hover:bg-muted/40 active:scale-[0.99]"
                  )}
                >
                  <TierContent tier={tier} />
                  <ExternalLink
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </a>
              ) : (
                <div className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-4 py-3.5 text-left opacity-80">
                  <TierContent tier={tier} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {payPayUrl ? (
        <a
          href={payPayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/50"
        >
          PayPayで応援する
        </a>
      ) : null}

      {!ready ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
          {TRUST_CONTINUITY_SUPPORT.donationPending}
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {TRUST_CONTINUITY_SUPPORT.donationNote}
        </p>
      )}
    </div>
  );
}

function TierContent({
  tier,
}: {
  tier: (typeof SUPPORT_DONATION_TIERS)[number];
}) {
  return (
    <div className="min-w-0 flex-1 space-y-0.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-lg font-bold tabular-nums text-brand-green">
          {tier.title}
        </span>
        <span className="text-sm font-medium">{tier.purpose}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {tier.detail}
      </p>
    </div>
  );
}

function PaymentChip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
      {label}
    </span>
  );
}
