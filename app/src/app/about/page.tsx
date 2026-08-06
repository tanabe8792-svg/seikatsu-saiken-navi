import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLogo } from "@/components/brand/app-logo";
import { FeedbackForm } from "@/components/about/feedback-form";
import { Card, CardContent } from "@/components/ui/card";
import { J00_DISASTER_EVENT_LABEL } from "@/lib/j00-hearing";
import {
  TRUST_ABOUT_SERVICE,
  TRUST_CONTINUITY_SUPPORT,
  TRUST_DEVELOPER,
  TRUST_FEEDBACK,
  TRUST_INFO_HANDLING,
  TRUST_PAGE_TITLE,
  TRUST_WHY_BUILT,
  getTrustFeedbackFormUrl,
} from "@/lib/trust/trust-copy";

export default function AboutPage() {
  const feedbackFormUrl = getTrustFeedbackFormUrl();

  return (
    <>
      <SiteHeader title={TRUST_PAGE_TITLE} showBack backHref="/mypage" />
      <main className="space-y-5 px-4 py-4 pb-28">
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <AppLogo size="lg" />
              <p className="text-sm text-muted-foreground">
                一歩ずつ、暮らしを取り戻すために
              </p>
            </div>
            <h1 className="text-xl font-bold leading-snug">
              {J00_DISASTER_EVENT_LABEL}
            </h1>
            <p className="text-base leading-relaxed">
              {TRUST_ABOUT_SERVICE.body[0]}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {TRUST_ABOUT_SERVICE.body[1]}
            </p>
          </CardContent>
        </Card>

        <TrustSection heading={TRUST_WHY_BUILT.heading}>
          {TRUST_WHY_BUILT.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </TrustSection>

        <TrustSection heading={TRUST_DEVELOPER.heading}>
          <div className="rounded-xl border bg-background/80 px-4 py-4">
            <p className="text-lg font-semibold">{TRUST_DEVELOPER.name}</p>
            <p className="text-sm text-muted-foreground">
              {TRUST_DEVELOPER.nameReading}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {TRUST_DEVELOPER.affiliation}
            </p>
          </div>
          {TRUST_DEVELOPER.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </TrustSection>

        <TrustSection heading={TRUST_INFO_HANDLING.heading}>
          {TRUST_INFO_HANDLING.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </TrustSection>

        <TrustSection heading={TRUST_FEEDBACK.heading} id="feedback">
          <p>{TRUST_FEEDBACK.lead}</p>
          <p className="text-sm text-muted-foreground">{TRUST_FEEDBACK.note}</p>
          <FeedbackForm kind="improvement" />
          {feedbackFormUrl ? (
            <p className="text-xs text-muted-foreground">
              別フォームでも送れます：
              <a
                href={feedbackFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-medium text-primary underline-offset-2 hover:underline"
              >
                外部フォームを開く
              </a>
            </p>
          ) : null}
        </TrustSection>

        <TrustSection heading={TRUST_CONTINUITY_SUPPORT.heading} id="support">
          {TRUST_CONTINUITY_SUPPORT.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="text-sm text-muted-foreground">
            {TRUST_CONTINUITY_SUPPORT.formLead}
          </p>
          <FeedbackForm kind="support" />
        </TrustSection>

        <TrustSection heading="マイページ登録" id="account-setup">
          <p>
            メールまたはLINEで、かんたんに登録・ログインできます。登録すると各ページに登録済みと表示され、保存した内容をマイページで見返せます。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>メール：リンク付きメールを受け取り、リンクをタップ</li>
            <li>LINE：あなたのLINEアカウントでログイン</li>
            <li>登録しなくても、やることの確認はすべて利用できます</li>
          </ul>
        </TrustSection>

        <div className="pt-2 text-center">
          <Link
            href="/mypage"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            メニューに戻る
          </Link>
        </div>
      </main>
    </>
  );
}

function TrustSection({
  heading,
  id,
  children,
}: {
  heading: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="shadow-sm">
      <CardContent className="space-y-4 p-5">
        <h2 className="text-lg font-bold">{heading}</h2>
        <div className="space-y-3 text-base leading-relaxed">{children}</div>
      </CardContent>
    </Card>
  );
}
