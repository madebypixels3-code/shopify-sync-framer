import express from "express"
import cors from "cors"
import fetch from "node-fetch"

const app = express()
const PORT = process.env.PORT || 3001

// Configure CORS for all origins and methods
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
}

app.use(cors(corsOptions))
app.use(express.json())

// Handle preflight requests explicitly
app.options("*", cors(corsOptions))

/**
 * Token exchange endpoint for Shopify Client Credentials Grant
 * POST /api/shopify-proxy
 * Body: { storeDomain, clientId, clientSecret }
 */
app.post("/api/shopify-proxy", async (req, res) => {
    try {
        const { storeDomain, clientId, clientSecret } = req.body

        if (!storeDomain || !clientId || !clientSecret) {
            console.error(`[Token] ✗ Missing fields:`, {
                storeDomain: !!storeDomain,
                clientId: !!clientId,
                clientSecret: !!clientSecret,
            })
            return res.status(400).json({
                error: "Missing required fields: storeDomain, clientId, clientSecret",
            })
        }

        const cleanDomain = storeDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
        const tokenUrl = `https://${cleanDomain}/admin/oauth/access_token`

        console.log(`[Token] → POST ${tokenUrl}`)

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
            const errorBody = await response.text()
            console.error(`[Token] ✗ Token request returned ${response.status}`)
            console.error(`[Token] Domain: ${cleanDomain}`)
            console.error(`[Token] Response: ${errorBody.substring(0, 500)}`)
            
            if (response.status === 400) {
                return res.status(400).json({
                    error: "Invalid Client ID or Secret",
                    details: errorBody,
                })
            }
            
            if (response.status === 401) {
                return res.status(401).json({
                    error: "Authentication failed",
                    details: errorBody,
                })
            }
            
            if (response.status === 403) {
                return res.status(403).json({
                    error: "App not installed on this store",
                    details: errorBody,
                })
            }
            
            return res.status(response.status).json({
                error: `Token request failed: ${response.status}`,
                details: errorBody,
                domain: cleanDomain,
            })
        }

        const data = await response.json()
        console.log(`[Token] ✓ Success: Got access token for ${cleanDomain}`)

        res.json(data)
    } catch (error) {
        console.error(`[Token] ✗ Error:`, error instanceof Error ? error.message : String(error))
        res.status(500).json({
            error: "Token request failed",
            message: error instanceof Error ? error.message : "Unknown error",
        })
    }
})

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
    console.log(`[Health] ✓ Health check`)
    res.json({ status: "ok" })
})

/**
 * Shopify API proxy endpoint for all API requests
 * POST /api/shopify-request
 * Body: { storeDomain, accessToken, path, params }
 */
app.post("/api/shopify-request", async (req, res) => {
    try {
        const { storeDomain, accessToken, path, params } = req.body

        if (!storeDomain || !accessToken || !path) {
            console.error(`[API] ✗ Missing fields:`, {
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
            console.error(`[API] ✗ Shopify API returned ${response.status}`)
            console.error(`[API] Path: ${path}`)
            console.error(`[API] Domain: ${cleanDomain}`)
            console.error(`[API] Response: ${errorBody.substring(0, 500)}`)
            
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

        console.log(`[API] ✓ Success: ${response.status} ${path}`, {
            callLimit: callLimit || "N/A",
        })

        res.json({
            data,
            link,
            callLimit,
        })
    } catch (error) {
        console.error(`[API] ✗ Error:`, error instanceof Error ? error.message : String(error))
        res.status(500).json({
            error: "API request failed",
            message: error instanceof Error ? error.message : "Unknown error",
        })
    }
})

/**
 * License validation endpoint
 * POST /api/validate-license
 * Body: { licenseKey }
 * Validates license key against Lemon Squeezy API
 */
app.post("/api/validate-license", async (req, res) => {
    // Ensure CORS headers are present
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
    
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
            console.warn("[License] ⚠️  LEMON_SQUEEZY_API_KEY not configured")
            return res.status(500).json({
                error: "License validation not configured",
                isValid: false,
            })
        }

        console.log(`[License] → Validating: ${licenseKey.substring(0, 8)}...`)

        // Call Lemon Squeezy API to validate license
        const response = await fetch("https://api.lemonsqueezy.com/v1/license-keys/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${lemonSqueezyApiKey}`,
            },
            body: JSON.stringify({
                license_key: licenseKey,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error(`[License] ✗ Validation failed: ${response.status}`)
            console.error(`[License] Error:`, data.error || data.message)
            return res.status(200).json({
                isValid: false,
                error: data.error || "Invalid license key",
            })
        }

        const isValid = data.valid === true

        if (isValid) {
            console.log(`[License] ✅ Valid: ${licenseKey.substring(0, 8)}...`)
        } else {
            console.log(`[License] ✗ Invalid: ${licenseKey.substring(0, 8)}...`)
        }

        return res.status(200).json({
            isValid: isValid,
            license_key: data.license_key || null,
            customer: data.customer || null,
            expires_at: data.expires_at || null,
        })
    } catch (error) {
        console.error(`[License] ✗ Validation error:`, error)
        return res.status(200).json({
            isValid: false,
            error: error instanceof Error ? error.message : "Validation error",
        })
    }
})

app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`)
    console.log(`║  Shopify Sync - Backend Server                             ║`)
    console.log(`║  Listening on http://localhost:${PORT}                             ║`)
    console.log(`║  CORS: Enabled for all origins                            ║`)
    console.log(`╚════════════════════════════════════════════════════════════╝\n`)
    console.log(`Endpoints:`)
    console.log(`  POST http://localhost:${PORT}/api/shopify-proxy   - Token exchange`)
    console.log(`  POST http://localhost:${PORT}/api/shopify-request - API proxy`)
    console.log(`  POST http://localhost:${PORT}/api/validate-license - License validation`)
    console.log(`  GET  http://localhost:${PORT}/health             - Health check\n`)
})
