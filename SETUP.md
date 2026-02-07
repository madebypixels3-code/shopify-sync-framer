# Shopify Sync → Framer CMS Plugin Setup

## Overview

This plugin connects a Shopify store to Framer CMS and syncs products and collections into a managed collection.

## Architecture

- **Frontend Plugin**: React/Polaris UI running in Framer (`shopify-sync-cms/`)
- **Backend Proxy**: Express.js server that proxies requests to Shopify API (avoids CORS issues)

## Installation & Setup

### 1. Install Dependencies

```bash
# Install root dependencies (for backend proxy)
npm install

# Install plugin dependencies (if not already done)
cd shopify-sync-cms
npm install
```

### 2. Start the Backend Proxy Server

In a terminal:

```bash
npm run server
```

This starts the Express.js proxy on `http://localhost:3001`. The proxy handles all Shopify API requests from the browser, avoiding CORS restrictions.

### 3. Develop the Plugin

In another terminal:

```bash
cd shopify-sync-cms
npm run dev
```

This launches the Framer plugin on `https://localhost:5173`.

**Or run both simultaneously:**

```bash
npm run dev
```

This will start both the proxy server and the plugin dev server.

## Building for Production

```bash
npm run build
```

Output: `shopify-sync-cms/dist/`

For production deployment:

1. Deploy the backend proxy server (e.g., to Vercel, Heroku, AWS Lambda)
2. Set the `VITE_PROXY_URL` environment variable to your production proxy URL
3. Pack and publish the Framer plugin

### Environment Variables

#### Development
- `VITE_PROXY_URL` (optional) - Defaults to `http://localhost:3001`

#### Production
- Set `VITE_PROXY_URL` to your deployed backend proxy URL
- Example: `VITE_PROXY_URL=https://shopify-sync-proxy.vercel.app`

## How It Works

### CORS Solution

Direct browser requests to Shopify API are blocked by CORS policy. This plugin uses a backend proxy:

1. Plugin → calls proxy server (localhost/production)
2. Proxy server → calls Shopify Admin API (no CORS restrictions)
3. Proxy → returns response to plugin

### Plugin Workflow

1. **Configure**: Enter Shopify store URL and Admin API token
2. **Test Connection**: Validates credentials via proxy
3. **Save Settings**: Stored in the Framer managed collection
4. **Sync**: Fetches products/collections from Shopify, upserts into CMS collection

## Shopify API Requirements

- **Scope**: `admin` (read-only access to products and collections)
- **API Version**: 2023-10
- **Rate Limiting**: Plugin respects Shopify's 2 requests/second with automatic backoff

## Framer CMS Integration

- **Collection Types**: Managed collections only
- **Modes**: `configureManagedCollection`, `syncManagedCollection`
- **Fields**: Auto-created for products and collections
- **Updates**: Non-destructive (uses Shopify ID as unique key)

## Deployment Guide

### Backend Proxy (Vercel)

1. Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Deploy to Vercel:

```bash
npx vercel
```

3. Set plugin's `VITE_PROXY_URL` to the Vercel URL

### Frontend Plugin (Framer)

1. Build: `npm run build`
2. Pack: `npm --prefix shopify-sync-cms run pack`
3. Publish to Framer marketplace

## Troubleshooting

### CORS Error
- Ensure backend proxy is running at the URL specified in `VITE_PROXY_URL`
- Check proxy server logs for errors

### Invalid Credentials
- Verify store domain format: `example.myshopify.com`
- Verify Admin API token is valid and has correct scopes

### Rate Limiting
- Plugin includes automatic backoff; check status logs
- Shopify allows ~2 requests/second for Admin API

## Development Notes

- Proxy is stateless and can be scaled horizontally
- All credentials are stored in the Framer managed collection (not in proxy)
- Logs stream to browser console in real-time during sync

## License

MIT
