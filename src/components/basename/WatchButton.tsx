import { useMemo } from "react";
import { Button } from "../ui/Button";
import { useUIStore } from "../../store/ui.store";
import { useWalletStore } from "../../store/wallet.store";
import { useToggleWatch } from "../../hooks/useWatchlist";
import { WATCHLIST_CHAIN_ID } from "../../services/watchlist.contract";
import { appNetwork } from "../../config/network";

interface WatchButtonProps {
  name: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

function formatHash(hash: `0x${string}`): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export function WatchButton({ name, fullWidth, disabled = false }: WatchButtonProps) {
  const addToast = useUIStore((state) => state.addToast);
  const trackEvent = useUIStore((state) => state.trackEvent);
  const isConnected = useWalletStore((state) => state.isConnected);
  const connectWallet = useWalletStore((state) => state.connect);
  const isConnecting = useWalletStore((state) => state.isConnecting);
  const chainId = useWalletStore((state) => state.chainId);
  const requiredChainLabel = appNetwork.label;

  const { watch, unwatch, isPending, isWatching } = useToggleWatch(name);
  const isOnRequiredChain = useMemo(() => {
    if (!chainId) {
      return true;
    }
    const requiredChainHex = `0x${WATCHLIST_CHAIN_ID.toString(16)}`;
    return chainId.toLowerCase() === requiredChainHex;
  }, [chainId]);

  const busy = disabled || isPending || isConnecting;

  const label = useMemo(() => {
    if (!isConnected) {
      return isConnecting ? "Connecting…" : isWatching ? "Watching" : "Watch";
    }
    if (isPending) {
      return "Saving…";
    }
    return isWatching ? "Watching" : "Watch";
  }, [isConnected, isPending, isWatching, isConnecting]);

  const handleClick = async () => {
    if (disabled) {
      return;
    }

    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!isOnRequiredChain) {
      addToast({ variant: "error", message: `Switch to ${requiredChainLabel} to manage your watchlist` });
      return;
    }

    try {
      trackEvent("watchClicks");
      const hash = isWatching ? await unwatch() : await watch();
      addToast({
        variant: "success",
        message: isWatching
          ? `${name} removed from watchlist (${formatHash(hash)})`
          : `${name} added to watchlist (${formatHash(hash)})`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update watchlist";
      addToast({ variant: "error", message });
    }
  };

  const variant = isWatching ? "success" : "secondary";

  return (
    <Button type="button" variant={variant} onClick={handleClick} disabled={busy} fullWidth={fullWidth}>
      {label}
    </Button>
  );
}
