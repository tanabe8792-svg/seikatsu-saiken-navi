"use client";

import { use } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { CaseActionDetail } from "@/components/actions/case-action-detail";

export default function CaseActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <SiteHeader title="確認する" showBack backHref="/actions" />
      <main className="px-4 py-4">
        <CaseActionDetail actionId={id} />
      </main>
    </>
  );
}
