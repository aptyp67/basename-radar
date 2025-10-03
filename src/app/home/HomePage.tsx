import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NameSearch } from "../../components/basename/NameSearch";
import { FiltersBar } from "../../components/basename/FiltersBar";
import { CandidatesList } from "../../components/basename/CandidatesList";
import { useFiltersStore } from "../../store/filters.store";
import { useCandidates } from "../../hooks/useCandidates";
import { Pagination } from "../../components/ui/Pagination";
import { useFarcasterView } from "../../hooks/useFarcasterView";
import styles from "./HomePage.module.css";

const DEFAULT_ITEMS_PER_PAGE = 12;
const DEFAULT_FETCH_SIZE = 48;
const FARCASTER_ITEMS_PER_PAGE = 18;
const FARCASTER_FETCH_SIZE = 18;
const LIST_SCROLL_OFFSET_PX = 24;

export function HomePage() {
  const isFarcasterView = useFarcasterView();
  const lengths = useFiltersStore((state) => state.lengths);
  const anyLength = useFiltersStore((state) => state.anyLength);
  const kinds = useFiltersStore((state) => state.kinds);
  const [page, setPage] = useState(1);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const filtersSignatureRef = useRef<string | null>(null);

  const filters = useMemo(
    () => ({ lengths, anyLength, kinds }),
    [lengths, anyLength, kinds]
  );

  const {
    items: candidates,
    isLoading,
    error,
    refresh,
  } = useCandidates(filters, isFarcasterView ? FARCASTER_FETCH_SIZE : DEFAULT_FETCH_SIZE);
  const itemsPerPage = isFarcasterView ? FARCASTER_ITEMS_PER_PAGE : DEFAULT_ITEMS_PER_PAGE;

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
    const signature = JSON.stringify({ lengths, anyLength, kinds });
    if (filtersSignatureRef.current === null) {
      filtersSignatureRef.current = signature;
      return;
    }
    if (filtersSignatureRef.current === signature) {
      return;
    }
    filtersSignatureRef.current = signature;
    setPage(1);
    scrollToListTop();
  }, [lengths, anyLength, kinds, scrollToListTop]);

  useEffect(() => {
    if (!isFarcasterView) {
      return;
    }
    setPage(1);
  }, [isFarcasterView]);

  useEffect(() => {
    const pages = Math.ceil(candidates.length / itemsPerPage);
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
  }, [candidates.length, itemsPerPage, page, scrollToListTop]);

  const totalPages = Math.ceil(candidates.length / itemsPerPage);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    if (isFarcasterView) {
      return candidates;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return candidates.slice(startIndex, startIndex + itemsPerPage);
  }, [candidates, currentPage, isFarcasterView, itemsPerPage]);

  const shouldShowPagination = !isFarcasterView && !isLoading && !error && totalPages > 1;

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
    <main className={clsx(styles.page, isFarcasterView && styles.pageCompact)}>
      <section className={clsx(styles.hero, isFarcasterView && styles.heroCompact)}>
        <h1 className={styles.title}>Basename Radar</h1>
        <p className={styles.subtitle}>
          Discover short and meaningful names ready for Base. Explore curated
          candidates, check availability, and prepare for onchain registration.
        </p>
      </section>

      <NameSearch autoFocus={!isFarcasterView} />

      <section className={clsx(styles.layout, isFarcasterView && styles.layoutCompact)}>
        <aside className={clsx(styles.sidebar, isFarcasterView && styles.sidebarCompact)}>
          <FiltersBar onShuffle={handleShuffle} />
        </aside>
        <div className={clsx(styles.content, isFarcasterView && styles.contentCompact)}>
          <div ref={listContainerRef}>
            <CandidatesList
              items={paginatedItems}
              totalCount={candidates.length}
              isLoading={isLoading}
              error={error}
              onRetry={refresh}
              onGenerateMore={handleShuffle}
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
