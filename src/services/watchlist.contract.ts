import { parseAbi } from "viem";
import { appNetwork } from "../config/network";

export const WATCHLIST_CHAIN_ID = appNetwork.chain.id;
export const WATCHLIST_ADDRESS = appNetwork.contracts.watchlist;

export const WATCHLIST_ABI = parseAbi([
  "function watch(bytes32 namehash)",
  "function unwatch(bytes32 namehash)",
  "function isWatching(address user, bytes32 namehash) view returns (bool)",
  "event Watchlisted(address indexed user, bytes32 indexed namehash)",
  "event Unwatchlisted(address indexed user, bytes32 indexed namehash)",
]);
