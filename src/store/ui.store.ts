import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface Metrics {
  registerClicks: number;
  watchClicks: number;
  filterChanges: number;
  lastApiLatencyMs: number | null;
  renderedCards: number;
  averageScore: number;
}

interface UIState {
  toasts: ToastItem[];
  metrics: Metrics;
  addToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
  trackEvent: (event: keyof Omit<Metrics, "lastApiLatencyMs" | "renderedCards" | "averageScore">) => void;
  setApiLatency: (ms: number) => void;
  setDebugSnapshot: (payload: Pick<Metrics, "renderedCards" | "averageScore">) => void;
}

let toastIncrement = 0;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  metrics: {
    registerClicks: 0,
    watchClicks: 0,
    filterChanges: 0,
    lastApiLatencyMs: null,
    renderedCards: 0,
    averageScore: 0,
  },
  addToast: (toast) => {
    const id = `toast-${toastIncrement += 1}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  trackEvent: (event) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        [event]: state.metrics[event] + 1,
      },
    })),
  setApiLatency: (ms) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        lastApiLatencyMs: ms,
      },
    })),
  setDebugSnapshot: (payload) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        renderedCards: payload.renderedCards,
        averageScore: payload.averageScore,
      },
    })),
}));
