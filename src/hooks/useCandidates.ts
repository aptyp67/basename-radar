import { useEffect, useMemo, useRef, useState } from "react";
import { basenameService } from "../services/basename.service";
import type { BasenameCandidate, CandidateFilters } from "../types/basename";
import { useUIStore } from "../store/ui.store";

interface UseCandidatesResult {
  items: BasenameCandidate[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCandidates(
  filters: CandidateFilters,
  limit = 40
): UseCandidatesResult {
  const [allItems, setAllItems] = useState<BasenameCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shuffleToken, setShuffleToken] = useState(() => Date.now());
  const [orderMode, setOrderMode] = useState<"random" | "sorted">("random");
  const setApiLatency = useUIStore((state) => state.setApiLatency);
  const { lengthRange, kinds, sort } = filters;
  const previousSortRef = useRef(sort);
  const previousFiltersRef = useRef({ lengthRange, kinds });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetch = async () => {
      const started = performance.now();
      try {
        const response = await basenameService.getAllCandidates();
        const elapsed = performance.now() - started;
        setApiLatency(Math.round(elapsed));
        if (!cancelled) {
          setAllItems(response.items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load candidates");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetch();

    return () => {
      cancelled = true;
    };
  }, [setApiLatency]);

  useEffect(() => {
    if (previousSortRef.current !== sort) {
      previousSortRef.current = sort;
      setOrderMode("sorted");
    }
  }, [sort]);

  useEffect(() => {
    const prev = previousFiltersRef.current;
    const lengthChanged =
      prev.lengthRange[0] !== lengthRange[0] || prev.lengthRange[1] !== lengthRange[1];
    const kindsChanged = prev.kinds !== kinds;
    previousFiltersRef.current = { lengthRange, kinds };
    if (orderMode === "random" && (lengthChanged || kindsChanged)) {
      setShuffleToken(Date.now());
    }
  }, [lengthRange, kinds, orderMode]);

  const filteredItems = useMemo(() => {
    if (allItems.length === 0) {
      return [];
    }
    const [minLen, maxLen] = lengthRange;
    const allowedKinds = new Set(kinds);
    return allItems.filter((item) => {
      if (item.length < minLen || item.length > maxLen) {
        return false;
      }
      if (allowedKinds.size > 0) {
        return item.kind.some((kind) => allowedKinds.has(kind));
      }
      return true;
    });
  }, [allItems, lengthRange, kinds]);

  const orderedItems = useMemo(() => {
    if (filteredItems.length === 0) {
      return [];
    }
    if (orderMode === "random") {
      return shuffleWithSeed(filteredItems, shuffleToken);
    }
    return basenameService.sortCandidates(filteredItems, sort);
  }, [filteredItems, orderMode, shuffleToken, sort]);

  const limitedItems = useMemo(() => {
    if (!limit || limit >= orderedItems.length) {
      return orderedItems;
    }
    return orderedItems.slice(0, limit);
  }, [limit, orderedItems]);

  return {
    items: limitedItems,
    isLoading: loading,
    error,
    refresh: () => {
      setOrderMode("random");
      setShuffleToken(Date.now());
    },
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = Math.abs(Math.floor(seed)) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 9301 + 49297) % 233280;
    const random = state / 233280;
    const swapIndex = Math.floor(random * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
