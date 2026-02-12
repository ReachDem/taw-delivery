/**
 * Link Shortener Integration with rcdm.ink API
 * 
 * This module provides functions to create and manage short links
 * for delivery proposals using the Sink API.
 */

const RCDM_INK_API_URL = "https://rcdm.ink";
const RCDM_INK_TOKEN = process.env.RCDM_INK_TOKEN;

interface CreateLinkResponse {
    slug: string;
    url: string;
    shortUrl: string;
}

interface LinkStats {
    slug: string;
    url: string;
    clicks?: number;
    createdAt?: number;
}

/**
 * Create a short link for a proposal URL
 * 
 * @param proposalUrl - The full URL to the proposal page (e.g., https://domain.com/p/ABCD1)
 * @param code - The proposal code to use as slug (e.g., "ABCD1")
 * @returns The created short link info
 */
export async function createShortLink(
    proposalUrl: string,
    code: string
): Promise<CreateLinkResponse> {
    if (!RCDM_INK_TOKEN) {
        throw new Error("RCDM_INK_TOKEN not configured");
    }

    const response = await fetch(`${RCDM_INK_API_URL}/api/link/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RCDM_INK_TOKEN}`,
        },
        body: JSON.stringify({
            url: proposalUrl,
            slug: code.toLowerCase(), // Use proposal code as slug
            comment: `Proposition livraison ${code}`,
            expiration: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days expiry
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Failed to create short link:", error);
        throw new Error(`Erreur création lien court: ${response.status}`);
    }

    const data: CreateLinkResponse = await response.json();
    
    return {
        slug: data.slug,
        url: data.url,
        shortUrl: data.shortUrl,
    };
}

/**
 * Get stats for a short link
 * 
 * @param slug - The slug of the short link
 * @returns Link stats including click count
 */
export async function getShortLinkStats(slug: string): Promise<LinkStats | null> {
    if (!RCDM_INK_TOKEN) {
        throw new Error("RCDM_INK_TOKEN not configured");
    }

    const response = await fetch(
        `${RCDM_INK_API_URL}/api/link/query?slug=${encodeURIComponent(slug.toLowerCase())}`,
        {
            headers: {
                "Authorization": `Bearer ${RCDM_INK_TOKEN}`,
            },
        }
    );

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        throw new Error(`Erreur récupération stats: ${response.status}`);
    }

    const data = await response.json();
    
    return {
        slug: data.slug,
        url: data.url,
        clicks: data.clicks || 0,
        createdAt: data.createdAt,
    };
}

/**
 * Delete a short link
 * 
 * @param slug - The slug of the short link to delete
 */
export async function deleteShortLink(slug: string): Promise<void> {
    if (!RCDM_INK_TOKEN) {
        throw new Error("RCDM_INK_TOKEN not configured");
    }

    const response = await fetch(`${RCDM_INK_API_URL}/api/link/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RCDM_INK_TOKEN}`,
        },
        body: JSON.stringify({
            slug: slug.toLowerCase(),
        }),
    });

    if (!response.ok && response.status !== 404) {
        throw new Error(`Erreur suppression lien: ${response.status}`);
    }
}

/**
 * Create or update a short link (upsert)
 * 
 * @param proposalUrl - The full URL to the proposal page
 * @param code - The proposal code to use as slug
 * @returns The short link info
 */
export async function upsertShortLink(
    proposalUrl: string,
    code: string
): Promise<CreateLinkResponse> {
    if (!RCDM_INK_TOKEN) {
        throw new Error("RCDM_INK_TOKEN not configured");
    }

    const response = await fetch(`${RCDM_INK_API_URL}/api/link/upsert`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RCDM_INK_TOKEN}`,
        },
        body: JSON.stringify({
            url: proposalUrl,
            slug: code.toLowerCase(),
            comment: `Proposition livraison ${code}`,
            expiration: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days expiry
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Failed to upsert short link:", error);
        throw new Error(`Erreur création/mise à jour lien court: ${response.status}`);
    }

    return {
        slug: code.toLowerCase(),
        url: proposalUrl,
        shortUrl: `${RCDM_INK_API_URL}/${code.toLowerCase()}`,
    };
}
