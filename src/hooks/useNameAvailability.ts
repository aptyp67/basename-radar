import { useEffect, useState } from "react";
import { basenameService } from "../services/basename.service";
import type { Availability, NameCheckResponse } from "../types/basename";
import { getNameCheckCache, setNameCheckCache } from "../lib/nameCheckCache";

interface NameAvailabilityState {
  availability: Availability;
  priceWei?: string;
  isChecking: boolean;
}

const inflightRequests = new Map<string, Promise<NameCheckResponse>>();

const MAX_CONCURRENT_CHECKS = 3;
let activeChecks = 0;
const pendingChecks: Array<() => void> = [];

function scheduleCheck<T>(factory: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      activeChecks += 1;
      factory()
        .then(resolve, reject)
        .finally(() => {
          activeChecks -= 1;
          const next = pendingChecks.shift();
          if (next) {
            next();
          }
        });
    };

    if (activeChecks < MAX_CONCURRENT_CHECKS) {
      run();
    } else {
      pendingChecks.push(run);
    }
  });
}

function enqueueSequentialCheck(normalized: string): Promise<NameCheckResponse> {
  const cached = getNameCheckCache(normalized);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inFlight = inflightRequests.get(normalized);
  if (inFlight) {
    return inFlight;
  }

  const request = scheduleCheck(() => basenameService.checkName(normalized))
    .then((response) => {
      setNameCheckCache(normalized, response);
      return response;
    })
    .finally(() => {
      inflightRequests.delete(normalized);
    });

  inflightRequests.set(normalized, request);
  return request;
}

export function useNameAvailability(
  name: string,
  initialAvailability: Availability,
  initialPriceWei?: string
): NameAvailabilityState {
  const normalized = name.toLowerCase();
  const [state, setState] = useState<NameAvailabilityState>(() => {
    const cached = getNameCheckCache(normalized);
    if (cached) {
      return { availability: cached.availability, priceWei: cached.priceWei, isChecking: false };
    }
    return { availability: initialAvailability, priceWei: initialPriceWei, isChecking: true };
  });

  useEffect(() => {
    let cancelled = false;

    const cached = getNameCheckCache(normalized);
    if (cached) {
      setState({ availability: cached.availability, priceWei: cached.priceWei, isChecking: false });
      return () => {
        cancelled = true;
      };
    }

    setState({
      availability: initialAvailability,
      priceWei: initialPriceWei,
      isChecking: true,
    });

    enqueueSequentialCheck(normalized)
      .then((response) => {
        if (!cancelled) {
          setState({ availability: response.availability, priceWei: response.priceWei, isChecking: false });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to update basename availability", error);
          setState((prev) => ({ ...prev, isChecking: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [normalized, initialAvailability, initialPriceWei]);

  return state;
}
