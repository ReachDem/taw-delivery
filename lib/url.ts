/**
 * Get the application base URL based on environment
 * 
 * - Production: NEXT_PUBLIC_APP_URL
 * - Development: https://taw-delivery.vercel.app (for demo on phones)
 * - Fallback: localhost:3000
 */
export function getAppUrl(): string {
  // Production: use the configured app URL
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_APP_URL || "https://taw-delivery.vercel.app";
  }
  
  // Development: use Vercel URL for easier mobile testing
  return "https://taw-delivery.vercel.app";
}

/**
 * Build the full proposal URL
 */
export function getProposalUrl(code: string): string {
  return `${getAppUrl()}/p/${code}`;
}
