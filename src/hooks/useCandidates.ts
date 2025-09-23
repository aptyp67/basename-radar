import { useEffect, useState } from "react";
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
  const [items, setItems] = useState<BasenameCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const setApiLatency = useUIStore((state) => state.setApiLatency);
  const { lengthRange, kinds, sort } = filters;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetch = async () => {
      const started = performance.now();
      try {
        const response = await basenameService.getCandidates({ lengthRange, kinds, sort }, limit);
        const elapsed = performance.now() - started;
        setApiLatency(Math.round(elapsed));
        if (!cancelled) {
          setItems(response.items);
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
  }, [lengthRange, kinds, sort, limit, refreshIndex, setApiLatency]);

  return {
    items,
    isLoading: loading,
    error,
    refresh: () => setRefreshIndex((index) => index + 1),
  };
}
