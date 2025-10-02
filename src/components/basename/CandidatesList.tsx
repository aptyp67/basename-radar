import { useEffect } from "react";
import clsx from "clsx";
import type { BasenameCandidate } from "../../types/basename";
import { NameCard } from "./NameCard";
import { Skeleton } from "../ui/Skeleton";
import { Button } from "../ui/Button";
import styles from "./CandidatesList.module.css";
import { useUIStore } from "../../store/ui.store";

interface CandidatesListProps {
  items: BasenameCandidate[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  totalCount?: number;
  onGenerateMore?: () => void;
}

export function CandidatesList({
  items,
  isLoading,
  error,
  onRetry,
  totalCount,
  onGenerateMore,
}: CandidatesListProps) {
  const setDebugSnapshot = useUIStore((state) => state.setDebugSnapshot);

  useEffect(() => {
    setDebugSnapshot({ renderedCards: items.length });
  }, [items.length, setDebugSnapshot]);

  if (isLoading) {
    return (
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} height={200} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <span>{error}</span>
        <Button type="button" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        No results. Try expanding filters.
      </div>
    );
  }

  const shouldUseWideGrid = items.some((candidate) => candidate.length > 6);

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <strong>{totalCount ?? items.length} candidates generated</strong>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onGenerateMore}
          disabled={isLoading || !onGenerateMore}
        >
          Generate more 🤖
        </Button>
      </div>
      <div className={clsx(styles.grid, shouldUseWideGrid && styles.gridWide)}>
        {items.map((candidate) => (
          <NameCard key={candidate.name} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
