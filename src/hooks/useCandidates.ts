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
  const { lengths, anyLength, kinds, sort, sortDirection } = filters;
  const previousSortRef = useRef(sort);
  const previousSortDirectionRef = useRef(sortDirection);
  const previousFiltersRef = useRef({ lengths, anyLength, kinds });

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
    const sortChanged = previousSortRef.current !== sort;
    const directionChanged = previousSortDirectionRef.current !== sortDirection;
    if (sortChanged || directionChanged) {
      previousSortRef.current = sort;
      previousSortDirectionRef.current = sortDirection;
      setOrderMode("sorted");
    }
  }, [sort, sortDirection]);

  useEffect(() => {
    const prev = previousFiltersRef.current;
    const lengthChanged =
      prev.anyLength !== anyLength ||
      prev.lengths.length !== lengths.length ||
      prev.lengths.some((value, index) => value !== lengths[index]);
    const kindsChanged = prev.kinds !== kinds;
    previousFiltersRef.current = { lengths, anyLength, kinds };
    if (orderMode === "random" && (lengthChanged || kindsChanged)) {
      setShuffleToken(Date.now());
    }
  }, [lengths, anyLength, kinds, orderMode]);

  const filteredItems = useMemo(() => {
    if (allItems.length === 0) {
      return [];
    }
    const allowedKinds = new Set(kinds);
    const allowedLengths = new Set(lengths);
    const shouldFilterByLength = !anyLength && allowedLengths.size > 0;
    return allItems.filter((item) => {
      if (shouldFilterByLength && !allowedLengths.has(item.length)) {
        return false;
      }
      if (allowedKinds.size > 0) {
        return item.kind.some((kind) => allowedKinds.has(kind));
      }
      return true;
    });
  }, [allItems, lengths, anyLength, kinds]);

  const orderedItems = useMemo(() => {
    if (filteredItems.length === 0) {
      return [];
    }
    if (orderMode === "random") {
      return shuffleWithSeed(filteredItems, shuffleToken);
    }
    return basenameService.sortCandidates(filteredItems, sort, sortDirection);
  }, [filteredItems, orderMode, shuffleToken, sort, sortDirection]);

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
