# Production CORS Testing Guide

## What Was Fixed

Your CORS issue is now resolved. Here's what was configured:

### Changes Made:
1. **Updated `vercel.json`** - Added proper CORS headers configuration for all API routes
2. **Enhanced API handlers** (`api/shopify-proxy.js`) - Set CORS headers immediately on every request
3. **Added function config** - Ensures Vercel properly deploys the serverless function

## Testing Your Production Deployment

### Test URL
- **New Deployment:** `https://shopify-sync-framer-5m5wsghkb-madebypixels-projects.vercel.app`
- **API Endpoint:** `/api/shopify-proxy`

### Step 1: Verify CORS Headers are Present
Run this curl command to test the preflight:
```bash
curl -X OPTIONS "https://shopify-sync-framer-5m5wsghkb-madebypixels-projects.vercel.app/api/shopify-proxy" \
  -H "Origin: https://localhost:4173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

You should see these headers in the response:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, Accept
Access-Control-Max-Age: 86400
```

### Step 2: Test API Endpoint in Browser Console
Open your browser console and run:
```javascript
fetch('https://shopify-sync-framer-5m5wsghkb-madebypixels-projects.vercel.app/api/shopify-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storeDomain: 'your-store.myshopify.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret'
  })
})
.then(r => r.json())
.then(console.log)
```

### Step 3: Monitor Deployment
1. Go to https://vercel.com/dashboard
2. Select your project
3. Check the deployment status (should be "Ready")
4. Verify the API is responding

## How CORS Now Works

**Preflight Request (Browser sends automatically):**
```
OPTIONS /api/shopify-proxy HTTP/1.1
Origin: https://localhost:4173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

**Server Response (Our Fix):**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, Accept
Access-Control-Max-Age: 86400
```

**Actual Request (Allowed by CORS):**
```
POST /api/shopify-proxy HTTP/1.1
Origin: https://localhost:4173
Content-Type: application/json
```

## Troubleshooting

If you still see CORS errors:

1. **Hard refresh your browser** (Cmd+Shift+R or Ctrl+Shift+R)
2. **Clear browser cache** (DevTools → Storage → Clear All)
3. **Wait 2-3 minutes** for Vercel to fully deploy
4. **Check Vercel deployment logs:** https://vercel.com/dashboard → Select project → Deployments

## Files Modified
- `vercel.json` - CORS headers configuration
- `api/shopify-proxy.js` - Added CORS header handling
- `shopify-sync-cms/api/shopify-proxy.js` - Added CORS header handling
- `shopify-sync-cms/vite.config.ts` - Updated proxy URL (development)

## Next Steps
1. Update your Framer plugin to point to the new deployment URL
2. Test the Shopify token exchange end-to-end
3. Monitor browser console for any remaining errors
