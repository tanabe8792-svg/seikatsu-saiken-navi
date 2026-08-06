"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AuthCallbackInner from "./callback-inner";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
