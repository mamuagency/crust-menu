import { useSyncExternalStore } from "react";

export interface UploadItem {
  id: string;
  name: string;
  percent: number;
  status: "uploading" | "done" | "error";
}

let items: UploadItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  items = [...items];
  listeners.forEach((l) => l());
}

export function startUploads(list: { id: string; name: string }[]) {
  items = list.map((i) => ({ ...i, percent: 0, status: "uploading" as const }));
  emit();
}

export function updateUpload(id: string, patch: Partial<UploadItem>) {
  items = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
  emit();
}

export function clearUploads(delay = 0) {
  setTimeout(() => {
    items = [];
    emit();
  }, delay);
}

export function useUploads(): UploadItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
    () => items,
  );
}
