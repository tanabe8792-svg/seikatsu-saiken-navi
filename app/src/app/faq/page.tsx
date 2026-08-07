import { SiteHeader } from "@/components/layout/site-header";
import { FaqChecklist } from "@/components/faq/faq-checklist";

export default function FaqPage() {
  return (
    <>
      <SiteHeader title="よくある質問" showBack backHref="/mypage" />
      <main className="space-y-6 px-4 py-6 pb-28">
        <FaqChecklist />
      </main>
    </>
  );
}
