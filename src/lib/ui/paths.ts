const BASE = (import.meta.env?.BASE_URL ?? "/").replace(/\/?$/, "/");

export function withBase(path = ""): string {
  return BASE + path.replace(/^\//, "");
}

export const ROUTES = {
  home: withBase(),
  factory: withBase("app/"),
  portfolio: withBase("app/portfolio/"),
  telemetry: withBase("app/telemetry/"),
} as const;

export function ventureUrl(id: string): string {
  return `${ROUTES.factory}?v=${encodeURIComponent(id)}`;
}
