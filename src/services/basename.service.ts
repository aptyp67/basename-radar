import type {
  Availability,
  BasenameCandidate,
  CandidateFilters,
  CandidatesResponse,
  NameCheckResponse,
  NameKind,
} from "../types/basename";
import { withBaseRpcFallback } from "../lib/viem";
import { words as rawWords } from "../assets/words";

interface RegisterIntentResponse {
  ok: true;
  checkoutUrl: string;
}

interface WatchResponse {
  ok: true;
}

const BASE_PRICE_WEI = {
  3: BigInt("300000000000000000"),
  4: BigInt("180000000000000000"),
  5: BigInt("90000000000000000"),
  6: BigInt("50000000000000000"),
};

const UNIQUE_WORDS = Array.from(
  new Set(
    rawWords
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0)
  )
);

const nameRegex = /^[a-z0-9-]{3,50}$/;
const REGISTRAR_CONTROLLER_ADDRESS =
  "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";
const DEFAULT_RENTAL_DURATION = 31_536_000n; // 365 days in seconds
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
    name: "rentPrice",
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

function computeScore(name: string, kinds: NameKind[]): number {
  let score = 0;
  if (name.length === 3) {
    score += 40;
  } else if (name.length === 4) {
    score += 20;
  }
  if (kinds.includes("word")) {
    score += 30;
  }
  if (kinds.includes("palindrome")) {
    score += 15;
  }
  if (/\d{3,}/.test(name)) {
    score -= 20;
  }
  if (score > 100) {
    return 100;
  }
  return Math.max(score, 0);
}

const MOCK_DATA: BasenameCandidate[] = UNIQUE_WORDS.map((name) => {
  const normalized = name.toLowerCase();
  const length = normalized.length;
  const kinds = detectKinds(normalized);
  const hash = deterministicHash(normalized);
  const availability = availabilityFromHash(hash);
  const priceWei = priceForLength(length, hash);
  return {
    name: normalized,
    length,
    kind: kinds,
    score: computeScore(normalized, kinds),
    availability,
    priceWei,
    reasons: buildReasons(normalized),
  };
});

class BasenameService {
  async getAllCandidates(): Promise<CandidatesResponse> {
    return { items: [...MOCK_DATA], nextCursor: undefined };
  }

  sortCandidates(
    items: BasenameCandidate[],
    sort: CandidateFilters["sort"],
    direction: CandidateFilters["sortDirection"]
  ): BasenameCandidate[] {
    return [...items].sort((a, b) => this.sortComparer(a, b, sort, direction));
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

    const sorted = this.sortCandidates(
      filtered,
      filters.sort,
      filters.sortDirection
    );
    return {
      items: limit ? sorted.slice(0, limit) : sorted,
      nextCursor: undefined,
    };
  }

  async checkName(name: string): Promise<NameCheckResponse> {
    const normalized = name.trim().toLowerCase();
    if (!nameRegex.test(normalized)) {
      return { availability: "unknown" };
    }

    if (
      normalized.includes("--") ||
      normalized.startsWith("-") ||
      normalized.endsWith("-")
    ) {
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
              functionName: "rentPrice",
              args: [normalized, DEFAULT_RENTAL_DURATION],
            })
          );
          priceWei = price.toString();
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

  async watchName(): Promise<WatchResponse> {
    return { ok: true };
  }

  async registerIntent(name: string): Promise<RegisterIntentResponse> {
    const baseUrl = import.meta.env.VITE_APP_URL ?? "https://your-domain.xyz";
    const checkoutUrl = `${baseUrl}/checkout?name=${encodeURIComponent(name)}`;
    return { ok: true, checkoutUrl };
  }

  private sortComparer(
    a: BasenameCandidate,
    b: BasenameCandidate,
    sort: CandidateFilters["sort"],
    direction: CandidateFilters["sortDirection"]
  ): number {
    const isAscending = direction === "asc";
    if (sort === "alpha") {
      return isAscending
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }

    return isAscending ? a.score - b.score : b.score - a.score;
  }
}

export const basenameService = new BasenameService();
