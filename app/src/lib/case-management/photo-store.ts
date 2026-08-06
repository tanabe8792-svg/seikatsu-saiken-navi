/**
 * 被害写真の端末内保存（IndexedDB）
 * CaseFile の Evidence.metadata.photoIds から参照する。
 * サーバーへは送らない。端末を消すと見返せなくなる点を UI で伝える。
 */

const DB_NAME = "seikatsu-saiken-navi-photos";
const DB_VERSION = 1;
const STORE = "photos";

export interface StoredPhotoMeta {
  id: string;
  caseId: string;
  actionId: string;
  evidenceId?: string;
  createdAt: string;
  mimeType: string;
  byteLength: number;
  label?: string;
}

export interface StoredPhoto extends StoredPhotoMeta {
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("この端末では写真の保存に対応していません"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("caseId", "caseId", { unique: false });
        store.createIndex("actionId", "actionId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("写真DBを開けませんでした"));
  });
}

function createPhotoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `ph-${crypto.randomUUID()}`;
  }
  return `ph-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 端末容量のため、大きすぎる画像は縮小して JPEG 化する */
export async function compressImageFile(
  file: File,
  maxEdge = 1600,
  quality = 0.72
): Promise<{ blob: Blob; mimeType: string }> {
  if (!file.type.startsWith("image/")) {
    return { blob: file, mimeType: file.type || "application/octet-stream" };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { blob: file, mimeType: file.type };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) {
    return { blob: file, mimeType: file.type };
  }
  return { blob, mimeType: "image/jpeg" };
}

export async function savePhotosFromFiles(params: {
  caseId: string;
  actionId: string;
  files: File[];
  labels?: string[];
}): Promise<StoredPhotoMeta[]> {
  const db = await openDb();
  const saved: StoredPhotoMeta[] = [];

  try {
    for (let i = 0; i < params.files.length; i++) {
      const file = params.files[i];
      const { blob, mimeType } = await compressImageFile(file);
      const meta: StoredPhoto = {
        id: createPhotoId(),
        caseId: params.caseId,
        actionId: params.actionId,
        createdAt: new Date().toISOString(),
        mimeType,
        byteLength: blob.size,
        label: params.labels?.[i],
        blob,
      };
      await putPhoto(db, meta);
      saved.push({
        id: meta.id,
        caseId: meta.caseId,
        actionId: meta.actionId,
        createdAt: meta.createdAt,
        mimeType: meta.mimeType,
        byteLength: meta.byteLength,
        label: meta.label,
      });
    }
  } finally {
    db.close();
  }

  return saved;
}

function putPhoto(db: IDBDatabase, photo: StoredPhoto): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(photo);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("写真の保存に失敗しました"));
  });
}

export async function listPhotosForCase(
  caseId: string
): Promise<StoredPhotoMeta[]> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const index = tx.objectStore(STORE).index("caseId");
      const req = index.getAll(caseId);
      req.onsuccess = () => {
        const rows = (req.result as StoredPhoto[]).map(
          ({ blob: _blob, ...meta }) => meta
        );
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        resolve(rows);
      };
      req.onerror = () =>
        reject(req.error ?? new Error("写真一覧を取得できませんでした"));
    });
  } finally {
    db.close();
  }
}

export async function listPhotosForAction(
  caseId: string,
  actionId: string
): Promise<StoredPhotoMeta[]> {
  const all = await listPhotosForCase(caseId);
  return all.filter((p) => p.actionId === actionId);
}

export async function getPhotoBlob(photoId: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(photoId);
      req.onsuccess = () => {
        const row = req.result as StoredPhoto | undefined;
        resolve(row?.blob ?? null);
      };
      req.onerror = () =>
        reject(req.error ?? new Error("写真を読み込めませんでした"));
    });
  } finally {
    db.close();
  }
}

export async function deletePhoto(photoId: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(photoId);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("写真の削除に失敗しました"));
    });
  } finally {
    db.close();
  }
}

export async function clearPhotosForCase(caseId: string): Promise<void> {
  const photos = await listPhotosForCase(caseId);
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const photo of photos) {
        store.delete(photo.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("写真の一括削除に失敗しました"));
    });
  } finally {
    db.close();
  }
}

export async function downloadPhotoToDevice(
  photoId: string,
  filename?: string
): Promise<boolean> {
  const blob = await getPhotoBlob(photoId);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `被害写真-${photoId}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

export async function clearAllPhotos(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("写真の全削除に失敗しました"));
    });
  } finally {
    db.close();
  }
}

