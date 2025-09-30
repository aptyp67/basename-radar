import { HttpRequestError, createPublicClient, http } from "viem";
import { appNetwork, NETWORKS } from "../config/network";

const RPC_FALLBACKS = {
  mainnet: [
    "https://mainnet.base.org",
    "https://developer-access-mainnet.base.org",
    "https://base-rpc.publicnode.com",
    "https://base.gateway.tenderly.co",
    "https://base.blockpi.network/v1/rpc/public",
    "https://base.meowrpc.com",
    "https://base.llamarpc.com",
    "https://1rpc.io/base",
  ],
  sepolia: ["https://sepolia.base.org"],
} as const satisfies Record<keyof typeof NETWORKS, readonly string[]>;

const FALLBACK_RPC_URLS = [appNetwork.rpcUrl, ...RPC_FALLBACKS[appNetwork.key]]
  .filter((url): url is string => typeof url === "string" && url.length > 0);

const uniqueRpcUrls = Array.from(new Set(FALLBACK_RPC_URLS));

const createNetworkClient = (url: string) =>
  createPublicClient({
    chain: appNetwork.chain,
    transport: http(url, { retryCount: 0 }),
  });

type BasePublicClient = ReturnType<typeof createNetworkClient>;

interface RpcEndpointState {
  client: BasePublicClient;
  url: string;
  failureStreak: number;
  penaltyUntil: number;
  order: number;
}

const rpcStates: RpcEndpointState[] = uniqueRpcUrls.map((url, order) => ({
  client: createNetworkClient(url),
  url,
  failureStreak: 0,
  penaltyUntil: 0,
  order,
}));

export const publicClient =
  rpcStates[0]?.client ?? createNetworkClient(appNetwork.rpcUrl);

const MAX_PARALLEL_REQUESTS = 2;
const RATE_LIMIT_DELAY_MS = 15_000;
const GENERIC_DELAY_MS = 3_000;
const MAX_DELAY_MS = 120_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function computePenalty(state: RpcEndpointState, error: unknown): number {
  const multiplier = Math.min(state.failureStreak + 1, 4);
  const baseDelay =
    error instanceof HttpRequestError && error.status === 429
      ? RATE_LIMIT_DELAY_MS
      : GENERIC_DELAY_MS;
  return Math.min(baseDelay * multiplier, MAX_DELAY_MS);
}

function recordFailure(state: RpcEndpointState, error: unknown) {
  state.failureStreak = Math.min(state.failureStreak + 1, 5);
  state.penaltyUntil = Date.now() + computePenalty(state, error);
}

function recordSuccess(state: RpcEndpointState) {
  state.failureStreak = 0;
  state.penaltyUntil = 0;
}

function selectParticipants(
  attempted: Set<RpcEndpointState>,
  maxPerBatch: number
): { participants: RpcEndpointState[]; waitMs?: number } {
  if (rpcStates.length === 0) {
    return { participants: [] };
  }

  const now = Date.now();
  const ready = rpcStates
    .filter((state) => !attempted.has(state) && state.penaltyUntil <= now)
    .sort((a, b) => a.order - b.order);

  if (ready.length > 0) {
    return { participants: ready.slice(0, maxPerBatch) };
  }

  const pending = rpcStates.filter((state) => !attempted.has(state));
  if (pending.length === 0) {
    return { participants: [] };
  }

  const nextAvailable = Math.min(...pending.map((state) => state.penaltyUntil));
  const waitMs = Math.max(0, nextAvailable - now);
  return { participants: [], waitMs };
}

async function raceParticipants<T>(
  participants: RpcEndpointState[],
  operation: (client: BasePublicClient, url: string) => Promise<T>
): Promise<{ result?: T; errors: unknown[] }> {
  if (participants.length === 0) {
    return { errors: [] };
  }

  return new Promise((resolve) => {
    let settled = false;
    let remaining = participants.length;
    const errors: unknown[] = [];

    const maybeResolveFailures = () => {
      if (!settled && remaining === 0) {
        resolve({ errors });
      }
    };

    for (const state of participants) {
      (async () => {
        try {
          const result = await operation(state.client, state.url);
          if (settled) {
            return;
          }
          settled = true;
          recordSuccess(state);
          resolve({ result, errors });
        } catch (error) {
          recordFailure(state, error);
          if (!settled) {
            errors.push(error);
          }
        } finally {
          remaining -= 1;
          maybeResolveFailures();
        }
      })();
    }
  });
}

export async function withBaseRpcFallback<T>(
  operation: (client: BasePublicClient, url: string) => Promise<T>
): Promise<T> {
  if (rpcStates.length === 0) {
    return operation(publicClient, appNetwork.rpcUrl);
  }

  const maxPerBatch = Math.min(MAX_PARALLEL_REQUESTS, rpcStates.length);
  const attempted = new Set<RpcEndpointState>();
  const collectedErrors: unknown[] = [];

  while (attempted.size < rpcStates.length) {
    const { participants, waitMs } = selectParticipants(attempted, maxPerBatch);
    if (participants.length === 0) {
      if (waitMs && waitMs > 0) {
        await sleep(waitMs);
        continue;
      }
      break;
    }

    participants.forEach((state) => attempted.add(state));

    const { result, errors } = await raceParticipants(participants, operation);
    if (result !== undefined) {
      return result;
    }
    collectedErrors.push(...errors);
  }

  const lastError = collectedErrors[collectedErrors.length - 1];
  if (lastError instanceof Error) {
    throw lastError;
  }
  if (lastError !== undefined) {
    throw new Error(String(lastError));
  }
  throw new Error(`All ${appNetwork.label} RPC endpoints failed`);
}
