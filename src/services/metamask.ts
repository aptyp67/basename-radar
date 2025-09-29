import { getAddress } from "viem";
import type { EthereumProvider } from "../types/ethereum";

const USER_REJECTED_REQUEST_ERROR_CODE = 4001;
let cachedProvider: EthereumProvider | null | undefined;

type Accounts = string[];

type Listener<T = unknown> = (payload: T) => void;

type Unsubscribe = () => void;

export interface MetaMaskConnection {
  address: string;
  chainId: string | null;
  accounts: Accounts;
}

function resolveMetaMaskProvider(): EthereumProvider | null {
  if (cachedProvider !== undefined) {
    return cachedProvider;
  }
  if (typeof window === "undefined") {
    cachedProvider = null;
    return cachedProvider;
  }

  const { ethereum } = window;
  if (!ethereum) {
    cachedProvider = null;
    return cachedProvider;
  }

  if (Array.isArray(ethereum.providers)) {
    const candidateList = (ethereum.providers as unknown[]).filter((item): item is EthereumProvider => {
      if (!item || typeof item !== "object") {
        return false;
      }
      const candidate = item as Partial<EthereumProvider>;
      return typeof candidate.request === "function";
    });
    const preferred = candidateList.find((item) => Boolean(item.isMetaMask)) ?? candidateList[0] ?? null;
    cachedProvider = preferred ?? null;
    return cachedProvider;
  }

  cachedProvider = (ethereum as EthereumProvider) ?? null;
  return cachedProvider;
}

export function getMetaMaskProvider(): EthereumProvider | null {
  const provider = resolveMetaMaskProvider();
  if (provider && typeof provider.request !== "function") {
    return null;
  }
  return provider;
}

export function isMetaMaskAvailable(): boolean {
  return getMetaMaskProvider() !== null;
}

function normalizeAccounts(accounts: Accounts | null | undefined): Accounts {
  if (!accounts || accounts.length === 0) {
    return [];
  }
  return accounts
    .filter((account): account is string => typeof account === "string" && account.length > 0)
    .map((account) => {
      try {
        return getAddress(account);
      } catch (error) {
        console.warn("Invalid Ethereum account received", account, error);
        return account;
      }
    });
}

async function request<T>(method: string, params?: readonly unknown[] | Record<string, unknown>): Promise<T> {
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error("MetaMask extension not detected");
  }
  return provider.request<T>({ method, params });
}

export async function requestAccounts(): Promise<Accounts> {
  const accounts = await request<Accounts>("eth_requestAccounts");
  return normalizeAccounts(accounts);
}

export async function getAccounts(): Promise<Accounts> {
  const accounts = await request<Accounts>("eth_accounts");
  return normalizeAccounts(accounts);
}

export async function getChainId(): Promise<string | null> {
  try {
    const chainId = await request<string>("eth_chainId");
    if (typeof chainId === "string" && chainId.length > 0) {
      return chainId;
    }
    return null;
  } catch (error) {
    console.warn("Failed to read chain id", error);
    return null;
  }
}

export async function connectMetaMask(): Promise<MetaMaskConnection> {
  try {
    const accounts = await requestAccounts();
    if (accounts.length === 0) {
      throw new Error("No MetaMask accounts available");
    }
    const [primary] = accounts;
    const chainId = await getChainId();
    return {
      address: primary,
      chainId,
      accounts,
    };
  } catch (error: unknown) {
    if (isUserRejectedRequestError(error)) {
      throw new Error("Request to connect MetaMask was rejected");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to connect MetaMask");
  }
}

function isUserRejectedRequestError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return code === USER_REJECTED_REQUEST_ERROR_CODE;
}

function subscribe<T = unknown>(event: string, handler: Listener<T>): Unsubscribe {
  const provider = getMetaMaskProvider();
  if (!provider || typeof provider.on !== "function") {
    return () => undefined;
  }

  provider.on(event, handler as Listener);
  return () => {
    if (typeof provider.removeListener === "function") {
      provider.removeListener(event, handler as Listener);
    }
  };
}

export function onAccountsChanged(handler: Listener<Accounts>): Unsubscribe {
  const wrapped: Listener<Accounts> = (payload) => {
    handler(normalizeAccounts(payload));
  };
  return subscribe("accountsChanged", wrapped);
}

export function onChainChanged(handler: Listener<string>): Unsubscribe {
  return subscribe("chainChanged", handler);
}

export function onDisconnect(handler: Listener): Unsubscribe {
  return subscribe("disconnect", handler);
}
