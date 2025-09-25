import type { NameCheckResponse } from "../types/basename";

const cache = new Map<string, NameCheckResponse>();

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function getNameCheckCache(name: string): NameCheckResponse | undefined {
  return cache.get(normalize(name));
}

export function setNameCheckCache(name: string, data: NameCheckResponse): void {
  cache.set(normalize(name), data);
}

export function clearNameCheckCache(): void {
  cache.clear();
}
