import { useCallback, useRef, useState } from "react";
import { basenameService } from "../services/basename.service";
import type { Availability } from "../types/basename";
import { getNameCheckCache, setNameCheckCache } from "../lib/nameCheckCache";

interface CheckState {
  status: "idle" | "loading" | "success" | "error";
  availability: Availability | null;
  priceWei?: string;
  error?: string;
  lastName?: string;
}

const NAME_REGEX = /^[a-z0-9-]{3,50}$/;

export function useNameCheck() {
  const [state, setState] = useState<CheckState>({ status: "idle", availability: null });
  const lastRequest = useRef(0);

  const checkName = useCallback(async (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!NAME_REGEX.test(trimmed) || trimmed.startsWith("-") || trimmed.endsWith("-")) {
      setState({
        status: "error",
        availability: null,
        error: "Use 3-50 chars, lowercase letters/numbers, dash allowed only in the middle",
      });
      return;
    }

    const cached = getNameCheckCache(trimmed);
    if (cached) {
      setState({
        status: "success",
        availability: cached.availability,
        priceWei: cached.priceWei,
        lastName: trimmed,
      });
      return;
    }

    const requestId = Date.now();
    lastRequest.current = requestId;
    setState({ status: "loading", availability: null });
    try {
      const response = await basenameService.checkName(trimmed);
      setNameCheckCache(trimmed, response);
      if (lastRequest.current === requestId) {
        setState({
          status: "success",
          availability: response.availability,
          priceWei: response.priceWei,
          lastName: trimmed,
        });
      }
    } catch (error) {
      if (lastRequest.current === requestId) {
        setState({
          status: "error",
          availability: null,
          error: error instanceof Error ? error.message : "Could not check name",
        });
      }
    }
  }, []);

  return { ...state, checkName };
}
