const DEFAULT_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' https://mainnet.base.org",
  "font-src 'self' data:",
  "frame-ancestors *",
];

export function buildCsp(directives: string[] = DEFAULT_DIRECTIVES): string {
  return directives.join("; ");
}

export const defaultCsp = buildCsp();
