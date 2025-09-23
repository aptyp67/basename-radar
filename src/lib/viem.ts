import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const rpcUrl = import.meta.env.VITE_BASE_RPC ?? "https://mainnet.base.org";

export const publicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});
