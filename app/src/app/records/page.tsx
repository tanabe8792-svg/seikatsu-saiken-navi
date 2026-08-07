"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { StoredPhotoThumb } from "@/components/actions/photo-evidence-capture";
import { RecordsPhotoCapture } from "@/components/records/records-photo-capture";
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
  const photoAction =
    session.caseFile?.pendingActions.find((a) => a.id === "rw-j03-photo") ??
    session.caseFile?.completedActions.find((a) => a.id === "rw-j03-photo");
  const [photos, setPhotos] = useState<StoredPhotoMeta[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    if (!caseId) {
      setPhotos([]);
      setLoadError(false);
      return;
    }
    setLoadingPhotos(true);
    setLoadError(false);
    try {
      setPhotos(await listPhotosForCase(caseId));
    } catch {
      setPhotos([]);
      setLoadError(true);
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
          ? "端末へのコピーを開始しました（保存先は機種により異なります）"
          : "コピーできませんでした"
      );
    } catch {
      showToast("保存に失敗しました");
    }
  }

  async function handleClearAll() {
    if (!caseId) return;
    if (
      !window.confirm(
        "この端末に残した写真をすべて削除します。よろしいですか？"
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
        <SiteHeader title="記録した写真" />
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
      <SiteHeader title="記録した写真" showBack />
      <main className="space-y-5 px-4 py-4 pb-28">
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-5">
            <p className="text-base font-semibold">端末に残した写真</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              住まいの様子など、あとで窓口や保険の相談に使える写真を、この端末の中だけに残せます。サーバーには送りません。家族とケースを共有しても、写真は自動では相手に届きません（共有相手からも見られる保存は今後追加予定）。
            </p>
            {caseId && (
              <RecordsPhotoCapture
                caseId={caseId}
                onSaved={() => void refresh()}
              />
            )}
          </CardContent>
        </Card>

        {!caseId ? (
          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                まだ状況の入力が終わっていないため、写真の見返しは使えません。
              </p>
              <Button asChild size="lg" className="h-12 w-full">
                <Link href="/start">質問をはじめる</Link>
              </Button>
            </CardContent>
          </Card>
        ) : loadingPhotos ? (
          <div className="flex justify-center py-10" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : loadError ? (
          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                写真の読み込みに失敗しました。プライベートブラウズや端末の制限が原因のことがあります。
              </p>
              <Button
                size="lg"
                className="h-12 w-full"
                onClick={() => void refresh()}
              >
                もう一度読み込む
              </Button>
            </CardContent>
          </Card>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-base font-semibold">まだ写真はありません</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                上の「撮影する」から残せます。撮っていない場合、ここに何も出ないのが正常です。
              </p>
              {photoAction && (
                <Button asChild variant="outline" size="lg" className="h-12 w-full">
                  <Link href={getCaseActionDetailPath(photoAction.id)}>
                    <Camera className="h-5 w-5" />
                    やることの手順でも確認
                  </Link>
                </Button>
              )}
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
