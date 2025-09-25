import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NameSearch } from "../../components/basename/NameSearch";
import { FiltersBar } from "../../components/basename/FiltersBar";
import { CandidatesList } from "../../components/basename/CandidatesList";
import { useFiltersStore } from "../../store/filters.store";
import { useCandidates } from "../../hooks/useCandidates";
import { Pagination } from "../../components/ui/Pagination";
import styles from "./HomePage.module.css";

const ITEMS_PER_PAGE = 9;
const LIST_SCROLL_OFFSET_PX = 24;

export function HomePage() {
  const lengthRange = useFiltersStore((state) => state.lengthRange);
  const kinds = useFiltersStore((state) => state.kinds);
  const sort = useFiltersStore((state) => state.sort);
  const [page, setPage] = useState(1);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => ({ lengthRange, kinds, sort }),
    [lengthRange, kinds, sort]
  );

  const {
    items: candidates,
    isLoading,
    error,
    refresh,
  } = useCandidates(filters, 48);

  const scrollToListTop = useCallback(() => {
    const target = listContainerRef.current;
    if (!target || typeof window === "undefined") {
      return;
    }

    const scroll = () => {
      const rect = target.getBoundingClientRect();
      const absoluteTop = window.pageYOffset + rect.top;
      const offsetTop = Math.max(absoluteTop - LIST_SCROLL_OFFSET_PX, 0);
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    };

    if ("requestAnimationFrame" in window) {
      window.requestAnimationFrame(scroll);
    } else {
      scroll();
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [lengthRange, kinds, sort]);

  useEffect(() => {
    const pages = Math.ceil(candidates.length / ITEMS_PER_PAGE);
    if (pages === 0) {
      if (page !== 1) {
        setPage(1);
      }
      return;
    }
    if (page > pages) {
      setPage(pages);
      if (pages > 0) {
        scrollToListTop();
      }
    }
  }, [candidates.length, page, scrollToListTop]);

  const totalPages = Math.ceil(candidates.length / ITEMS_PER_PAGE);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return candidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [candidates, currentPage]);

  const shouldShowPagination = !isLoading && !error && totalPages > 1;

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    scrollToListTop();
  };

  const handleShuffle = useCallback(() => {
    setPage(1);
    refresh();
    scrollToListTop();
  }, [refresh, scrollToListTop]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Basename Radar</h1>
        <p className={styles.subtitle}>
          Discover short and meaningful names ready for Base. Explore curated
          candidates, check availability, and prepare for onchain registration.
        </p>
      </section>

      <NameSearch autoFocus />

      <section className={styles.layout}>
        <aside className={styles.sidebar}>
          <FiltersBar onShuffle={handleShuffle} />
        </aside>
        <div className={styles.content}>
          <div ref={listContainerRef}>
            <CandidatesList
              items={paginatedItems}
              totalCount={candidates.length}
              isLoading={isLoading}
              error={error}
              onRetry={refresh}
            />
          </div>
          {shouldShowPagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </section>
    </main>
  );
}
