import express from "express"
import cors from "cors"
import fetch from "node-fetch"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

/**
 * Proxy endpoint for Shopify API requests
 * POST /api/shopify-proxy
 * Body: { storeDomain, auth, path, params }
 * auth: { accessToken }
 */
app.post("/api/shopify-proxy", async (req, res) => {
    try {
        const { storeDomain, auth, path, params } = req.body

        if (!storeDomain || !auth || !path) {
            console.error(`[Proxy] ✗ Missing fields:`, {
                storeDomain: !!storeDomain,
                auth: !!auth,
                path: !!path,
            })
            return res.status(400).json({
                error: "Missing required fields: storeDomain, auth, path",
            })
        }

        const cleanDomain = storeDomain.trim().replace(/^https?:\/\//, "")
        const apiVersion = "2023-10"
        const url = new URL(`https://${cleanDomain}/admin/api/${apiVersion}${path}`)

        // Add query parameters
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value))
                }
            })
        }

        console.log(`[Proxy] → ${req.method} ${path} on ${cleanDomain}`)

        if (!auth.accessToken) {
            console.error(`[Proxy] ✗ Missing access token`)
            return res.status(400).json({
                error: "Invalid auth: must provide accessToken",
            })
        }

        const accessToken = auth.accessToken
        console.log(`[Proxy] → Using provided access token`)

        const response = await fetch(url.toString(), {
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken,
            },
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error(`[Proxy] ✗ Shopify API returned ${response.status}`)
            console.error(`[Proxy] Path: ${path}`)
            console.error(`[Proxy] Domain: ${cleanDomain}`)
            console.error(`[Proxy] Response: ${errorBody.substring(0, 200)}`)
            
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

        console.log(`[Proxy] ✓ Success: ${response.status} ${path}`, {
            callLimit: callLimit || "N/A",
        })

        res.json({
            data,
            link,
            callLimit,
        })
    } catch (error) {
        console.error(`[Proxy] ✗ Error:`, error instanceof Error ? error.message : String(error))
        res.status(500).json({
            error: "Proxy request failed",
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

app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`)
    console.log(`║  Shopify Sync - Proxy Server                              ║`)
    console.log(`║  Listening on http://localhost:${PORT}                             ║`)
    console.log(`║  CORS: Enabled for all origins                            ║`)
    console.log(`╚════════════════════════════════════════════════════════════╝\n`)
    console.log(`Auth: Admin API access token (from Dev Dashboard)`)
    console.log(`Endpoints:`)
    console.log(`  POST http://localhost:${PORT}/api/shopify-proxy - Shopify API proxy`)
    console.log(`  GET  http://localhost:${PORT}/health           - Health check\n`)
})
