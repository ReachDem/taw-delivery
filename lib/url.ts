/**
 * Get the application base URL from NEXT_PUBLIC_APP_URL
 * 
 * Configure this in .env:
 * - Development with ngrok: NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
 * - Production: NEXT_PUBLIC_APP_URL=https://your-domain.com
 * - Local only: NEXT_PUBLIC_APP_URL=http://localhost:3000
 */
export function getAppUrl(): string {
  // In development, prioritize the ngrok URL if it exists
  if (process.env.NODE_ENV === "development" && process.env.NEXT_NGROK_APP_URL) {
    return process.env.NEXT_NGROK_APP_URL.trim().replace(/\/$/, "");
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl || configuredUrl.trim().length === 0) {
    console.warn("⚠️ NEXT_PUBLIC_APP_URL is not set. Using localhost fallback.");
    return "http://localhost:3000";
  }

  // Remove trailing slash if present
  return configuredUrl.trim().replace(/\/$/, "");
}

/**
 * Build the full proposal URL
 */
export function getProposalUrl(code: string): string {
  return `${getAppUrl()}/p/${code}`;
}
