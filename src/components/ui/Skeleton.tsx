import clsx from "clsx";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  className?: string;
}

export function Skeleton({ height = 48, width = "100%", className }: SkeletonProps) {
  return (
    <div
      className={clsx(styles.wrapper, className)}
      style={{ height: typeof height === "number" ? `${height}px` : height, width }}
    />
  );
}
