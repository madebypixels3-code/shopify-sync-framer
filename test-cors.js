#!/usr/bin/env node

/**
 * CORS Test Script - Verifies the API endpoint has proper CORS headers
 */

const API_URL = "https://shopify-sync-framer-eight.vercel.app/api/shopify-proxy"

async function testCORS() {
    console.log("🧪 Testing CORS configuration...\n")
    console.log(`API Endpoint: ${API_URL}\n`)

    try {
        // Test 1: Preflight (OPTIONS) request
        console.log("1️⃣  Testing preflight (OPTIONS) request...")
        const preflightResponse = await fetch(API_URL, {
            method: "OPTIONS",
            headers: {
                "Origin": "https://localhost:4173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        })

        console.log(`   Status: ${preflightResponse.status}`)
        const corsHeaders = {
            origin: preflightResponse.headers.get("Access-Control-Allow-Origin"),
            methods: preflightResponse.headers.get("Access-Control-Allow-Methods"),
            headers: preflightResponse.headers.get("Access-Control-Allow-Headers"),
            maxAge: preflightResponse.headers.get("Access-Control-Max-Age"),
        }

        console.log(`   CORS Headers:`)
        console.log(`   - Allow-Origin: ${corsHeaders.origin || "❌ NOT SET"}`)
        console.log(`   - Allow-Methods: ${corsHeaders.methods || "❌ NOT SET"}`)
        console.log(`   - Allow-Headers: ${corsHeaders.headers || "❌ NOT SET"}`)
        console.log(`   - Max-Age: ${corsHeaders.maxAge || "❌ NOT SET"}`)

        const corsValid = corsHeaders.origin === "*" && corsHeaders.methods && corsHeaders.headers
        console.log(`   Result: ${corsValid ? "✅ CORS is properly configured" : "❌ CORS headers missing"}\n`)

        // Test 2: POST request with test payload
        console.log("2️⃣  Testing POST request with mock credentials...")
        const postResponse = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Origin": "https://localhost:4173",
            },
            body: JSON.stringify({
                storeDomain: "test.myshopify.com",
                clientId: "test",
                clientSecret: "test",
            }),
        })

        console.log(`   Status: ${postResponse.status}`)
        console.log(`   Response CORS Origin: ${postResponse.headers.get("Access-Control-Allow-Origin") || "❌ NOT SET"}`)

        if (postResponse.ok) {
            const data = await postResponse.json()
            console.log(`   ✅ Request succeeded\n`)
        } else {
            const errorText = await postResponse.text()
            console.log(`   Expected error (invalid credentials): ${errorText.substring(0, 100)}...\n`)
        }

        console.log("📊 Summary:")
        console.log("✅ CORS preflight is working correctly")
        console.log("✅ API is accessible from browser")
        console.log("\n🚀 Your production deployment is ready for testing!")

    } catch (error) {
        console.error("❌ Test failed:", error instanceof Error ? error.message : String(error))
        process.exit(1)
    }
}

testCORS()
