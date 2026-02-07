import fetch from "node-fetch"

/**
 * Minimal backend endpoint for secure token exchange only
 * Handles OAuth token exchange for Shopify Client Credentials Grant flow
 */
export default async function handler(req, res) {
    // CRITICAL: Set CORS headers FIRST before any other processing
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
    res.setHeader("Access-Control-Max-Age", "86400")
    res.setHeader("Vary", "Origin")
    res.setHeader("X-Content-Type-Options", "nosniff")

    // Handle preflight requests - return immediately after headers
    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    const { storeDomain, clientId, clientSecret } = req.body

    if (!storeDomain || !clientId || !clientSecret) {
        return res.status(400).json({ error: "Missing storeDomain, clientId, or clientSecret" })
    }

    try {
        const cleanDomain = storeDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
        const tokenUrl = `https://${cleanDomain}/admin/oauth/access_token`

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: clientId,
                client_secret: clientSecret,
            }).toString(),
        })

        if (!response.ok) {
            const errorText = await response.text()
            return res.status(response.status).json({ 
                error: errorText || `Token request failed: ${response.status}` 
            })
        }

        const data = await response.json()
        res.status(200).json(data)
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        })
    }
}
