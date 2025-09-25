import type {
  Availability,
  BasenameCandidate,
  CandidateFilters,
  CandidatesResponse,
  NameCheckResponse,
  NameKind,
} from "../types/basename";
import { withBaseRpcFallback } from "../lib/viem";

interface RegisterIntentResponse {
  ok: true;
  checkoutUrl: string;
}

interface WatchResponse {
  ok: true;
}

const SHORT_NAMES = [
  "zen",
  "x0x",
  "loop",
  "nova",
  "byte",
  "flux",
  "beam",
  "echo",
  "void",
  "axis",
  "opal",
  "muse",
  "luna",
  "aero",
  "wave",
  "ember",
  "aqua",
  "delta",
  "zeal",
  "sync",
  "nexa",
  "fyre",
  "iris",
  "atom",
  "seed",
  "myth",
  "spark",
  "cyra",
  "rift",
  "prsm",
];

const WORD_NAMES = [
  "orbit",
  "atlas",
  "aurora",
  "stellar",
  "horizon",
  "nebula",
  "pulse",
  "cipher",
  "mirage",
  "halo",
  "summit",
  "echoes",
  "harbor",
  "compass",
  "ember",
  "cascade",
  "glimmer",
  "lattice",
  "momentum",
  "quasar",
  "solace",
  "vertex",
  "voyage",
  "wander",
  "zenith",
  "zephyr",
  "kinetic",
  "monsoon",
  "nocturne",
  "silhouette",
  "tangent",
  "haven",
  "panorama",
  "parallax",
  "serenity",
  "sonata",
  "strata",
  "traverse",
  "velvet",
  "whisper",
];

const PATTERN_NAMES = [
  "radar",
  "level",
  "solos",
  "1221",
  "9009",
  "808",
  "alpha",
  "orbit",
  "fluxx",
  "pixel",
  "harm",
  "m33m",
  "cyc",
  "kale",
  "pulse",
  "ababa",
  "z1z1",
  "a11a",
  "n0n0",
  "wave",
  "a2a2",
  "loop",
  "saga",
  "neon",
  "n1n1",
  "xoxo",
  "axa",
  "pop",
  "civic",
  "reviver",
];

const BASE_PRICE_WEI = {
  3: BigInt("300000000000000000"),
  4: BigInt("180000000000000000"),
  5: BigInt("90000000000000000"),
  6: BigInt("50000000000000000"),
};

const nameRegex = /^[a-z0-9-]{3,50}$/;
const REGISTRAR_CONTROLLER_ADDRESS = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";
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
  const kinds: NameKind[] = [];
  if (name.length <= 4) {
    kinds.push("short");
  }
  const isWord = WORD_NAMES.includes(name) || SHORT_NAMES.includes(name);
  if (isWord) {
    kinds.push("word");
  }
  if (isPattern(name)) {
    kinds.push("pattern");
  }
  return kinds.length > 0 ? kinds : ["word"];
}

function isPattern(value: string): boolean {
  return isPalindrome(value) || hasRepeatingPattern(value) || isAlternating(value);
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
  return value.split(pattern).join("" ) === "";
}

function buildReasons(name: string, kinds: NameKind[]): string[] {
  const reasons = new Set<string>();
  if (name.length <= 4) {
    reasons.add(`short-${name.length}`);
  }
  if (WORD_NAMES.includes(name)) {
    reasons.add("real word");
  }
  if (isPalindrome(name)) {
    reasons.add("palindrome");
  }
  if (hasRepeatingPattern(name)) {
    reasons.add("repeat pattern");
  }
  if (isAlternating(name)) {
    reasons.add("alternating pattern");
  }
  kinds.forEach((kind) => {
    if (kind === "pattern") {
      reasons.add("pattern");
    }
    if (kind === "word") {
      reasons.add("word-like");
    }
  });
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
  if (kinds.includes("pattern")) {
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

const MOCK_DATA: BasenameCandidate[] = Array.from(
  new Set([...SHORT_NAMES, ...WORD_NAMES, ...PATTERN_NAMES])
).map((name) => {
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
    reasons: buildReasons(normalized, kinds),
  };
});

class BasenameService {
  async getCandidates(
    filters: CandidateFilters,
    limit = 40
  ): Promise<CandidatesResponse> {
    const [minLen, maxLen] = filters.lengthRange;
    const allowedKinds = new Set(filters.kinds);
    const items = MOCK_DATA.filter((item) => {
      if (item.length < minLen || item.length > maxLen) {
        return false;
      }
      if (allowedKinds.size > 0) {
        return item.kind.some((kind) => allowedKinds.has(kind));
      }
      return true;
    })
      .sort((a, b) => this.sortComparer(a, b, filters.sort))
      .slice(0, limit);

    return new Promise((resolve) => {
      globalThis.setTimeout(
        () => resolve({ items, nextCursor: undefined }),
        120 + (deterministicHash(`${minLen}-${maxLen}-${filters.sort}`) % 80)
      );
    });
  }

  async checkName(name: string): Promise<NameCheckResponse> {
    if (!nameRegex.test(name)) {
      return { availability: "unknown" };
    }

    const normalized = name.toLowerCase();
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

  async watchName(name: string): Promise<WatchResponse> {
    const hash = deterministicHash(name);
    return new Promise((resolve) => {
      globalThis.setTimeout(() => resolve({ ok: true }), 100 + (hash % 50));
    });
  }

  async registerIntent(name: string): Promise<RegisterIntentResponse> {
    const baseUrl = import.meta.env.VITE_APP_URL ?? "https://your-domain.xyz";
    const checkoutUrl = `${baseUrl}/checkout?name=${encodeURIComponent(name)}`;
    const hash = deterministicHash(name);
    return new Promise((resolve) => {
      globalThis.setTimeout(
        () => resolve({ ok: true, checkoutUrl }),
        150 + (hash % 50)
      );
    });
  }

  private sortComparer(
    a: BasenameCandidate,
    b: BasenameCandidate,
    sort: CandidateFilters["sort"]
  ): number {
    if (sort === "alpha") {
      return a.name.localeCompare(b.name);
    }

    if (sort === "score") {
      return b.score - a.score;
    }

    const aPrice = a.priceWei ? BigInt(a.priceWei) : BigInt(0);
    const bPrice = b.priceWei ? BigInt(b.priceWei) : BigInt(0);
    if (aPrice === BigInt(0)) {
      return 1;
    }
    if (bPrice === BigInt(0)) {
      return -1;
    }
    return Number(aPrice - bPrice);
  }
}

export const basenameService = new BasenameService();
