"use client";

import { useId, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  offerSavedPhotosToDeviceAlbum,
  savePhotosFromFiles,
} from "@/lib/case-management/photo-store";
import { useToast } from "@/providers/toast-provider";

/** 被害写真ページ用：ナビに残し、必要なら写真アプリにも残せる */
export function RecordsPhotoCapture({
  caseId,
  onSaved,
}: {
  caseId: string;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const cameraInputId = useId();
  const albumInputId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [copyingAlbum, setCopyingAlbum] = useState(false);
  const [pendingAlbumIds, setPendingAlbumIds] = useState<string[]>([]);

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

  async function handleFiles(fileList: FileList | null) {
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
        actionId: "rw-j03-photo",
        files,
      });
      setPendingAlbumIds(metas.map((m) => m.id));
      showToast(`${files.length}枚を残しました`);
      onSaved();
    } catch {
      showToast("保存できませんでした。もう一度お試しください");
    } finally {
      setSaving(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (albumRef.current) albumRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        id={cameraInputId}
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <input
        id={albumInputId}
        ref={albumRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="lg"
          className="h-14"
          disabled={saving}
          onClick={() => cameraRef.current?.click()}
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          {saving ? "残しています…" : "撮影する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14"
          disabled={saving}
          onClick={() => albumRef.current?.click()}
        >
          <ImagePlus className="h-5 w-5" />
          アルバムから
        </Button>
      </div>
      {pendingAlbumIds.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 px-3 py-3">
          <p className="text-sm font-medium">
            写真アプリにも、同じ写真を残しますか？
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="h-12"
              disabled={copyingAlbum}
              onClick={() => void copyToPhotoApp(pendingAlbumIds)}
            >
              {copyingAlbum ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : null}
              {copyingAlbum ? "開いています…" : "はい、残す"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              disabled={copyingAlbum}
              onClick={() => setPendingAlbumIds([])}
            >
              いまはしない
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
