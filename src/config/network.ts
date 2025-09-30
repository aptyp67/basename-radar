import type { Chain } from "viem";
import { base, baseSepolia } from "viem/chains";

type NetworkKey = "mainnet" | "sepolia";

interface NetworkDetails {
  label: string;
  chain: Chain;
  defaultRpcUrl: string;
  registerWithFeeAddress: `0x${string}`;
  registrarControllerAddress: `0x${string}`;
  watchlistAddress: `0x${string}`;
  explorerTxUrl: string;
}

const NETWORKS: Record<NetworkKey, NetworkDetails> = {
  mainnet: {
    label: "Base",
    chain: base,
    defaultRpcUrl: "https://mainnet.base.org",
    registerWithFeeAddress: "0xe4c9C22A77FB90D3dEFc413E9f8848216476313d",
    registrarControllerAddress: "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5",
    watchlistAddress: "0xD047F2e9e62C1D76787b3D55F9cB363b4BD54b6f",
    explorerTxUrl: "https://basescan.org/tx/",
  },
  sepolia: {
    label: "Base Sepolia",
    chain: baseSepolia,
    defaultRpcUrl: "https://sepolia.base.org",
    registerWithFeeAddress: "0x74B58255491897915f70d058daB756CF2a3fdc04",
    registrarControllerAddress: "0x49ae3cc2e3aa768b1e5654f5d3c6002144a59581",
    watchlistAddress: "0x9Fef31383Ef614beE71F72deBb9A7A22B2Fb9a15",
    explorerTxUrl: "https://sepolia.basescan.org/tx/",
  },
};

function resolveNetworkKey(value: string | undefined): NetworkKey {
  if (!value) {
    return "mainnet";
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "sepolia" ? "sepolia" : "mainnet";
}

function resolveAddress(
  value: string | undefined,
  fallback: `0x${string}`
): `0x${string}` {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim();
  return (normalized ? normalized : fallback) as `0x${string}`;
}

function resolveRpcUrl(envValue: string | undefined, fallback: string): string {
  if (!envValue) {
    return fallback;
  }
  const normalized = envValue.trim();
  return normalized ? normalized : fallback;
}

const networkKey = resolveNetworkKey(import.meta.env.VITE_BASENAME_NETWORK);
const network = NETWORKS[networkKey];
const rpcEnvValue = networkKey === "mainnet" ? import.meta.env.VITE_BASE_RPC : import.meta.env.VITE_BASE_SEPOLIA_RPC;

export const appNetwork = {
  key: networkKey,
  label: network.label,
  chain: network.chain,
  rpcUrl: resolveRpcUrl(rpcEnvValue, network.defaultRpcUrl),
  explorerTxUrl: network.explorerTxUrl,
  contracts: {
    registerWithFee: resolveAddress(import.meta.env.VITE_REGISTER_WITH_FEE_ADDRESS, network.registerWithFeeAddress),
    registrarController: resolveAddress(
      import.meta.env.VITE_REGISTRAR_CONTROLLER_ADDRESS,
      network.registrarControllerAddress
    ),
    watchlist: resolveAddress(import.meta.env.VITE_WATCHLIST_ADDRESS, network.watchlistAddress),
  },
} as const;

export type { NetworkKey };
export { NETWORKS };
