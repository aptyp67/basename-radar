import clsx from "clsx";
import { useMemo } from "react";
import { Button } from "../ui/Button";
import styles from "./FiltersBar.module.css";
import {
  useFiltersStore,
  DEFAULT_KINDS,
  LENGTH_OPTIONS,
} from "../../store/filters.store";
import type { NameKind } from "../../types/basename";
import { useUIStore } from "../../store/ui.store";

const KIND_LABELS: Record<NameKind, string> = {
  palindrome: "Palindrome",
  word: "Any name",
};

const SORT_LABELS: Record<"score" | "alpha", string> = {
  score: "Score",
  alpha: "Alphabetical",
};

interface FiltersBarProps {
  onShuffle?: () => void;
}

export function FiltersBar({ onShuffle }: FiltersBarProps) {
  const {
    lengths,
    anyLength,
    kinds,
    sort,
    sortDirection,
    toggleLength,
    setAnyLength,
    toggleKind,
    setSort,
    toggleSortDirection,
    reset,
    isDefault,
  } = useFiltersStore();
  const trackEvent = useUIStore((state) => state.trackEvent);
  const lengthSet = useMemo(() => new Set(lengths), [lengths]);
  const kindSet = useMemo(() => new Set(kinds), [kinds]);
  const resetDisabled = isDefault();

  const handleSelectKind = (kind: NameKind) => {
    toggleKind(kind);
    trackEvent("filterChanges");
  };

  const handleToggleLength = (length: number) => {
    toggleLength(length);
    trackEvent("filterChanges");
  };

  const handleToggleAnyLength = () => {
    setAnyLength(!anyLength);
    trackEvent("filterChanges");
  };

  const handleSelectSort = (nextSort: "score" | "alpha") => {
    if (sort === nextSort) {
      return;
    }
    setSort(nextSort);
    trackEvent("filterChanges");
  };

  const handleToggleDirection = () => {
    toggleSortDirection();
    trackEvent("filterChanges");
  };

  const handleShuffle = () => {
    if (!onShuffle) {
      return;
    }
    onShuffle();
    trackEvent("shuffleClicks");
  };

  const directionIcon = sortDirection === "asc" ? "↑" : "↓";
  const directionLabel = sortDirection === "asc" ? "Ascending" : "Descending";

  return (
    <div className={styles.wrapper}>
      <div className={styles.group}>
        <span className={styles.label}>Length</span>
        <div className={clsx(styles.controls, styles.controlsInline)}>
          {LENGTH_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={clsx(
                styles.toggleButton,
                !anyLength && lengthSet.has(option) && styles.toggleButtonActive
              )}
              onClick={() => handleToggleLength(option)}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            className={clsx(
              styles.toggleButton,
              anyLength && styles.toggleButtonActive
            )}
            onClick={handleToggleAnyLength}
          >
            Any length
          </button>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Kind</span>
        <div className={clsx(styles.controls, styles.controlsInline)}>
          {DEFAULT_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={clsx(
                styles.toggleButton,
                kindSet.has(kind) && styles.toggleButtonActive
              )}
              onClick={() => handleSelectKind(kind)}
            >
              <span>{KIND_LABELS[kind]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Sort</span>
        <div className={clsx(styles.controls, styles.controlsInline)}>
          <button
            type="button"
            aria-label={`Toggle sort direction: ${directionLabel}`}
            className={clsx(styles.toggleButton, styles.toggleIconButton)}
            onClick={handleToggleDirection}
          >
            {directionIcon}
          </button>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={clsx(
                styles.toggleButton,
                sort === value && styles.toggleButtonActive
              )}
              onClick={() => handleSelectSort(value as "score" | "alpha")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handleShuffle}
          disabled={!onShuffle}
        >
          🤖 Generate
        </Button>
        {!resetDisabled && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              reset();
              trackEvent("filterChanges");
            }}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
