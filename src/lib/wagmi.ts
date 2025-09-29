import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { base, baseSepolia } from "viem/chains";

const baseRpcUrl = import.meta.env.VITE_BASE_RPC ?? "https://mainnet.base.org";
const baseSepoliaRpcUrl = import.meta.env.VITE_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

const connectors = [injected({ target: "metaMask" })];

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors,
  transports: {
    [base.id]: http(baseRpcUrl),
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
  },
  ssr: false,
});

export const injectedConnector = connectors[0];
