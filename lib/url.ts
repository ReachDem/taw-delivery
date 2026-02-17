/**
 * Resolve the application base URL.
 *
 * Priority:
 * - Production: NEXT_PUBLIC_URL, then NEXT_PUBLIC_APP_URL
 * - Development: NEXT_NGROK_APP_URL, then NEXT_PUBLIC_APP_URL
 * - Fallback: http://localhost:3000
 */
export function getAppUrl(): string {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === "production") {
    const productionUrl = process.env.NEXT_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL;

    if (productionUrl && productionUrl.trim().length > 0) {
      return productionUrl.trim().replace(/\/$/, "");
    }

    console.warn("⚠️ NEXT_PUBLIC_URL/NEXT_PUBLIC_APP_URL is not set in production. Using localhost fallback.");
    return "http://localhost:3000";
  }

  if (process.env.NEXT_NGROK_APP_URL && process.env.NEXT_NGROK_APP_URL.trim().length > 0) {
    return process.env.NEXT_NGROK_APP_URL.trim().replace(/\/$/, "");
  }

  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim().length > 0) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
  }

  console.warn("⚠️ NEXT_PUBLIC_APP_URL is not set. Using localhost fallback.");
  return "http://localhost:3000";
}

/**
 * Build the full proposal URL.
 */
export function getProposalUrl(code: string): string {
  return `${getAppUrl()}/p/${code}`;
}
