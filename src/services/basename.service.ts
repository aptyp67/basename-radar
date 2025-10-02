import type {
  Availability,
  BasenameCandidate,
  CandidateFilters,
  CandidatesResponse,
  NameCheckResponse,
  NameKind,
} from "../types/basename";
import { withBaseRpcFallback } from "../lib/viem";
import { REGISTRAR_CONTROLLER_ADDRESS, toRegistrarValue } from "./registerWithFee.contract";
import { words as rawWords } from "../assets/words";

interface RegisterIntentResponse {
  ok: true;
  checkoutUrl: string;
}

const BASE_PRICE_WEI = {
  3: BigInt("300000000000000000"),
  4: BigInt("180000000000000000"),
  5: BigInt("90000000000000000"),
  6: BigInt("50000000000000000"),
};

const NORMALIZED_WORDS = rawWords.map((word) => word.trim().toLowerCase());

const nameRegex = /^[a-z0-9-]{3,50}$/;
const DEFAULT_RENTAL_DURATION = 31_557_600n; // 365.25 days in seconds
const registrarControllerAbi = [
  {
    type: "function",
    name: "available",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "registerPrice",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function deterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 9973;
  }
  return hash;
}

function priceForLength(length: number, hash: number): string | undefined {
  const base = BASE_PRICE_WEI[length as keyof typeof BASE_PRICE_WEI];
  if (!base) {
    return undefined;
  }
  const variance = BigInt((hash % 50) - 25);
  const adjusted = base + (base / BigInt(100)) * variance;
  return adjusted > BigInt(0) ? adjusted.toString() : base.toString();
}

function availabilityFromHash(hash: number): Availability {
  const bucket = hash % 100;
  if (bucket < 65) {
    return "available";
  }
  if (bucket < 90) {
    return "taken";
  }
  return "unknown";
}

function detectKinds(name: string): NameKind[] {
  const kinds = new Set<NameKind>();
  kinds.add("word");
  if (isPalindrome(name)) {
    kinds.add("palindrome");
  }
  return Array.from(kinds);
}

function isPalindrome(value: string): boolean {
  return value === value.split("").reverse().join("");
}

function hasRepeatingPattern(value: string): boolean {
  if (value.length < 3) {
    return false;
  }
  const half = Math.floor(value.length / 2);
  const prefix = value.slice(0, half);
  const suffix = value.slice(half);
  return prefix === suffix || /(\w)\1{2,}/.test(value);
}

function isAlternating(value: string): boolean {
  if (value.length < 4) {
    return false;
  }
  const pattern = value.slice(0, 2);
  return value.split(pattern).join("") === "";
}

function buildReasons(name: string): string[] {
  const reasons = new Set<string>();
  if (name.length <= 4) {
    reasons.add(`short-${name.length}`);
  }
  reasons.add("real word");
  if (isPalindrome(name)) {
    reasons.add("palindrome");
  }
  if (hasRepeatingPattern(name)) {
    reasons.add("repeat pattern");
  }
  if (isAlternating(name)) {
    reasons.add("alternating pattern");
  }
  return Array.from(reasons);
}

const MOCK_DATA: BasenameCandidate[] = NORMALIZED_WORDS.map((name) => {
  const normalized = name;
  const length = normalized.length;
  const kinds = detectKinds(normalized);
  const hash = deterministicHash(normalized);
  const availability = availabilityFromHash(hash);
  const priceWei = priceForLength(length, hash);
  return {
    name: normalized,
    length,
    kind: kinds,
    availability,
    priceWei,
    reasons: buildReasons(normalized),
  };
});

class BasenameService {
  async getAllCandidates(): Promise<CandidatesResponse> {
    return { items: [...MOCK_DATA], nextCursor: undefined };
  }

  async getCandidates(
    filters: CandidateFilters,
    limit = 40
  ): Promise<CandidatesResponse> {
    const allowedLengths = new Set(filters.lengths);
    const shouldFilterByLength = !filters.anyLength && allowedLengths.size > 0;
    const allowedKinds = new Set(filters.kinds);
    const { items: allItems } = await this.getAllCandidates();
    const filtered = allItems.filter((item) => {
      if (shouldFilterByLength && !allowedLengths.has(item.length)) {
        return false;
      }
      if (allowedKinds.size > 0) {
        return item.kind.some((kind) => allowedKinds.has(kind));
      }
      return true;
    });

    return {
      items: limit ? filtered.slice(0, limit) : filtered,
      nextCursor: undefined,
    };
  }

  async checkName(name: string): Promise<NameCheckResponse> {
    const normalized = name.trim().toLowerCase();
    if (!nameRegex.test(normalized)) {
      return { availability: "unknown" };
    }

    if (normalized.startsWith("-") || normalized.endsWith("-")) {
      return { availability: "unknown" };
    }

    try {
      const isAvailable = await withBaseRpcFallback((client) =>
        client.readContract({
          address: REGISTRAR_CONTROLLER_ADDRESS,
          abi: registrarControllerAbi,
          functionName: "available",
          args: [normalized],
        })
      );

      const availability: Availability = isAvailable ? "available" : "taken";
      let priceWei: string | undefined;
      if (isAvailable) {
        try {
          const price = await withBaseRpcFallback((client) =>
            client.readContract({
              address: REGISTRAR_CONTROLLER_ADDRESS,
              abi: registrarControllerAbi,
              functionName: "registerPrice",
              args: [normalized, DEFAULT_RENTAL_DURATION],
            })
          );
          const registrarValue = toRegistrarValue(price);
          priceWei = registrarValue.toString();
        } catch (priceError) {
          console.error("Failed to fetch rent price", priceError);
        }
      }

      return { availability, priceWei };
    } catch (error) {
      console.error("Failed to check name availability", error);
      return { availability: "unknown" };
    }
  }

  async registerIntent(name: string): Promise<RegisterIntentResponse> {
    const baseUrl = import.meta.env.VITE_APP_URL ?? "https://your-domain.xyz";
    const checkoutUrl = `${baseUrl}/checkout?name=${encodeURIComponent(name)}`;
    return { ok: true, checkoutUrl };
  }

}

export const basenameService = new BasenameService();
