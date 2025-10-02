import clsx from "clsx";
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
  word: "Any",
};

interface FiltersBarProps {
  onShuffle?: () => void;
}

export function FiltersBar({ onShuffle }: FiltersBarProps) {
  const {
    lengths,
    anyLength,
    kinds,
    toggleLength,
    setAnyLength,
    toggleKind,
    reset,
    isDefault,
  } = useFiltersStore();
  const trackEvent = useUIStore((state) => state.trackEvent);

  const lengthSet = new Set(lengths);
  const kindSet = new Set(kinds);
  const resetDisabled = isDefault();

  const handleToggleLength = (length: number) => {
    if (anyLength) {
      setAnyLength(false);
    }
    toggleLength(length);
    trackEvent("filterChanges");
  };

  const handleToggleAnyLength = () => {
    setAnyLength(!anyLength);
    trackEvent("filterChanges");
  };

  const handleToggleKind = (kind: NameKind) => {
    toggleKind(kind);
    trackEvent("filterChanges");
  };

  const handleGenerate = () => {
    if (!onShuffle) {
      return;
    }
    onShuffle();
    trackEvent("shuffleClicks");
  };

  const handleReset = () => {
    if (resetDisabled) {
      return;
    }
    reset();
    trackEvent("filterChanges");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.cards}>
        <section className={clsx(styles.card, styles.lengthCard)}>
          <div className={styles.cardHeading}>
            <span className={styles.label}>Length</span>
          </div>
          <div className={styles.lengthGrid}>
            {LENGTH_OPTIONS.map((length) => {
              const isActive = !anyLength && lengthSet.has(length);
              return (
                <button
                  key={length}
                  type="button"
                  className={clsx(
                    styles.segmentButton,
                    isActive && styles.segmentButtonActive
                  )}
                  onClick={() => handleToggleLength(length)}
                >
                  {length}
                </button>
              );
            })}
            <button
              type="button"
              className={clsx(
                styles.segmentButton,
                anyLength && styles.segmentButtonActive
              )}
              onClick={handleToggleAnyLength}
            >
              Any
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <span className={styles.label}>Kind</span>
          </div>
          <div className={styles.segmentGrid}>
            {DEFAULT_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={clsx(
                  styles.segmentButton,
                  kindSet.has(kind) && styles.segmentButtonActive
                )}
                onClick={() => handleToggleKind(kind)}
              >
                {KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.ctaBar}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className={styles.generateButton}
          onClick={handleGenerate}
          disabled={!onShuffle}
        >
          Generate
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          className={styles.resetButton}
          onClick={handleReset}
          disabled={resetDisabled}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
