export const WEI_IN_ETH = 1_000_000_000_000_000_000n;
export const USD_PER_ETH = 4000;

function coerceWei(value?: string | bigint | null): bigint | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  try {
    return typeof value === "bigint" ? value : BigInt(value);
  } catch (error) {
    console.warn("Invalid wei value provided", value, error);
    return null;
  }
}

export function formatWei(value?: string | bigint | null): string {
  const amount = coerceWei(value);
  if (amount === null) {
    return "—";
  }
  const whole = amount / WEI_IN_ETH;
  const remainder = amount % WEI_IN_ETH;
  if (whole > 0n) {
    const decimals = remainder.toString().padStart(18, "0").slice(0, 2);
    const trimmed = decimals.replace(/0+$/, "");
    return trimmed.length > 0 ? `${whole}.${trimmed} ETH` : `${whole} ETH`;
  }
  const milli = Number((amount * 1000n) / WEI_IN_ETH);
  return `${milli} mETH`;
}

export function formatUsd(value?: string | bigint | null): string {
  const amount = coerceWei(value);
  if (amount === null) {
    return "0.00";
  }
  const eth = Number(amount) / Number(WEI_IN_ETH);
  if (!Number.isFinite(eth)) {
    return "0.00";
  }
  return (eth * USD_PER_ETH).toFixed(2);
}

export function availabilityCopy(availability: string | null | undefined): string {
  switch (availability) {
    case "available":
      return "Available";
    case "taken":
      return "Taken";
    case "unknown":
      return "Unknown";
    default:
      return "—";
  }
}

export function formatKinds(kinds: string[]): string {
  return kinds
    .map((kind) => {
      if (kind === "word") {
        return "Word";
      }
      if (kind === "palindrome") {
        return "Palindrome";
      }
      return kind;
    })
    .join(" • ");
}

export function formatReason(reason: string): string {
  const mapping: Record<string, string> = {
    "short-3": "Short (3)",
    "short-4": "Short (4)",
    "real word": "Real word",
    palindrome: "Palindrome",
    "repeat pattern": "Repeating Pattern",
    "alternating pattern": "Alternating Pattern",
    pattern: "Pattern",
    "word-like": "Word-Like",
  };
  return mapping[reason] ?? reason;
}
