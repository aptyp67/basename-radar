const WEI_IN_ETH = 1_000_000_000_000_000_000n;

export function formatWei(wei?: string): string {
  if (!wei) {
    return "—";
  }
  const amount = BigInt(wei);
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
