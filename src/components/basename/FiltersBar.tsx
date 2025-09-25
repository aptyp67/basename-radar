import clsx from "clsx";
import { useMemo } from "react";
import type { ChangeEvent } from "react";
import { Button } from "../ui/Button";
import styles from "./FiltersBar.module.css";
import { useFiltersStore, DEFAULT_KINDS } from "../../store/filters.store";
import type { NameKind } from "../../types/basename";
import { useUIStore } from "../../store/ui.store";

const LENGTH_OPTIONS = [3, 4, 5, 6];
const KIND_LABELS: Record<NameKind, string> = {
  short: "Short",
  word: "Words",
  pattern: "Patterns",
};

interface FiltersBarProps {
  onShuffle?: () => void;
}

export function FiltersBar({ onShuffle }: FiltersBarProps) {
  const { lengthRange, kinds, sort, setLengthRange, toggleKind, setSort, reset } = useFiltersStore();
  const trackEvent = useUIStore((state) => state.trackEvent);
  const kindSet = useMemo(() => new Set(kinds), [kinds]);

  const handleLength = (minOrMax: "min" | "max") => (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    const [currentMin, currentMax] = lengthRange;
    const nextRange: [number, number] =
      minOrMax === "min" ? [value, Math.max(value, currentMax)] : [Math.min(currentMin, value), value];
    setLengthRange(nextRange);
    trackEvent("filterChanges");
  };

  const handleSort = (event: ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value as typeof sort);
    trackEvent("filterChanges");
  };

  const handleToggleKind = (kind: NameKind) => {
    toggleKind(kind);
    trackEvent("filterChanges");
  };

  const handleShuffle = () => {
    if (!onShuffle) {
      return;
    }
    onShuffle();
    trackEvent("shuffleClicks");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.group}>
        <span className={styles.label}>Length</span>
        <div className={styles.controls}>
          <select className={styles.select} value={lengthRange[0]} onChange={handleLength("min")}>
            {LENGTH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className={styles.between}>to</span>
          <select className={styles.select} value={lengthRange[1]} onChange={handleLength("max")}>
            {LENGTH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Kind</span>
        <div className={styles.controls}>
          {DEFAULT_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={clsx(
                styles.kindButton,
                kind !== "pattern" && kindSet.has(kind) && styles.kindButtonActive,
                kind === "pattern" && styles.kindButtonDisabled
              )}
              onClick={() => {
                if (kind === "pattern") {
                  return;
                }
                handleToggleKind(kind);
              }}
              disabled={kind === "pattern"}
            >
              <span>{KIND_LABELS[kind]}</span>
              {kind === "pattern" && (
                <span className={styles.kindButtonNote}>in development</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Sort</span>
        <div className={styles.controls}>
          <select className={styles.select} value={sort} onChange={handleSort}>
            <option value="score">Score</option>
            <option value="price">Price</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" size="md" onClick={handleShuffle} disabled={!onShuffle}>
          Shuffle
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => {
            reset();
            trackEvent("filterChanges");
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
