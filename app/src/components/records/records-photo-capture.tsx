"use client";

import { useId, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePhotosFromFiles } from "@/lib/case-management/photo-store";
import { useToast } from "@/providers/toast-provider";

/** 被害写真ページ用：端末内にだけ残す簡易撮影 */
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
      await savePhotosFromFiles({
        caseId,
        actionId: "rw-j03-photo",
        files,
      });
      showToast(`${files.length}枚を端末に残しました`);
      onSaved();
    } catch {
      showToast("保存できませんでした（端末の制限の可能性があります）");
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
          撮影する
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
      <p className="text-xs leading-relaxed text-muted-foreground">
        写真はサーバーに送らず、この端末の中だけに残します。容量や端末の負担が気になるときは、撮影をスキップして大丈夫です。
      </p>
    </div>
  );
}
