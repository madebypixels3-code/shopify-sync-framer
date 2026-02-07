/**
 * Shopify API proxy endpoint for Vercel serverless
 * POST /api/shopify-request
 * Body: { storeDomain, accessToken, path, params }
 */
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

    // Handle preflight
    if (req.method === "OPTIONS") {
        res.status(200).end()
        return
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const { storeDomain, accessToken, path, params } = req.body

        if (!storeDomain || !accessToken || !path) {
            console.error(`[API] Missing fields:`, {
                storeDomain: !!storeDomain,
                accessToken: !!accessToken,
                path: !!path,
            })
            return res.status(400).json({
                error: "Missing required fields: storeDomain, accessToken, path",
            })
        }

        const cleanDomain = storeDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
        const apiVersion = "2026-01"
        const url = new URL(`https://${cleanDomain}/admin/api/${apiVersion}${path}`)

        // Add query parameters
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value))
                }
            })
        }

        console.log(`[API] → GET ${path} on ${cleanDomain}`)

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken,
            },
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error(`[API] Shopify API returned ${response.status}`)
            
            if (response.status === 401) {
                return res.status(401).json({
                    error: "Access token invalid or expired",
                    details: errorBody,
                })
            }
            
            if (response.status === 403) {
                return res.status(403).json({
                    error: "Insufficient permissions",
                    details: errorBody,
                })
            }
            
            return res.status(response.status).json({
                error: `Shopify API error: ${response.status}`,
                details: errorBody,
                path,
                domain: cleanDomain,
            })
        }

        const data = await response.json()
        const link = response.headers.get("link")
        const callLimit = response.headers.get("x-shopify-shop-api-call-limit")

        console.log(`[API] Success: ${response.status} ${path}`)

        res.json({
            data,
            link,
            callLimit,
        })
    } catch (error) {
        console.error(`[API] Error:`, error instanceof Error ? error.message : String(error))
        res.status(500).json({
            error: "API request failed",
            message: error instanceof Error ? error.message : "Unknown error",
        })
    }
}
