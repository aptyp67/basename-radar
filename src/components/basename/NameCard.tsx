import clsx from "clsx";
import { Badge } from "../ui/Badge";
import styles from "./NameCard.module.css";
import type { BasenameCandidate } from "../../types/basename";
import { formatKinds, formatReason, formatWei, availabilityCopy, formatUsd } from "../../lib/format";
import { RegisterButton } from "./RegisterButton";
import { WatchButton } from "./WatchButton";
import { useNameAvailability } from "../../hooks/useNameAvailability";

interface NameCardProps {
  candidate: BasenameCandidate;
}

const AVAILABILITY_TONE = {
  available: "success" as const,
  taken: "danger" as const,
  unknown: "muted" as const,
};

export function NameCard({ candidate }: NameCardProps) {
  const { availability, priceWei, isChecking } = useNameAvailability(
    candidate.name,
    candidate.availability,
    candidate.priceWei
  );
  const tone = isChecking ? "muted" : AVAILABILITY_TONE[availability];
  const statusLabel = isChecking ? "Checking…" : availabilityCopy(availability);
  const priceWeiSource = priceWei ?? candidate.priceWei ?? null;
  const priceDisplay = priceWeiSource ? formatWei(priceWeiSource) : null;
  const priceUsdDisplay = priceWeiSource ? formatUsd(priceWeiSource) : null;
  const shouldShowPrice = availability !== "taken" && priceDisplay !== null;
  const metricClassName = clsx(styles.metric, !shouldShowPrice && styles.metricPlaceholder);
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.name} title={candidate.name}>
            {candidate.name}
          </h3>
          <Badge tone={tone} className={styles.statusBadge}>
            <span className={styles.statusContent}>
              {isChecking && <span className={styles.statusSpinner} aria-hidden="true" />}
              {statusLabel}
            </span>
          </Badge>
        </div>
      </header>

      <div className={styles.reasons}>
        <span className={styles.kindPill}>{formatKinds(candidate.kind)}</span>
        {candidate.reasons.map((reason) => (
          <Badge key={reason} tone="muted">
            {formatReason(reason)}
          </Badge>
        ))}
      </div>

      <div className={styles.metaRow}>
        <div className={styles.metrics}>
          <div className={metricClassName} aria-hidden={!shouldShowPrice}>
            <span className={styles.metricLabel}>Price</span>
            <span className={styles.metricValue}>
              {shouldShowPrice ? (
                <>
                  {priceDisplay}
                  {priceUsdDisplay && (
                    <span className={styles.metricMeta}>≈ ${priceUsdDisplay}</span>
                  )}
                </>
              ) : (
                <>
                  0
                  <span className={styles.metricMeta}>≈ $0.00</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.actions}>
          <RegisterButton
            name={candidate.name}
            priceWei={priceWei ?? candidate.priceWei}
            availability={availability}
            reasons={candidate.reasons}
            kinds={candidate.kind}
            length={candidate.length}
            disabled={availability === "taken" || isChecking}
            fullWidth
          />
          <WatchButton name={candidate.name} fullWidth />
        </div>
      </footer>
    </article>
  );
}
