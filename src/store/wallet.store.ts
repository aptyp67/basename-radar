import { create } from "zustand";
import {
  connect as wagmiConnect,
  disconnect as wagmiDisconnect,
  getAccount,
  watchAccount,
} from "@wagmi/core";
import { numberToHex } from "viem";
import { wagmiConfig, injectedConnector } from "../lib/wagmi";
import { WATCHLIST_CHAIN_ID } from "../services/watchlist.contract";
import { useUIStore } from "./ui.store";
import { isMetaMaskAvailable } from "../services/metamask";

interface WalletState {
  isInstalled: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  initialize: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
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
  let unsubscribeAccount: (() => void) | null = null;

  const addToast = useUIStore.getState().addToast;

  const ensureAvailability = (): boolean => {
    const available = isMetaMaskAvailable();
    set({ isInstalled: available });
    if (!available) {
      addToast({ variant: "error", message: "MetaMask extension is not detected" });
    }
    return available;
  };

  const applyAccountState = () => {
    const account = getAccount(wagmiConfig);
    const nextChainId = toChainIdHex(account.chainId);

    set({
      isInstalled: true,
      isConnected: account.isConnected,
      address: account.address ?? null,
      chainId: nextChainId,
    });
  };

  const handleAccountChange = () => {
    const previous = get();
    applyAccountState();
    const current = get();

    if (!previous.isConnected && current.isConnected) {
      addToast({ variant: "success", message: "Wallet connected" });
    }

    if (previous.isConnected && !current.isConnected) {
      addToast({ variant: "info", message: "Wallet disconnected" });
    }

    if (previous.address && current.address && previous.address !== current.address) {
      addToast({ variant: "info", message: "Switched MetaMask account" });
    }

    if (previous.chainId !== current.chainId && current.chainId) {
      addToast({ variant: "info", message: formatChainChangeMessage(current.chainId) });
    }
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

      applyAccountState();

      if (unsubscribeAccount) {
        unsubscribeAccount();
      }

      unsubscribeAccount = watchAccount(wagmiConfig, {
        onChange: handleAccountChange,
      });
    },
    connect: async () => {
      if (get().isConnecting) {
        return;
      }
      if (!ensureAvailability()) {
        return;
      }

      set({ isConnecting: true });
      try {
        await wagmiConnect(wagmiConfig, {
          connector: injectedConnector,
          chainId: WATCHLIST_CHAIN_ID,
        });
        applyAccountState();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to connect wallet";
        addToast({ variant: "error", message });
      } finally {
        set({ isConnecting: false });
      }
    },
    disconnect: async () => {
      const currentState = get();
      if (!currentState.isConnected) {
        return;
      }
      try {
        await wagmiDisconnect(wagmiConfig);
      } catch (error) {
        console.warn("Failed to disconnect wallet", error);
      } finally {
        applyAccountState();
      }
    },
  };
});

function toChainIdHex(chainId: number | undefined): string | null {
  if (typeof chainId !== "number") {
    return null;
  }
  try {
    return numberToHex(chainId);
  } catch (error) {
    console.warn("Unable to convert chain id to hex", chainId, error);
    return null;
  }
}

function formatChainChangeMessage(chainIdHex: string): string {
  try {
    const numericId = Number.parseInt(chainIdHex, 16);
    if (Number.isSafeInteger(numericId)) {
      return `Switched network (chain ${numericId})`;
    }
  } catch (error) {
    console.warn("Unable to format chain id", chainIdHex, error);
  }
  return `Switched network (${chainIdHex})`;
}
