"use client";

import { useId, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  offerSavedPhotosToDeviceAlbum,
  savePhotosFromFiles,
} from "@/lib/case-management/photo-store";
import { useToast } from "@/providers/toast-provider";

/** 被害写真ページ用：サイトに残し、撮影時は写真アプリにも同じ写真を残せる */
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
  const sourceRef = useRef<"camera" | "album">("camera");
  const [saving, setSaving] = useState(false);
  const [copyingAlbum, setCopyingAlbum] = useState(false);
  const [pendingAlbumIds, setPendingAlbumIds] = useState<string[]>([]);

  async function copyToPhotoApp(photoIds: string[]) {
    if (photoIds.length === 0) return;
    setCopyingAlbum(true);
    try {
      const album = await offerSavedPhotosToDeviceAlbum(photoIds);
      if (album.cancelled) {
        showToast(
          "キャンセルされました。下のボタンから、もう一度写真アプリに残せます"
        );
        setPendingAlbumIds(photoIds);
        return;
      }
      if (album.ok > 0 && album.mode === "shared") {
        showToast(
          "共有画面で「画像を保存」を選ぶと、写真アプリに同じ写真が残ります"
        );
        setPendingAlbumIds([]);
        return;
      }
      if (album.ok > 0) {
        showToast("端末へのコピーを開始しました");
        setPendingAlbumIds([]);
        return;
      }
      showToast("写真アプリへの保存ができませんでした。下のボタンから再試行できます");
      setPendingAlbumIds(photoIds);
    } catch {
      showToast("写真アプリへの保存に失敗しました");
      setPendingAlbumIds(photoIds);
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
    const fromCamera = sourceRef.current === "camera";
    setSaving(true);
    try {
      const metas = await savePhotosFromFiles({
        caseId,
        actionId: "rw-j03-photo",
        files,
      });
      const ids = metas.map((m) => m.id);
      setPendingAlbumIds(fromCamera ? ids : []);
      showToast(`${files.length}枚をこのサイトに残しました`);
      onSaved();
      setSaving(false);
      if (fromCamera) {
        showToast("続けて、同じ写真を写真アプリにも残す画面を開きます");
        await copyToPhotoApp(ids);
      }
    } catch {
      showToast("保存できませんでした。もう一度お試しください");
      setSaving(false);
    } finally {
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
          disabled={saving || copyingAlbum}
          onClick={() => {
            sourceRef.current = "camera";
            cameraRef.current?.click();
          }}
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          {saving ? "サイトに残しています…" : "撮影する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14"
          disabled={saving || copyingAlbum}
          onClick={() => {
            sourceRef.current = "album";
            albumRef.current?.click();
          }}
        >
          <ImagePlus className="h-5 w-5" />
          アルバムから
        </Button>
      </div>
      {pendingAlbumIds.length > 0 ? (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12 w-full"
          disabled={copyingAlbum}
          onClick={() => void copyToPhotoApp(pendingAlbumIds)}
        >
          {copyingAlbum ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          {copyingAlbum
            ? "写真アプリを開いています…"
            : "写真アプリにも同じ写真を残す"}
        </Button>
      ) : null}
      <p className="text-xs leading-relaxed text-muted-foreground">
        撮るとサイトにすぐ残ります。続けて写真アプリにも残す画面が開きます。iPhoneでは「画像を保存」を選んでください。
      </p>
    </div>
  );
}
