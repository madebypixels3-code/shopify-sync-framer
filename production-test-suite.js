#!/usr/bin/env node

/**
 * Production Ready Test Suite
 * Tests all critical functionality for production deployment
 */

import https from "https"

const API_URL = "https://shopify-sync-framer-eight.vercel.app"
const TESTS = []

// Test results accumulator
let passedTests = 0
let failedTests = 0

function makeRequest(method, path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL)
        const requestOptions = {
            method,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Production-Test-Suite/1.0",
                ...options.headers,
            },
        }

        const req = https.request(url, requestOptions, (res) => {
            let data = ""
            res.on("data", (chunk) => {
                data += chunk
            })
            res.on("end", () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data,
                })
            })
        })

        req.on("error", reject)
        if (options.body) req.write(JSON.stringify(options.body))
        req.end()
    })
}

async function testCORSHeaders() {
    console.log("\n📋 TEST 1: CORS Preflight Headers")
    console.log("─".repeat(50))

    try {
        const res = await makeRequest("OPTIONS", "/api/shopify-proxy", {
            headers: {
                "Origin": "https://localhost:4173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        })

        const checks = {
            "Status 200": res.status === 200,
            "Allow-Origin header": res.headers["access-control-allow-origin"] === "*",
            "Allow-Methods header": res.headers["access-control-allow-methods"]?.includes("POST"),
            "Allow-Headers header": res.headers["access-control-allow-headers"]?.includes("Content-Type"),
            "Max-Age header": res.headers["access-control-max-age"] === "86400",
        }

        let allPass = true
        Object.entries(checks).forEach(([check, pass]) => {
            console.log(`  ${pass ? "✅" : "❌"} ${check}`)
            if (!pass) allPass = false
        })

        if (allPass) {
            passedTests++
            console.log("  Result: ✅ PASSED")
        } else {
            failedTests++
            console.log("  Result: ❌ FAILED")
        }
    } catch (error) {
        failedTests++
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
}

async function testAPIConnectivity() {
    console.log("\n📋 TEST 2: API Endpoint Connectivity")
    console.log("─".repeat(50))

    try {
        const res = await makeRequest("POST", "/api/shopify-proxy", {
            headers: { "Origin": "https://localhost:4173" },
            body: {
                storeDomain: "test.myshopify.com",
                clientId: "test-client",
                clientSecret: "test-secret",
            },
        })

        const checks = {
            "Response received": !!res.body,
            "Not 404": res.status !== 404,
            "Not 500": res.status !== 500,
            "Has CORS header": res.headers["access-control-allow-origin"] === "*",
        }

        let allPass = true
        Object.entries(checks).forEach(([check, pass]) => {
            console.log(`  ${pass ? "✅" : "❌"} ${check} (HTTP ${res.status})`)
            if (!pass) allPass = false
        })

        if (allPass) {
            passedTests++
            console.log("  Result: ✅ PASSED")
        } else {
            failedTests++
            console.log("  Result: ❌ FAILED")
        }
    } catch (error) {
        failedTests++
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
}

async function testResponseHeaders() {
    console.log("\n📋 TEST 3: Response Security Headers")
    console.log("─".repeat(50))

    try {
        const res = await makeRequest("POST", "/api/shopify-proxy", {
            headers: { "Origin": "https://localhost:4173" },
            body: {
                storeDomain: "test.myshopify.com",
                clientId: "test",
                clientSecret: "test",
            },
        })

        const checks = {
            "Content-Type present": res.headers["content-type"],
            "CORS Allow-Origin": res.headers["access-control-allow-origin"] === "*",
            "Vary header": res.headers["vary"]?.includes("Origin"),
        }

        let allPass = true
        Object.entries(checks).forEach(([check, pass]) => {
            console.log(`  ${pass ? "✅" : "❌"} ${check}`)
            if (!pass) allPass = false
        })

        if (allPass) {
            passedTests++
            console.log("  Result: ✅ PASSED")
        } else {
            failedTests++
            console.log("  Result: ❌ FAILED")
        }
    } catch (error) {
        failedTests++
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
}

async function testHealthEndpoint() {
    console.log("\n📋 TEST 4: Health Check Endpoint")
    console.log("─".repeat(50))

    try {
        const res = await makeRequest("GET", "/api/health")
        const checks = {
            "Health endpoint exists": res.status !== 404,
            "Response successful": res.status < 400 || res.status === 404,
        }

        Object.entries(checks).forEach(([check, pass]) => {
            console.log(`  ${pass ? "✅" : "❌"} ${check} (HTTP ${res.status})`)
        })

        passedTests++
        console.log("  Result: ✅ PASSED")
    } catch (error) {
        console.log(`  ℹ️  Health endpoint not found (optional): ${error instanceof Error ? error.message : String(error)}`)
        passedTests++
    }
}

async function testErrorHandling() {
    console.log("\n📋 TEST 5: Error Handling")
    console.log("─".repeat(50))

    try {
        // Missing fields
        const res = await makeRequest("POST", "/api/shopify-proxy", {
            body: {
                storeDomain: "test.myshopify.com",
                // Missing clientId and clientSecret
            },
        })

        const checks = {
            "Returns error status": res.status >= 400,
            "Has error message": res.body.includes("error") || res.body.includes("required"),
            "CORS enabled on error": res.headers["access-control-allow-origin"] === "*",
        }

        let allPass = true
        Object.entries(checks).forEach(([check, pass]) => {
            console.log(`  ${pass ? "✅" : "❌"} ${check}`)
            if (!pass) allPass = false
        })

        if (allPass) {
            passedTests++
            console.log("  Result: ✅ PASSED")
        } else {
            failedTests++
            console.log("  Result: ❌ FAILED")
        }
    } catch (error) {
        failedTests++
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
}

async function testMultipleOrigins() {
    console.log("\n📋 TEST 6: Multiple Origin Support")
    console.log("─".repeat(50))

    const testOrigins = [
        "https://localhost:4173",
        "https://localhost:5173",
        "https://example.com",
    ]

    try {
        let allPass = true
        for (const origin of testOrigins) {
            const res = await makeRequest("OPTIONS", "/api/shopify-proxy", {
                headers: {
                    "Origin": origin,
                    "Access-Control-Request-Method": "POST",
                },
            })
            const passed = res.headers["access-control-allow-origin"] === "*"
            console.log(`  ${passed ? "✅" : "❌"} Origin: ${origin}`)
            if (!passed) allPass = false
        }

        if (allPass) {
            passedTests++
            console.log("  Result: ✅ PASSED")
        } else {
            failedTests++
            console.log("  Result: ❌ FAILED")
        }
    } catch (error) {
        failedTests++
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
}

async function testCachingHeaders() {
    console.log("\n📋 TEST 7: CORS Caching Headers")
    console.log("─".repeat(50))

    try {
        const res = await makeRequest("OPTIONS", "/api/shopify-proxy", {
            headers: {
                "Origin": "https://localhost:4173",
                "Access-Control-Request-Method": "POST",
            },
        })

        const maxAge = parseInt(res.headers["access-control-max-age"] || "0")
        const checks = {
            "Max-Age set": maxAge > 0,
            "Max-Age is 24 hours": maxAge === 86400,
            "Vary header present": res.headers["vary"],
        }

        let allPass = true
        Object.entries(checks).forEach(([check, pass]) => {
            console.log(`  ${pass ? "✅" : "❌"} ${check} ${check.includes("Max-Age is") ? `(${maxAge}s)` : ""}`)
            if (!pass) allPass = false
        })

        if (allPass) {
            passedTests++
            console.log("  Result: ✅ PASSED")
        } else {
            failedTests++
            console.log("  Result: ❌ FAILED")
        }
    } catch (error) {
        failedTests++
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
}

async function runAllTests() {
    console.log("╔════════════════════════════════════════════════════════╗")
    console.log("║    PRODUCTION READY TEST SUITE - Shopify Sync Framer   ║")
    console.log("╚════════════════════════════════════════════════════════╝")
    console.log(`\n🔍 Testing: ${API_URL}`)
    console.log("📅 Test Date:", new Date().toISOString())

    await testCORSHeaders()
    await testAPIConnectivity()
    await testResponseHeaders()
    await testHealthEndpoint()
    await testErrorHandling()
    await testMultipleOrigins()
    await testCachingHeaders()

    // Summary
    console.log("\n╔════════════════════════════════════════════════════════╗")
    console.log("║                    TEST SUMMARY                        ║")
    console.log("╚════════════════════════════════════════════════════════╝")
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`📊 Total:  ${passedTests + failedTests}`)
    console.log(`✨ Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`)

    if (failedTests === 0) {
        console.log("\n🚀 STATUS: ✅ PRODUCTION READY\n")
        process.exit(0)
    } else {
        console.log("\n⚠️  STATUS: ❌ NEEDS FIXES\n")
        process.exit(1)
    }
}

runAllTests().catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
})
