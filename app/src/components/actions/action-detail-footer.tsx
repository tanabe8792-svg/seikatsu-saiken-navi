"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserSession } from "@/hooks/use-user-session";
import { useToast } from "@/providers/toast-provider";
import { getRandomCompletionMessage } from "@/lib/deadline";
import {
  getActionDetailPath,
  getNextIncompleteAction,
} from "@/lib/navigation";

interface ActionDetailFooterProps {
  actionId: string;
  procedureTitle: string;
}

export function ActionDetailFooter({
  actionId,
  procedureTitle,
}: ActionDetailFooterProps) {
  const router = useRouter();
  const { session, toggleAction } = useUserSession();
  const { showToast } = useToast();

  const action = session.actions.find(
    (a) => a.procedureId === actionId || a.id === actionId
  );
  const nextAction = getNextIncompleteAction(session.actions, actionId);

  function handleComplete() {
    if (!action) return;
    toggleAction(action.id, true);
    showToast(getRandomCompletionMessage());
    if (nextAction) {
      router.push(getActionDetailPath(nextAction));
    } else {
      router.push("/");
    }
  }

  if (!action) {
    return (
      <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-40">
        <div className="pointer-events-auto border-t bg-background p-4 safe-bottom">
          <div className="mx-auto max-w-lg">
            <Button asChild className="h-14 w-full text-lg">
              <Link href="/start">状況を選んでやることを作る</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-40">
      <div className="pointer-events-auto border-t bg-background p-4 safe-bottom">
        <div className="mx-auto flex max-w-lg gap-2">
          {!action.completed ? (
            <Button
              className="h-14 flex-1 text-lg"
              onClick={handleComplete}
            >
              完了した
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="h-14 flex-1 text-lg"
              onClick={() => toggleAction(action.id, false)}
            >
              未完了に戻す
            </Button>
          )}
          {nextAction && (
            <Button
              asChild
              variant="outline"
              className="h-14 flex-1 text-base"
            >
              <Link href={getActionDetailPath(nextAction)}>
                次へ
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
        <p className="mx-auto mt-2 max-w-lg truncate text-center text-xs text-muted-foreground">
          {procedureTitle}
        </p>
      </div>
    </div>
  );
}
