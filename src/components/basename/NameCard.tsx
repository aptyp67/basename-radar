import { Badge } from "../ui/Badge";
import styles from "./NameCard.module.css";
import type { BasenameCandidate } from "../../types/basename";
import { formatKinds, formatReason, formatWei, availabilityCopy } from "../../lib/format";
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
  return (
    <article className={styles.card}>
      <Badge tone={tone} className={styles.statusBadge}>
        <span className={styles.statusContent}>
          {isChecking && <span className={styles.statusSpinner} aria-hidden="true" />}
          {statusLabel}
        </span>
      </Badge>
      <header className={styles.header}>
        <h3 className={styles.name}>{candidate.name}</h3>
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
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Score</span>
            <span className={styles.metricValue}>{candidate.score}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Price</span>
            <span className={styles.metricValue}>{formatWei(priceWei)}</span>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.actions}>
          <RegisterButton
            name={candidate.name}
            disabled={availability === "taken" || isChecking}
            fullWidth
          />
          <WatchButton name={candidate.name} fullWidth />
        </div>
      </footer>
    </article>
  );
}
