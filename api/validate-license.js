/**
 * License validation endpoint for Vercel serverless
 * POST /api/validate-license
 * Body: { licenseKey }
 * Validates license key against Lemon Squeezy API
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
        const { licenseKey } = req.body

        if (!licenseKey) {
            return res.status(400).json({
                error: "Missing license key",
                isValid: false,
            })
        }

        const lemonSqueezyApiKey = process.env.LEMON_SQUEEZY_API_KEY
        if (!lemonSqueezyApiKey) {
            console.warn("[License] LEMON_SQUEEZY_API_KEY not configured")
            return res.status(500).json({
                error: "License validation not configured",
                isValid: false,
            })
        }

        console.log(`[License] Validating: ${licenseKey.substring(0, 8)}...`)

        // Call Lemon Squeezy API to validate license
        const response = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                license_key: licenseKey,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error(`[License] Validation failed: ${response.status}`)
            return res.status(200).json({
                isValid: false,
                error: data.error || "Invalid license key",
            })
        }

        const isValid = data.valid === true

        console.log(`[License] ${isValid ? "✅ Valid" : "✗ Invalid"}: ${licenseKey.substring(0, 8)}...`)

        return res.status(200).json({
            isValid: isValid,
            license_key: data.license_key || null,
            meta: data.meta || null,
        })
    } catch (error) {
        console.error(`[License] Validation error:`, error)
        return res.status(200).json({
            isValid: false,
            error: error instanceof Error ? error.message : "Validation error",
        })
    }
}
