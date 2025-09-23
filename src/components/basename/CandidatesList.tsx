import { useEffect, useMemo } from "react";
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
}

export function CandidatesList({ items, isLoading, error, onRetry }: CandidatesListProps) {
  const setDebugSnapshot = useUIStore((state) => state.setDebugSnapshot);
  const averageScore = useMemo(() => {
    if (items.length === 0) {
      return 0;
    }
    const total = items.reduce((acc, item) => acc + item.score, 0);
    return Math.round((total / items.length) * 10) / 10;
  }, [items]);

  useEffect(() => {
    setDebugSnapshot({ averageScore, renderedCards: items.length });
  }, [averageScore, items.length, setDebugSnapshot]);

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
    return <div className={styles.emptyState}>No results. Try expanding filters.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <strong>{items.length} Candidates</strong>
        <span className={styles.headerMetric}>
          <span>Avg. Score</span>
          <span className={styles.headerMetricValue}>{averageScore}</span>
        </span>
      </div>
      <div className={styles.grid}>
        {items.map((candidate) => (
          <NameCard key={candidate.name} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
