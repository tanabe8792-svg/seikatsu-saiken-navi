import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/lib/faq";

export default function FaqPage() {
  return (
    <>
      <SiteHeader title="よくある質問" showBack backHref="/mypage" />
      <main className="space-y-6 px-4 py-6 pb-28">
        {FAQ_CATEGORIES.map((category) => (
          <section key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">{category}</h2>
            {FAQ_ITEMS.filter((item) => item.category === category).map(
              (item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Q. {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      A. {item.answer}
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </section>
        ))}

        <Button asChild variant="outline" className="w-full">
          <Link href="/chat">AI相談で質問する</Link>
        </Button>
      </main>
    </>
  );
}
