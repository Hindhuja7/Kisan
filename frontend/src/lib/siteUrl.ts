export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function getDashboardUrl(): string {
  return `${getSiteOrigin()}/dashboard`;
}

export function getLoginUrl(): string {
  return `${getSiteOrigin()}/login`;
}
