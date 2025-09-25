import { useMemo } from "react";
import { NameSearch } from "../../components/basename/NameSearch";
import { CandidatesList } from "../../components/basename/CandidatesList";
import { FiltersBar } from "../../components/basename/FiltersBar";
import { useFiltersStore } from "../../store/filters.store";
import { useCandidates } from "../../hooks/useCandidates";
import styles from "./MiniPage.module.css";

export function MiniPage() {
  const lengths = useFiltersStore((state) => state.lengths);
  const anyLength = useFiltersStore((state) => state.anyLength);
  const kinds = useFiltersStore((state) => state.kinds);
  const sort = useFiltersStore((state) => state.sort);
  const sortDirection = useFiltersStore((state) => state.sortDirection);

  const filters = useMemo(
    () => ({ lengths, anyLength, kinds, sort, sortDirection }),
    [lengths, anyLength, kinds, sort, sortDirection]
  );

  const { items, isLoading, error, refresh } = useCandidates(filters, 18);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.title}>Basename Radar Mini</span>
        <span className={styles.subtitle}>Curated picks optimised for Farcaster Frames.</span>
      </header>
      <NameSearch />
      <div className={styles.compactFilters}>
        <FiltersBar />
      </div>
      <div className={styles.miniList}>
        <CandidatesList items={items} isLoading={isLoading} error={error} onRetry={refresh} />
      </div>
    </main>
  );
}
