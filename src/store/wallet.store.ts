import { create } from "zustand";
import {
  connectMetaMask,
  getAccounts,
  getChainId,
  isMetaMaskAvailable,
  onAccountsChanged,
  onChainChanged,
  onDisconnect,
} from "../services/metamask";
import { useUIStore } from "./ui.store";

interface WalletState {
  isInstalled: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  initialize: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const INITIAL_STATE = {
  isInstalled: false,
  isConnecting: false,
  isConnected: false,
  address: null,
  chainId: null,
} satisfies Omit<WalletState, "initialize" | "connect" | "disconnect">;

export const useWalletStore = create<WalletState>((set, get) => {
  let hasInitialized = false;
  let unsubscribeAccounts: (() => void) | null = null;

  const addToast = useUIStore.getState().addToast;

  const registerListeners = () => {
    if (unsubscribeAccounts || !isMetaMaskAvailable()) {
      return;
    }

    unsubscribeAccounts = onAccountsChanged((accounts) => {
      const currentState = get();
      if (accounts.length === 0) {
        if (!currentState.isConnected) {
          return;
        }
        set({ isConnected: false, address: null });
        addToast({ variant: "info", message: "Wallet disconnected" });
        return;
      }

      const [nextAddress] = accounts;
      if (!nextAddress) {
        return;
      }

      if (currentState.address === nextAddress) {
        return;
      }

      set({
        isConnected: true,
        address: nextAddress,
        chainId: currentState.chainId,
      });

      if (currentState.isConnected) {
        addToast({ variant: "info", message: "Switched MetaMask account" });
      }
    });

    onChainChanged((chainId) => {
      const currentChainId = get().chainId;
      if (currentChainId === chainId) {
        return;
      }
      set({ chainId });
      if (get().isConnected) {
        addToast({ variant: "info", message: formatChainChangeMessage(chainId) });
      }
    });

    onDisconnect(() => {
      const currentState = get();
      if (!currentState.isConnected && !currentState.address) {
        return;
      }
      set({ isConnected: false, address: null });
      addToast({ variant: "info", message: "Wallet disconnected" });
    });
  };

  const ensureAvailability = (): boolean => {
    const available = isMetaMaskAvailable();
    set({ isInstalled: available });
    if (!available) {
      addToast({ variant: "error", message: "MetaMask extension is not detected" });
      return false;
    }
    return true;
  };

  return {
    ...INITIAL_STATE,
    initialize: async () => {
      if (hasInitialized) {
        return;
      }
      hasInitialized = true;

      const available = isMetaMaskAvailable();
      set({ isInstalled: available });
      if (!available) {
        return;
      }

      registerListeners();
      try {
        const accounts = await getAccounts();
        const chainId = await getChainId();
        if (accounts.length > 0) {
          set({
            isConnected: true,
            address: accounts[0] ?? null,
            chainId,
          });
        } else {
          set({
            isConnected: false,
            address: null,
            chainId,
          });
        }
      } catch (error) {
        console.warn("Failed to initialize MetaMask connection", error);
      }
    },
    connect: async () => {
      if (get().isConnecting) {
        return;
      }

      if (!ensureAvailability()) {
        return;
      }

      registerListeners();
      set({ isConnecting: true });

      try {
        const { address, chainId } = await connectMetaMask();
        set({
          isConnected: true,
          address,
          chainId,
          isInstalled: true,
        });
        addToast({ variant: "success", message: "Wallet connected" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to connect wallet";
        addToast({ variant: "error", message });
      } finally {
        set({ isConnecting: false });
      }
    },
    disconnect: () => {
      const currentState = get();
      if (!currentState.isConnected) {
        return;
      }
      set({ isConnected: false, address: null });
      addToast({ variant: "info", message: "Wallet disconnected" });
    },
  };
});

function formatChainChangeMessage(chainId: string | null): string {
  if (!chainId) {
    return "Switched network";
  }
  try {
    const numericId = Number.parseInt(chainId, 16);
    if (Number.isSafeInteger(numericId)) {
      return `Switched network (chain ${numericId})`;
    }
  } catch (error) {
    console.warn("Unable to format chain id", chainId, error);
  }
  return `Switched network (${chainId})`;
}
