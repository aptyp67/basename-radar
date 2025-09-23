import { useUIStore } from "../../store/ui.store";
import styles from "./DebugPage.module.css";

export function DebugPage() {
  const metrics = useUIStore((state) => state.metrics);

  return (
    <main className={styles.page}>
      <h1>Debug Counters</h1>
      <section className={styles.card}>
        <p>Realtime metrics captured from the mock flows.</p>
        <div className={styles.metrics}>
          <Metric title="Register clicks" value={metrics.registerClicks} />
          <Metric title="Watch clicks" value={metrics.watchClicks} />
          <Metric title="Filter changes" value={metrics.filterChanges} />
          <Metric
            title="Last API latency"
            value={metrics.lastApiLatencyMs ? `${metrics.lastApiLatencyMs} ms` : "—"}
          />
          <Metric title="Rendered cards" value={metrics.renderedCards} />
          <Metric title="Average score" value={metrics.averageScore} />
        </div>
      </section>
    </main>
  );
}

interface MetricProps {
  title: string;
  value: number | string | null;
}

function Metric({ title, value }: MetricProps) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricTitle}>{title}</span>
      <span className={styles.metricValue}>{value ?? "—"}</span>
    </div>
  );
}
