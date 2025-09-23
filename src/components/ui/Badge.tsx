import clsx from "clsx";
import styles from "./Badge.module.css";

export type BadgeTone = "default" | "success" | "warning" | "danger" | "muted";

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "default", children, className }: BadgeProps) {
  return <span className={clsx(styles.badge, tone !== "default" && styles[tone], className)}>{children}</span>;
}
