import { useMemo } from "react";
import { NameSearch } from "../../components/basename/NameSearch";
import { FiltersBar } from "../../components/basename/FiltersBar";
import { CandidatesList } from "../../components/basename/CandidatesList";
import { useFiltersStore } from "../../store/filters.store";
import { useCandidates } from "../../hooks/useCandidates";
import styles from "./HomePage.module.css";

export function HomePage() {
  const lengthRange = useFiltersStore((state) => state.lengthRange);
  const kinds = useFiltersStore((state) => state.kinds);
  const sort = useFiltersStore((state) => state.sort);

  const filters = useMemo(
    () => ({ lengthRange, kinds, sort }),
    [lengthRange, kinds, sort]
  );

  const { items, isLoading, error, refresh } = useCandidates(filters, 48);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Basename Radar</h1>
        <p className={styles.subtitle}>
          Discover short and meaningful names ready for Base. Explore curated candidates, check availability, and
          prepare for onchain registration.
        </p>
      </section>

      <NameSearch autoFocus />

      <section className={styles.layout}>
        <aside className={styles.sidebar}>
          <FiltersBar />
        </aside>
        <div className={styles.content}>
          <CandidatesList items={items} isLoading={isLoading} error={error} onRetry={refresh} />
        </div>
      </section>
    </main>
  );
}
