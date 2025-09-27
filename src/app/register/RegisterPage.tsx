import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { NameSearch } from "../../components/basename/NameSearch";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { WatchButton } from "../../components/basename/WatchButton";
import { useNameAvailability } from "../../hooks/useNameAvailability";
import { availabilityCopy, formatReason, formatWei } from "../../lib/format";
import { useWalletStore } from "../../store/wallet.store";
import { useUIStore } from "../../store/ui.store";
import type { Availability, NameKind } from "../../types/basename";
import styles from "./RegisterPage.module.css";

const DEFAULT_PRICE_WEI = 1_000_000_000_000_000n; // 0.001 ETH
const ETH_IN_WEI = 1_000_000_000_000_000_000n;
const ETH_TO_USD = 4000;
const GAS_WEI = 210_000_000_000_000n; // 0.00021 ETH placeholder
const PROTOCOL_FEE_WEI = 90_000_000_000_000n; // 0.00009 ETH placeholder

const AVAILABILITY_TONE = {
  available: "success" as const,
  taken: "danger" as const,
  unknown: "muted" as const,
};

interface RegisterLocationState {
  priceWei?: string;
  availability?: Availability;
  score?: number;
  reasons?: string[];
  kinds?: NameKind[];
  length?: number;
}

export function RegisterPage() {
  const { name: rawName = "" } = useParams<{ name: string }>();
  const location = useLocation();
  const locationState = (location.state as RegisterLocationState | null) ?? null;
  const addToast = useUIStore((state) => state.addToast);
  const trackEvent = useUIStore((state) => state.trackEvent);
  const isConnected = useWalletStore((state) => state.isConnected);
  const connectWallet = useWalletStore((state) => state.connect);

  const displayName = formatName(rawName);
  const breadcrumbName = displayName.split(".")[0] ?? displayName;
  const [years, setYears] = useState(1);

  const initialAvailability = locationState?.availability ?? "unknown";
  const initialPrice = locationState?.priceWei;
  const { availability, priceWei, isChecking } = useNameAvailability(
    displayName,
    initialAvailability,
    initialPrice
  );

  const pricePerYearWei = useMemo(() => resolvePriceWei(priceWei ?? initialPrice), [priceWei, initialPrice]);
  const registrationCostWei = useMemo(() => pricePerYearWei * BigInt(years), [pricePerYearWei, years]);
  const gasAndFeeWei = GAS_WEI + PROTOCOL_FEE_WEI;
  const totalCostWei = registrationCostWei + gasAndFeeWei;

  const availabilityTone = isChecking ? "muted" : AVAILABILITY_TONE[availability];
  const availabilityLabel = (isChecking ? "Checking…" : availabilityCopy(availability)).toUpperCase();

  const score = locationState?.score ?? null;
  const pricePerYearDisplay = formatWei(pricePerYearWei.toString());
  const registrationCostDisplay = formatWei(registrationCostWei.toString());
  const gasAndFeeDisplay = formatWei(gasAndFeeWei.toString());
  const totalCostDisplay = formatWei(totalCostWei.toString());

  const tags = useMemo(() => buildTags(locationState?.kinds, locationState?.reasons), [
    locationState?.kinds,
    locationState?.reasons,
  ]);

  const usdEstimate = formatUsd(registrationCostWei);
  const gasUsd = formatUsd(gasAndFeeWei);
  const totalUsd = formatUsd(totalCostWei);

  const isAvailable = availability === "available";
  const isTaken = availability === "taken";
  const disableActions = isChecking || availability === "unknown";

  const durationLabel = `${years} ${years === 1 ? "year" : "years"}`;

  const handleRegister = () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    trackEvent("registerClicks");
    addToast({ variant: "info", message: "Onchain registration coming soon" });
  };

  const handleViewOwner = () => {
    addToast({ variant: "info", message: "Owner details coming soon" });
  };

  const incrementYears = () => setYears((value) => Math.min(value + 1, 5));
  const decrementYears = () => setYears((value) => Math.max(value - 1, 1));

  return (
    <div className={styles.page}>
      <div className={styles.pageBackdrop} aria-hidden="true" />
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Basename Radar</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>{breadcrumbName}</span>
        </nav>

        <div className={styles.searchSection}>
          <NameSearch />
        </div>

        <section className={styles.hero}>
          <div className={styles.heroBadge}>
            <span className={styles.heroIcon} aria-hidden="true">
              <StarIcon />
            </span>
            <span className={styles.heroName}>{displayName}</span>
            <Badge tone={availabilityTone} className={styles.heroStatus}>
              {availabilityLabel}
            </Badge>
          </div>
          <div className={styles.heroMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Score</span>
              <span className={styles.metaValue}>{score ?? "—"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Price Per Year</span>
              <span className={styles.metaValue}>{pricePerYearDisplay}</span>
            </div>
          </div>
        </section>

        {tags.length > 0 && (
          <div className={styles.tagList}>
            {tags.map((tag) => (
              <Badge key={tag} tone="muted" className={styles.tag}>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <section className={styles.pricingCard}>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingColumn}>
              <span className={styles.columnLabel}>Registration Period</span>
              <div className={styles.durationControl}>
                <button
                  type="button"
                  className={styles.circleButton}
                  onClick={decrementYears}
                  aria-label="Decrease registration period"
                  disabled={years === 1}
                >
                  &minus;
                </button>
                <span className={styles.durationValue}>{durationLabel}</span>
                <button
                  type="button"
                  className={styles.circleButton}
                  onClick={incrementYears}
                  aria-label="Increase registration period"
                  disabled={years === 5}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.pricingColumn}>
              <span className={styles.columnLabel}>Estimated Cost</span>
              <div className={styles.amountValue}>{registrationCostDisplay}</div>
              <span className={styles.amountMeta}>≈ ${usdEstimate}</span>
            </div>

            <div className={styles.pricingColumn}>
              <span className={styles.columnLabel}>Primary Action</span>
              <div className={styles.actionGroup}>
                {!isConnected && (
                  <Button
                    type="button"
                    onClick={connectWallet}
                    disabled={disableActions}
                    fullWidth
                  >
                    Connect Wallet
                  </Button>
                )}

                {isConnected && isAvailable && (
                  <Button
                    type="button"
                    onClick={handleRegister}
                    disabled={disableActions}
                    fullWidth
                  >
                    Register
                  </Button>
                )}

                {isConnected && isAvailable && (
                  <WatchButton name={displayName} fullWidth disabled={disableActions} />
                )}

                {isConnected && isTaken && (
                  <WatchButton name={displayName} fullWidth disabled={disableActions} />
                )}

                {isConnected && isTaken && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleViewOwner}
                    disabled={disableActions}
                    fullWidth
                  >
                    View Owner
                  </Button>
                )}

                {isConnected && !isAvailable && !isTaken && (
                  <Button type="button" disabled fullWidth>
                    Check Status
                  </Button>
                )}

                {!isConnected && isTaken && (
                  <WatchButton name={displayName} fullWidth disabled={disableActions} />
                )}
              </div>
            </div>
          </div>

          <div className={styles.pricingBreakdown}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Base Gas + Protocol Fee</span>
              <span className={styles.breakdownValue}>
                {gasAndFeeDisplay}
                <span className={styles.breakdownMeta}>≈ ${gasUsd}</span>
              </span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Total</span>
              <span className={styles.breakdownValue}>
                {totalCostDisplay}
                <span className={styles.breakdownMeta}>≈ ${totalUsd}</span>
              </span>
            </div>
          </div>
        </section>

        <footer className={styles.footerNote}>
          <span>Unlock your username for free!</span>
          <Link to="/" className={styles.footerLink}>
            LEARN MORE
          </Link>
        </footer>
      </div>
    </div>
  );
}

function resolvePriceWei(value?: string | null): bigint {
  if (!value) {
    return DEFAULT_PRICE_WEI;
  }
  try {
    return BigInt(value);
  } catch (error) {
    console.warn("Invalid priceWei provided to register page", error);
    return DEFAULT_PRICE_WEI;
  }
}

function formatName(name?: string): string {
  if (!name) {
    return "yourname.base.eth";
  }
  return name.toLowerCase();
}

function buildTags(kinds?: NameKind[] | null, reasons?: string[] | null): string[] {
  const labels = new Set<string>();
  if (kinds) {
    kinds.forEach((kind) => {
      labels.add(formatKindTag(kind));
    });
  }
  if (reasons) {
    reasons.forEach((reason) => {
      labels.add(formatReason(reason).toUpperCase());
    });
  }
  return Array.from(labels);
}

function formatKindTag(kind: NameKind): string {
  if (kind === "word") {
    return "WORD";
  }
  if (kind === "palindrome") {
    return "PALINDROME";
  }
  return kind.toUpperCase();
}

function formatUsd(value: bigint): string {
  const eth = Number(value) / Number(ETH_IN_WEI);
  if (!Number.isFinite(eth)) {
    return "0.00";
  }
  return (eth * ETH_TO_USD).toFixed(2);
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2.5l1.944 4.14 4.556.656-3.25 3.3.768 4.58L10 12.75l-3.018 2.426.768-4.58-3.25-3.3 4.556-.655L10 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}
