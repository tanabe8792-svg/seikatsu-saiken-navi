"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { StoredPhotoThumb } from "@/components/actions/photo-evidence-capture";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActionWalkthrough } from "@/lib/case-management/action-walkthrough";
import {
  clearPhotosForCase,
  deletePhoto,
  downloadPhotoToDevice,
  listPhotosForCase,
  type StoredPhotoMeta,
} from "@/lib/case-management/photo-store";
import { getCaseActionDetailPath } from "@/lib/navigation";
import { useUserSession } from "@/hooks/use-user-session";
import { useToast } from "@/providers/toast-provider";

export default function RecordsPage() {
  const { session, loading } = useUserSession();
  const { showToast } = useToast();
  const caseId = session.caseFile?.caseId;
  const [photos, setPhotos] = useState<StoredPhotoMeta[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const refresh = useCallback(async () => {
    if (!caseId) {
      setPhotos([]);
      return;
    }
    setLoadingPhotos(true);
    try {
      setPhotos(await listPhotosForCase(caseId));
    } catch {
      setPhotos([]);
      showToast("写真を読み込めませんでした");
    } finally {
      setLoadingPhotos(false);
    }
  }, [caseId, showToast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleDelete(photoId: string) {
    if (!window.confirm("この写真を端末から削除しますか？")) return;
    try {
      await deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      showToast("写真を削除しました");
    } catch {
      showToast("削除に失敗しました");
    }
  }

  async function handleDownload(photoId: string) {
    try {
      const ok = await downloadPhotoToDevice(photoId);
      showToast(
        ok
          ? "端末への保存を開始しました（アルバム／ダウンロード）"
          : "保存できませんでした"
      );
    } catch {
      showToast("保存に失敗しました");
    }
  }

  async function handleClearAll() {
    if (!caseId) return;
    if (
      !window.confirm(
        "この端末に残した被害写真をすべて削除します。よろしいですか？"
      )
    ) {
      return;
    }
    try {
      await clearPhotosForCase(caseId);
      setPhotos([]);
      showToast("写真をすべて削除しました");
    } catch {
      showToast("削除に失敗しました");
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader title="被害写真" />
        <div className="flex min-h-[60vh] items-center justify-center" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const grouped = photos.reduce<Record<string, StoredPhotoMeta[]>>((acc, p) => {
    (acc[p.actionId] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <SiteHeader title="被害写真" showBack />
      <main className="space-y-5 px-4 py-4 pb-28">
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="space-y-2 p-5">
            <p className="text-base font-semibold">端末に残した写真</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              撮った写真はサーバーには送らず、この端末の中だけに残しています。窓口・保険の相談前にここから見返せます。
            </p>
          </CardContent>
        </Card>

        {!caseId ? (
          <p className="text-sm text-muted-foreground">
            まず状況入力を終えると、写真を残せます。
          </p>
        ) : loadingPhotos ? (
          <div className="flex justify-center py-10" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                まだ写真はありません。「被害の様子を写真に残す」からカメラで撮れます。
              </p>
              <Button asChild size="lg" className="h-12 w-full">
                <Link href={getCaseActionDetailPath("rw-j03-photo")}>
                  <Camera className="h-5 w-5" />
                  写真を撮る手順へ
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              合計 {photos.length} 枚
            </p>
            {Object.entries(grouped).map(([actionId, rows]) => {
              const title = getActionWalkthrough(actionId, "記録").plainTitle;
              return (
                <section key={actionId} className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <Link
                      href={getCaseActionDetailPath(actionId)}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      手順へ
                    </Link>
                  </div>
                  <ul className="grid grid-cols-3 gap-2">
                    {rows.map((photo) => (
                      <li key={photo.id}>
                        <StoredPhotoThumb
                          photoId={photo.id}
                          alt={`${title}の写真`}
                          onDownload={() => void handleDownload(photo.id)}
                          onDelete={() => void handleDelete(photo.id)}
                        />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(photo.createdAt).toLocaleString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void handleClearAll()}
            >
              端末の写真をすべて削除
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
