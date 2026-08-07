"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EvidenceInput } from "@/lib/case-management/evidence";
import {
  listPhotosForAction,
  offerSavedPhotosToDeviceAlbum,
  savePhotosFromFiles,
  type StoredPhotoMeta,
} from "@/lib/case-management/photo-store";
import { useToast } from "@/providers/toast-provider";

interface PhotoEvidenceCaptureProps {
  caseId: string;
  actionId: string;
  onSubmitEvidence: (actionId: string, evidence: EvidenceInput) => void;
  alreadyHasEvidence?: boolean;
  /** 手順ガイドのあとに表示するとき用 */
  stepNumber?: number;
}

export function PhotoEvidenceCapture({
  caseId,
  actionId,
  onSubmitEvidence,
  alreadyHasEvidence = false,
  stepNumber = 3,
}: PhotoEvidenceCaptureProps) {
  const { showToast } = useToast();
  const cameraInputId = useId();
  const albumInputId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState<StoredPhotoMeta[]>([]);
  const [saving, setSaving] = useState(false);
  const [copyingAlbum, setCopyingAlbum] = useState(false);
  const [pendingAlbumIds, setPendingAlbumIds] = useState<string[]>([]);
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

  async function copyToPhotoApp(photoIds: string[]) {
    if (photoIds.length === 0 || copyingAlbum) return;
    setCopyingAlbum(true);
    try {
      const album = await offerSavedPhotosToDeviceAlbum(photoIds);
      if (album.cancelled) {
        showToast("やめました。また残したくなったら、下のボタンからどうぞ");
        return;
      }
      if (album.ok > 0) {
        showToast("写真アプリへの保存を案内しました");
        setPendingAlbumIds([]);
        return;
      }
      showToast("うまくいきませんでした。もう一度お試しください");
    } catch {
      showToast("うまくいきませんでした。もう一度お試しください");
    } finally {
      setCopyingAlbum(false);
    }
  }

  async function saveFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) {
      showToast("画像ファイルを選んでください");
      return;
    }

    setSaving(true);
    try {
      const metas = await savePhotosFromFiles({
        caseId,
        actionId,
        files: files.slice(0, 20),
      });
      const refreshed = await listPhotosForAction(caseId, actionId);
      setSaved(refreshed);

      const evidence: EvidenceInput = {
        type: "photo",
        metadata: {
          source: "device_camera_v1",
          photoIds: metas.map((m) => m.id),
          count: metas.length,
          description: "端末で撮影・保存した写真",
          storedOnDevice: true,
        },
      };
      onSubmitEvidence(actionId, evidence);

      setPendingAlbumIds(metas.map((m) => m.id));
      showToast(
        alreadyHasEvidence || refreshed.length > metas.length
          ? `${metas.length}枚を追加しました`
          : `${metas.length}枚を残しました`
      );
    } catch (error) {
      console.error(error);
      showToast("写真の保存に失敗しました。もう一度お試しください");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      id="photo-evidence-capture"
      className="border-2 border-brand-green/40 bg-card shadow-sm"
    >
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs font-medium text-brand-green">
            手順 {stepNumber}（撮影）
          </p>
          <h3 className="mt-1 text-base font-semibold">カメラで撮って残す</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            撮ると、このナビにすぐ残ります。何度でも追加できます。
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
            void saveFiles(e.target.files);
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
            void saveFiles(e.target.files);
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
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            {saving ? "残しています…" : "カメラで撮る"}
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

        {pendingAlbumIds.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-border bg-muted/30 px-3 py-3">
            <p className="text-sm font-medium">
              写真アプリにも、同じ写真を残しますか？
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                size="lg"
                className="h-12 w-full"
                disabled={copyingAlbum}
                onClick={() => void copyToPhotoApp(pendingAlbumIds)}
              >
                {copyingAlbum ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : null}
                {copyingAlbum ? "開いています…" : "残す"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="h-12 w-full"
                disabled={copyingAlbum}
                onClick={() => setPendingAlbumIds([])}
              >
                残さない
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              残した写真
              {!loadingSaved && saved.length > 0 ? `（${saved.length}枚）` : ""}
            </p>
            <Link
              href="/records"
              className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              すべて見返す
            </Link>
          </div>
          {loadingSaved ? (
            <p className="text-sm text-muted-foreground">読み込み中…</p>
          ) : saved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              まだありません。上のボタンから撮ると、すぐに残ります。
            </p>
          ) : (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              {saved.length}枚残っています。追加で撮っても大丈夫です。
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
