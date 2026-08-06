"use client";

import { useState } from "react";
import { useUserSession } from "@/hooks/use-user-session";

export function HomePageHeading() {
  const { session, loading } = useUserSession();
  const [showPostJ00Welcome] = useState(
    () => session.showPostJ00Welcome === true
  );

  if (loading || !showPostJ00Welcome || !session.caseFile) {
    return null;
  }

  return (
    <h1 className="mb-4 text-2xl font-bold leading-tight">あなたの状況</h1>
  );
}
