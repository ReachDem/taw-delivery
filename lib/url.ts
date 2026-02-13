/**
 * Get the application base URL based on environment
 * 
 * - Production: NEXT_PUBLIC_APP_URL or Vercel demo URL
 * - Development: NEXT_PUBLIC_APP_URL or http://localhost:3000
 * - Fallback: http://localhost:3000
 */
export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Prefer explicitly configured URL in all environments
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl;
  }

  // Production: fall back to the Vercel demo URL
  if (process.env.NODE_ENV === "production") {
    return "https://taw-delivery.vercel.app";
  }

  // Development / other: final fallback to localhost
  return "http://localhost:3000";
}

/**
 * Build the full proposal URL
 */
export function getProposalUrl(code: string): string {
  return `${getAppUrl()}/p/${code}`;
}
