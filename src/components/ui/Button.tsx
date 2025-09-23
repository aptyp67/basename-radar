import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth = false, className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        styles.button,
        styles[variant],
        styles[`size-${size}`],
        fullWidth && styles.fullWidth,
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
