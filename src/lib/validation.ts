export type EthBaseLabelValidationError =
  | "too-short"
  | "invalid-characters"
  | "contains-dot"
  | "edge-dash";

const ALLOWED_PATTERN = /^[a-z0-9-]+$/;

/**
 * Проверяет базовые правила для base .eth label и возвращает код ошибки.
 */
export function getEthBaseLabelError(raw: string): EthBaseLabelValidationError | null {
  const label = raw.trim().toLowerCase();

  if (label.includes(".")) {
    return "contains-dot";
  }

  if (!ALLOWED_PATTERN.test(label)) {
    return "invalid-characters";
  }

  if (label.length < 3) {
    return "too-short";
  }

  if (label.startsWith("-") || label.endsWith("-")) {
    return "edge-dash";
  }

  return null;
}

export function isValidEthBaseLabel(raw: string): boolean {
  return getEthBaseLabelError(raw) === null;
}
