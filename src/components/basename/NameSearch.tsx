import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { availabilityCopy, formatWei } from "../../lib/format";
import { useNameCheck } from "../../hooks/useNameCheck";
import styles from "./NameSearch.module.css";

interface NameSearchProps {
  autoFocus?: boolean;
}

export function NameSearch({ autoFocus }: NameSearchProps) {
  const [value, setValue] = useState("");
  const { status, availability, priceWei, error, checkName } = useNameCheck();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    checkName(value);
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
          onChange={(event) => setValue(event.target.value)}
          minLength={3}
          maxLength={50}
          pattern="[a-z0-9-]{3,50}"
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
