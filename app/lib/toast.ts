"use client";

import { useSyncExternalStore } from "react";

export type ToastKind = "error" | "success" | "info";

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  for (const l of listeners) l();
}

/** Show a toast. Identical messages already on screen are de-duped so the
 *  4s polling loop can't flood the UI when the reactor is unreachable. */
export function toast(message: string, kind: ToastKind = "info") {
  if (toasts.some((t) => t.message === message && t.kind === kind)) return;
  const id = nextId++;
  toasts = [...toasts, { id, message, kind }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), kind === "error" ? 7000 : 3500);
  }
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    subscribe,
    () => toasts,
    () => toasts,
  );
}
