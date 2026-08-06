"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EvidenceInput } from "@/lib/case-management/evidence";
import {
  listPhotosForAction,
  savePhotosFromFiles,
  type StoredPhotoMeta,
} from "@/lib/case-management/photo-store";
import { useToast } from "@/providers/toast-provider";

interface PendingPreview {
  key: string;
  file: File;
  url: string;
}

interface PhotoEvidenceCaptureProps {
  caseId: string;
  actionId: string;
  onSubmitEvidence: (actionId: string, evidence: EvidenceInput) => void;
  alreadyHasEvidence?: boolean;
}

export function PhotoEvidenceCapture({
  caseId,
  actionId,
  onSubmitEvidence,
  alreadyHasEvidence = false,
}: PhotoEvidenceCaptureProps) {
  const { showToast } = useToast();
  const cameraInputId = useId();
  const albumInputId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingPreview[]>([]);
  const [saved, setSaved] = useState<StoredPhotoMeta[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingSaved(true);
    void listPhotosForAction(caseId, actionId)
      .then((rows) => {
        if (!cancelled) setSaved(rows);
      })
      .catch(() => {
        if (!cancelled) setSaved([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, actionId]);

  useEffect(() => {
    return () => {
      for (const item of pending) {
        URL.revokeObjectURL(item.url);
      }
    };
  }, [pending]);

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const next: PendingPreview[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({
        key: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      });
    }
    if (next.length === 0) {
      showToast("画像ファイルを選んでください");
      return;
    }
    setPending((prev) => [...prev, ...next].slice(0, 20));
  }

  function removePending(key: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.key !== key);
    });
  }

  async function handleSave() {
    if (pending.length === 0) {
      showToast("先に写真を撮るか選んでください");
      return;
    }
    setSaving(true);
    try {
      const metas = await savePhotosFromFiles({
        caseId,
        actionId,
        files: pending.map((p) => p.file),
      });
      for (const item of pending) {
        URL.revokeObjectURL(item.url);
      }
      setPending([]);
      const refreshed = await listPhotosForAction(caseId, actionId);
      setSaved(refreshed);

      const evidence: EvidenceInput = {
        type: "photo",
        metadata: {
          source: "device_camera_v1",
          photoIds: metas.map((m) => m.id),
          count: metas.length,
          description: "端末で撮影・保存した被害写真",
          storedOnDevice: true,
        },
      };
      onSubmitEvidence(actionId, evidence);
      showToast(
        alreadyHasEvidence
          ? `${metas.length}枚を追加保存しました`
          : `${metas.length}枚の写真を端末に残しました`
      );
    } catch (error) {
      console.error(error);
      showToast("写真の保存に失敗しました。もう一度お試しください");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card id="photo-evidence-capture" className="border-primary/40 bg-primary/5">
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-base font-semibold">被害の写真を残す</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            カメラが起動します。撮った写真はこの端末に保存され、あとからこのサイトで見返せます。
          </p>
        </div>

        <input
          id={cameraInputId}
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          id={albumInputId}
          ref={albumRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            size="lg"
            className="h-14 w-full text-base"
            onClick={() => cameraRef.current?.click()}
            disabled={saving}
          >
            <Camera className="h-5 w-5" />
            カメラで撮る
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-14 w-full text-base"
            onClick={() => albumRef.current?.click()}
            disabled={saving}
          >
            <ImagePlus className="h-5 w-5" />
            アルバムから選ぶ
          </Button>
        </div>

        {pending.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              いま選んだ写真（{pending.length}枚）
            </p>
            <ul className="grid grid-cols-3 gap-2">
              {pending.map((item) => (
                <li
                  key={item.key}
                  className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt="撮影した写真のプレビュー"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="この写真をやめる"
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow"
                    onClick={() => removePending(item.key)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="lg"
              className="h-12 w-full"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  保存中…
                </>
              ) : (
                <>この写真を端末に残す</>
              )}
            </Button>
          </div>
        )}

        <div className="rounded-lg border bg-background/70 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          写真はサーバーには送りません。この端末の中だけに残ります。機種変更やデータ消去の前に、必要ならアルバムにもコピーしてください。
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">この手順で残した写真</p>
            <Link
              href="/records"
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              すべて見返す
            </Link>
          </div>
          {loadingSaved ? (
            <p className="text-sm text-muted-foreground">読み込み中…</p>
          ) : saved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              まだ写真はありません。上のボタンから撮れます。
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {saved.length}枚がこの端末に残っています。
              {alreadyHasEvidence ? " 記録は反映済みです。" : ""}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** 見返し画面用の1枚表示（blob URL） */
export function StoredPhotoThumb({
  photoId,
  alt,
  onDelete,
  onDownload,
}: {
  photoId: string;
  alt: string;
  onDelete?: () => void;
  onDownload?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    void import("@/lib/case-management/photo-store").then(({ getPhotoBlob }) =>
      getPhotoBlob(photoId).then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
    );
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          …
        </div>
      )}
      <div className="absolute bottom-1 right-1 flex gap-1">
        {onDownload && (
          <button
            type="button"
            aria-label="アルバムに保存"
            className="rounded-full bg-background/90 p-1.5 shadow"
            onClick={onDownload}
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            aria-label="この写真を削除"
            className="rounded-full bg-background/90 p-1.5 shadow"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
