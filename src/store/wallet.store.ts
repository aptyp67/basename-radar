import { create } from "zustand";
import { useUIStore } from "./ui.store";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
}

function generateMockAddress(): string {
  const source = typeof crypto !== "undefined" && "getRandomValues" in crypto
    ? crypto.getRandomValues(new Uint8Array(20))
    : Uint8Array.from({ length: 20 }, () => Math.floor(Math.random() * 256));
  return `0x${Array.from(source, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  connect: () => {
    if (get().isConnected) {
      return;
    }
    const address = generateMockAddress();
    set({ isConnected: true, address });
    useUIStore.getState().addToast({ variant: "success", message: "Wallet connected" });
  },
  disconnect: () => {
    if (!get().isConnected) {
      return;
    }
    set({ isConnected: false, address: null });
    useUIStore.getState().addToast({ variant: "info", message: "Wallet disconnected" });
  },
}));
