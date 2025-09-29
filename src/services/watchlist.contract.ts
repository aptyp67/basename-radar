import { parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

export const WATCHLIST_CHAIN_ID = baseSepolia.id;
export const WATCHLIST_ADDRESS = "0x9Fef31383Ef614beE71F72deBb9A7A22B2Fb9a15" as const;

export const WATCHLIST_ABI = parseAbi([
  "function watch(bytes32 namehash)",
  "function unwatch(bytes32 namehash)",
  "function isWatching(address user, bytes32 namehash) view returns (bool)",
  "event Watchlisted(address indexed user, bytes32 indexed namehash)",
  "event Unwatchlisted(address indexed user, bytes32 indexed namehash)",
]);
