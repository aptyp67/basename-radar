import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";

const rpcUrl = import.meta.env.VITE_BASE_RPC ?? "https://mainnet.base.org";

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(rpcUrl),
  },
  ssr: false,
});
