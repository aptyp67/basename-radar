import { useLocation } from "react-router-dom";
import { useMemo } from "react";

function normalize(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function hasTruthyFlag(value: string | null): boolean {
  if (value === null) {
    return false;
  }
  const normalized = normalize(value);
  if (!normalized) {
    return true;
  }
  return ["1", "true", "yes", "on"].includes(normalized);
}

export function deriveFarcasterView(search: string): boolean {
  const params = new URLSearchParams(search);
  const farcasterFlag = params.get("farcaster");
  if (hasTruthyFlag(farcasterFlag)) {
    return true;
  }
  const viewValue = normalize(params.get("view"));
  const modeValue = normalize(params.get("mode"));
  const screenValue = normalize(params.get("screen"));

  return viewValue === "farcaster" || modeValue === "farcaster" || screenValue === "farcaster";
}

export function useFarcasterView(): boolean {
  const location = useLocation();
  return useMemo(() => deriveFarcasterView(location.search), [location.search]);
}
