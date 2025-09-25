import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { availabilityCopy, formatWei } from "../../lib/format";
import { useNameCheck } from "../../hooks/useNameCheck";
import { useUIStore } from "../../store/ui.store";
import styles from "./NameSearch.module.css";

interface NameSearchProps {
  autoFocus?: boolean;
}

export function NameSearch({ autoFocus }: NameSearchProps) {
  const [value, setValue] = useState("");
  const { status, availability, priceWei, error, checkName } = useNameCheck();
  const addToast = useUIStore((state) => state.addToast);
  const lastInvalidNoticeRef = useRef(0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    checkName(value);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const lowered = rawValue.toLowerCase();
    const sanitized = lowered.replace(/[^a-z0-9-]/g, "");

    if (sanitized !== lowered) {
      const now = Date.now();
      if (now - lastInvalidNoticeRef.current > 1200) {
        addToast({ variant: "info", message: "Use lowercase letters, numbers, or single dash" });
        lastInvalidNoticeRef.current = now;
      }
    }

    setValue(sanitized);
  };

  const tone = availability === "available" ? "success" : availability === "taken" ? "danger" : "muted";

  return (
    <section className={styles.wrapper} aria-label="Search basenames">
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          autoFocus={autoFocus}
          className={styles.input}
          placeholder="Search a basename you love…"
          value={value}
          onChange={handleChange}
          minLength={3}
          maxLength={50}
          pattern="[a-z0-9\-]{3,50}"
          title="3-50 chars, lowercase letters, numbers, single dash"
        />
        <Button type="submit" size="lg" className={styles.submit} disabled={status === "loading"}>
          {status === "loading" ? "Checking…" : "Check"}
        </Button>
      </form>
      <div className={styles.statusRow}>
        <Badge tone={tone}>{availabilityCopy(availability)}</Badge>
        {status === "loading" && <span className={styles.spinner} aria-hidden="true" />}
        {status === "success" && <strong>{formatWei(priceWei)}</strong>}
        {status === "error" && error && <span>{error}</span>}
        {status === "idle" && <span className={styles.hint}>Names support lowercase letters, numbers, single dash.</span>}
      </div>
    </section>
  );
}
