# Shopify Sync Framer Plugin - Setup Guide

## Architecture

The app uses a **minimal backend endpoint** for secure token exchange only:

```
Frontend (Framer Plugin)
    ↓
    POST to /api/shopify-proxy (Backend)
    ↓
    Backend exchanges credentials for access token
    ↓
    Returns access_token to Frontend
    ↓
Frontend makes direct API calls to Shopify Admin API
```

**Why this architecture?**
- CORS prevents direct browser→Shopify OAuth calls
- Client Secret cannot be stored in browser code (security)
- Backend only handles token exchange (minimal, secure)
- All product data fetches are direct browser→Shopify

## Development Setup

### 1. Start Backend Server (Port 3001)

```bash
cd "/Users/gurjotsingh/Documents/Shopify Sync Framer Plugin"
node server.js
```

Output should show:
```
╔════════════════════════════════════════════════════════════╗
║  Shopify Sync - Backend Server                             ║
║  Listening on http://localhost:3001                             ║
║  CORS: Enabled for all origins                            ║
╚════════════════════════════════════════════════════════════╝

Endpoints:
  POST http://localhost:3001/api/shopify-proxy - Token exchange
  GET  http://localhost:3001/health           - Health check
```

### 2. Start Frontend Dev Server (Port 5173)

```bash
cd "/Users/gurjotsingh/Documents/Shopify Sync Framer Plugin/shopify-sync-cms"
npm run dev
```

**Note:** Vite automatically proxies `/api/*` calls to `http://localhost:3001` (configured in vite.config.ts)

### 3. Get Your Shopify Credentials

1. Go to **Shopify Partners** dashboard
2. Select your app → **Client credentials**
3. Copy **Client ID** and **Client Secret**
4. Get your store URL: `yourstore.myshopify.com`

### 4. Connect in the Plugin

1. Open the plugin in Framer
2. Enter:
   - **Store URL**: `yourstore.myshopify.com`
   - **Client ID**: Your app's Client ID
   - **Client Secret**: Your app's Client Secret
3. Click "Test Connection"
4. Click "Sync Products"

## Environment Configuration

### Development (.env.local)
```
VITE_BACKEND_URL=http://localhost:3001
```
- Used for local development
- Backend runs on your machine

### Production (.env.production)
```
VITE_BACKEND_URL=https://your-deployment.vercel.app
```
- Used for production builds
- Replace with your actual Vercel deployment URL

## Files Modified

- **server.js**: Backend token exchange endpoint
- **api/shopify-proxy.js**: Vercel serverless function for token exchange
- **shopify-sync-cms/src/services/shopify.ts**: Calls backend for token exchange
- **shopify-sync-cms/src/App.tsx**: Form fields for Client ID/Secret
- **shopify-sync-cms/.env.local**: Dev environment config

## Production Deployment

### Deploy to Vercel

```bash
cd "/Users/gurjotsingh/Documents/Shopify Sync Framer Plugin"
vercel --prod
```

**Before deploying:**
1. Update `.env.production` with your Vercel deployment URL
2. Ensure Vercel Authentication is DISABLED (see .env.production comments)

### API Endpoint on Vercel

The `/api/shopify-proxy` endpoint will be available at:
```
https://your-deployment.vercel.app/api/shopify-proxy
```

The frontend will automatically use this URL for production builds.

## Troubleshooting

### "400 Bad Request" on Token Exchange
- Verify Client ID and Client Secret are correct
- Check the store domain format (should be `yourstore.myshopify.com`)
- Ensure app is installed on the store

### CORS Errors
- Backend server must be running (port 3001)
- Dev server proxies `/api/*` to backend automatically
- Production: Vercel handles CORS with Access-Control headers

### Token Expired
- Tokens auto-refresh every 24 hours
- Token cache is cleared on error and automatically retried

## Security Notes

✅ **Secure:**
- Client Secret only handled on backend
- Token exchange secured by Shopify OAuth
- CORS prevents unauthorized requests
- Tokens cached in memory (browser session only)

⚠️ **Important:**
- Never commit `.env.local` or `.env.production`
- Only deploy the `/api/shopify-proxy.js` function to Vercel
- Keep Client Secret confidential
