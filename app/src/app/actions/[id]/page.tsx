import { notFound } from "next/navigation";
import { AlertCircle, FileText, Phone } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { ActionDetailFooter } from "@/components/actions/action-detail-footer";
import { getProcedureById } from "@/lib/procedures";

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const procedure = getProcedureById(id);

  if (!procedure) {
    notFound();
  }

  return (
    <>
      <SiteHeader title={procedure.title} showBack backHref="/actions" />
      <main className="space-y-5 px-4 py-4 pb-36">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-2 text-sm font-medium text-muted-foreground">やること</p>
          <h2 className="text-xl font-bold leading-snug">{procedure.title}</h2>
          <p className="mt-2 text-base leading-relaxed">{procedure.summary}</p>
        </section>

        <Section icon={FileText} title="持っていくもの">
          <ul className="space-y-2">
            {procedure.documents.length ? (
              procedure.documents.map((doc) => (
                <li key={doc} className="flex items-start gap-2 text-base text-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
                  <span>{doc}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">特に不要</li>
            )}
          </ul>
        </Section>

        <Section icon={AlertCircle} title="どこで・いつまで">
          <div className="space-y-3 text-base">
            <p>
              <span className="font-medium">場所：</span>
              {procedure.submissionPlace}
            </p>
            <p>
              <span className="font-medium">目安：</span>
              {procedure.deadline}
            </p>
          </div>
        </Section>

        {procedure.notes.length > 0 && (
          <Section icon={AlertCircle} title="覚えておくこと">
            <ul className="space-y-2">
              {procedure.notes.slice(0, 3).map((note) => (
                <li key={note} className="text-base leading-relaxed">
                  ・{note}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {procedure.contact && (
          <Section icon={Phone} title="電話で確認">
            <p className="text-base">{procedure.contact}</p>
          </Section>
        )}

        <p className="text-center text-xs text-muted-foreground">
          最新情報は自治体の公式情報で確認してください
        </p>
      </main>

      <ActionDetailFooter actionId={id} procedureTitle={procedure.title} />
    </>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-5">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}
