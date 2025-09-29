import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import type { Address } from "viem";
import { WATCHLIST_ABI, WATCHLIST_ADDRESS, WATCHLIST_CHAIN_ID } from "../services/watchlist.contract";
import { labelhash } from "../lib/namehash";

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function useNamehash(name: string): `0x${string}` | null {
  return useMemo(() => {
    const normalized = normalizeName(name);
    if (!normalized) {
      return null;
    }
    try {
      return labelhash(normalized);
    } catch (error) {
      console.warn("Failed to compute labelhash", name, error);
      return null;
    }
  }, [name]);
}

interface ToggleWatchResult {
  address?: Address;
  isPending: boolean;
  watch: () => Promise<`0x${string}`>;
  unwatch: () => Promise<`0x${string}`>;
  isWatching: boolean;
}

type StoredWatchlist = Record<string, Record<string, string>>;

const WATCHLIST_STORAGE_KEY = "basename.watchlist.v1";

function readStoredWatchlist(): StoredWatchlist {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as StoredWatchlist;
  } catch (error) {
    console.warn("Failed to read watchlist cache", error);
    return {};
  }
}

function writeStoredWatchlist(value: StoredWatchlist) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn("Failed to persist watchlist cache", error);
  }
}

function computeStoredState(address: Address | undefined, namehash: `0x${string}` | null): boolean {
  if (!address || !namehash) {
    return false;
  }
  const data = readStoredWatchlist();
  const entry = data[address.toLowerCase()];
  if (!entry) {
    return false;
  }
  return Boolean(entry[namehash]);
}

function persistStoredState(
  address: Address,
  namehash: `0x${string}`,
  normalizedName: string,
  watching: boolean
) {
  const current = readStoredWatchlist();
  const key = address.toLowerCase();
  const entry = { ...(current[key] ?? {}) };
  if (watching) {
    entry[namehash] = normalizedName;
    current[key] = entry;
  } else {
    delete entry[namehash];
    if (Object.keys(entry).length === 0) {
      delete current[key];
    } else {
      current[key] = entry;
    }
  }
  writeStoredWatchlist(current);
}

function useStoredWatchState(
  address: Address | undefined,
  namehash: `0x${string}` | null,
  normalizedName: string
) {
  const [isWatching, setIsWatching] = useState(() => computeStoredState(address, namehash));

  useEffect(() => {
    setIsWatching(computeStoredState(address, namehash));
  }, [address, namehash]);

  const update = useCallback(
    (next: boolean) => {
      if (!address || !namehash) {
        setIsWatching(false);
        return;
      }
      persistStoredState(address, namehash, normalizedName, next);
      setIsWatching(next);
    },
    [address, namehash, normalizedName]
  );

  return { isWatching, setWatching: update };
}

export function useToggleWatch(name: string): ToggleWatchResult {
  const { address } = useAccount();
  const namehash = useNamehash(name);
  const normalizedName = useMemo(() => normalizeName(name), [name]);
  const publicClient = usePublicClient({ chainId: WATCHLIST_CHAIN_ID });
  const { writeContractAsync, isPending } = useWriteContract();
  const { isWatching, setWatching } = useStoredWatchState(address, namehash, normalizedName);

  const ensureNamehash = () => {
    if (!namehash) {
      throw new Error("Invalid name provided");
    }
    return namehash;
  };

  const waitForReceipt = async (hash: `0x${string}`) => {
    if (!publicClient) {
      return hash;
    }
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  };

  const watch = async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }
    const hash = await writeContractAsync({
      address: WATCHLIST_ADDRESS,
      abi: WATCHLIST_ABI,
      functionName: "watch",
      args: [ensureNamehash()],
      chainId: WATCHLIST_CHAIN_ID,
      account: address,
    });
    const receiptHash = await waitForReceipt(hash);
    setWatching(true);
    return receiptHash;
  };

  const unwatch = async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }
    const hash = await writeContractAsync({
      address: WATCHLIST_ADDRESS,
      abi: WATCHLIST_ABI,
      functionName: "unwatch",
      args: [ensureNamehash()],
      chainId: WATCHLIST_CHAIN_ID,
      account: address,
    });
    const receiptHash = await waitForReceipt(hash);
    setWatching(false);
    return receiptHash;
  };

  return {
    address,
    isPending,
    watch,
    unwatch,
    isWatching,
  };
}
