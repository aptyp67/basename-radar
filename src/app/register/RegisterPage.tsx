import { useMemo, useState } from "react";
import { useSwitchChain } from "wagmi";
import { UserRejectedRequestError } from "viem";
import { Link, useLocation, useParams } from "react-router-dom";
import { NameSearch } from "../../components/basename/NameSearch";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { WatchButton } from "../../components/basename/WatchButton";
import { useNameAvailability } from "../../hooks/useNameAvailability";
import { availabilityCopy, formatReason, formatWei, formatUsd } from "../../lib/format";
import { useWalletStore } from "../../store/wallet.store";
import { useUIStore } from "../../store/ui.store";
import { useRegisterWithFee } from "../../hooks/useRegisterWithFee";
import { appNetwork } from "../../config/network";
import {
  REGISTER_WITH_FEE_BPS,
  REGISTER_WITH_FEE_CHAIN_ID,
  calculateTotalWithFee,
} from "../../services/registerWithFee.contract";
import type { Availability, NameKind } from "../../types/basename";
import styles from "./RegisterPage.module.css";

const DEFAULT_PRICE_WEI = 1_000_000_000_000_000n; // 0.001 ETH
const REQUIRED_CHAIN_HEX = `0x${REGISTER_WITH_FEE_CHAIN_ID.toString(16)}`;
const WRAPPER_FEE_PERCENT = `${(Number(REGISTER_WITH_FEE_BPS) / 100).toFixed(2)}%`;
const BASESCAN_TX_URL = appNetwork.explorerTxUrl;
const REQUIRED_CHAIN_LABEL = appNetwork.label;

const AVAILABILITY_TONE = {
  available: "success" as const,
  taken: "danger" as const,
  unknown: "muted" as const,
};

interface RegisterLocationState {
  priceWei?: string;
  availability?: Availability;
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
  const isConnecting = useWalletStore((state) => state.isConnecting);
  const chainId = useWalletStore((state) => state.chainId);
  const { register, isRegistering } = useRegisterWithFee();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();

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
  const { total: totalCostWei, fee: wrapperFeeWei } = useMemo(
    () => calculateTotalWithFee(registrationCostWei),
    [registrationCostWei]
  );

  const availabilityTone = isChecking ? "muted" : AVAILABILITY_TONE[availability];
  const availabilityLabel = (isChecking ? "Checking…" : availabilityCopy(availability)).toUpperCase();

  const pricePerYearDisplay = formatWei(pricePerYearWei.toString());
  const registrationCostDisplay = formatWei(registrationCostWei.toString());
  const wrapperFeeDisplay = formatWei(wrapperFeeWei.toString());
  const totalCostDisplay = formatWei(totalCostWei.toString());

  const tags = useMemo(() => buildTags(locationState?.kinds, locationState?.reasons), [
    locationState?.kinds,
    locationState?.reasons,
  ]);

  const usdEstimate = formatUsd(registrationCostWei);
  const wrapperFeeUsd = formatUsd(wrapperFeeWei);
  const totalUsd = formatUsd(totalCostWei);

  const isAvailable = availability === "available";
  const isTaken = availability === "taken";
  const isOnRequiredChain = useMemo(() => {
    if (!chainId) {
      return true;
    }
    return chainId.toLowerCase() === REQUIRED_CHAIN_HEX;
  }, [chainId]);
  const isNamePending = isChecking || availability === "unknown";
  const disableRegister = isNamePending || isRegistering;
  const disableWatch = isNamePending || isRegistering;
  const disableSwitch = isNamePending || isSwitchingChain;

  const durationLabel = `${years} ${years === 1 ? "year" : "years"}`;

  const handleRegister = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    if (!isOnRequiredChain) {
      addToast({ variant: "error", message: `Switch to ${REQUIRED_CHAIN_LABEL} to register` });
      return;
    }
    if (!isAvailable) {
      addToast({ variant: "error", message: "Name is not available" });
      return;
    }
    try {
      trackEvent("registerClicks");
      const { hash } = await register({ name: displayName, years });
      addToast({
        variant: "success",
        message: `Registration submitted (${formatHash(hash)})`,
      });
      console.info(`View transaction on BaseScan: ${BASESCAN_TX_URL}${hash}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not complete registration";
      addToast({ variant: "error", message });
    }
  };

  const handleSwitchNetwork = async () => {
    if (!switchChainAsync) {
      addToast({ variant: "error", message: "Switch networks from your wallet" });
      return;
    }
    try {
      await switchChainAsync({ chainId: REGISTER_WITH_FEE_CHAIN_ID });
    } catch (error) {
      const message =
        error instanceof UserRejectedRequestError
          ? "Network switch rejected in wallet"
          : "Failed to switch network";
      addToast({ variant: "error", message });
    }
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
          <Link
            to={{
              pathname: "/",
              search: location.search,
            }}
          >
            Basename Radar
          </Link>
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
                    onClick={() => {
                      void connectWallet();
                    }}
                    disabled={isNamePending || isConnecting}
                    fullWidth
                  >
                    {isConnecting ? "Connecting…" : "Connect Wallet"}
                  </Button>
                )}

                {isConnected && !isOnRequiredChain && (
                  <Button
                    type="button"
                    onClick={() => {
                      void handleSwitchNetwork();
                    }}
                    disabled={disableSwitch}
                    fullWidth
                  >
                    {isSwitchingChain ? "Switching…" : `Switch to ${REQUIRED_CHAIN_LABEL}`}
                  </Button>
                )}

                {isConnected && isOnRequiredChain && isAvailable && (
                  <Button
                    type="button"
                    onClick={() => {
                      void handleRegister();
                    }}
                    disabled={disableRegister}
                    fullWidth
                  >
                    {isRegistering ? "Registering…" : "Register"}
                  </Button>
                )}

                {isConnected && isAvailable && (
                  <WatchButton name={displayName} fullWidth disabled={disableWatch} />
                )}

                {isConnected && isTaken && (
                  <WatchButton name={displayName} fullWidth disabled={disableWatch} />
                )}

                {isConnected && isTaken && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleViewOwner}
                    disabled={isNamePending}
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
                  <WatchButton name={displayName} fullWidth disabled={isNamePending} />
                )}
              </div>
            </div>
          </div>

          <div className={styles.pricingBreakdown}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Wrapper Fee ({WRAPPER_FEE_PERCENT})</span>
              <span className={styles.breakdownValue}>
                {wrapperFeeDisplay}
                <span className={styles.breakdownMeta}>≈ ${wrapperFeeUsd}</span>
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
  return (kind as string).toUpperCase();
}

function formatHash(hash: `0x${string}`): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
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
