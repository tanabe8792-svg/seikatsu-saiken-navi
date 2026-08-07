/** ブラウザのオンライン状態（SSR では true 扱い） */

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function subscribeOnlineStatus(
  onChange: (online: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
