import { keccak256, stringToBytes } from "viem";

function extractLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return "";
  }
  const [label] = normalized.split(".");
  return label ?? "";
}

export function labelhash(label: string): `0x${string}` {
  const extracted = extractLabel(label);
  if (extracted.length === 0) {
    throw new Error("Cannot compute labelhash for empty name");
  }
  return keccak256(stringToBytes(extracted));
}
