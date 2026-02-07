# Quick Start: Client Credentials Authentication

## For New Users: Recommended Setup

### Step 1: Create a Shopify Dev Dashboard App

1. Visit https://shopify.dev/apps/build/dev-dashboard
2. Sign in with your Shopify partner account
3. Click **"Create an app"**
4. Choose **"Create a new app"** → **"API-only app"**
5. Enter app name: "Shopify Sync for Framer"
6. Select your development store
7. Complete the onboarding

### Step 2: Get Your Credentials

1. In your app's dashboard, go to **Configuration**
2. Scroll to **Admin API access scopes** and select:
   - ✅ `read_products`
   - ✅ `read_collections`
3. Save changes
4. Your **Client ID** and **Client Secret** are now visible
5. Copy both values

### Step 3: Configure the Plugin

1. Open the Shopify Sync plugin in Framer
2. Select **"Client Credentials (Recommended)"** from dropdown
3. Enter your Store Domain: `your-store.myshopify.com`
4. Paste your **Client ID**
5. Paste your **Client Secret**
6. Click **"Test Connection"** ✓

### Step 4: Sync Your Data

1. Check ✅ **Products** and/or **Collections**
2. Click **"Sync Now"**
3. Watch the logs as your data syncs to Framer CMS

Done! Your products are now in Framer.

---

## For Existing Users: Legacy Token Migration

### Option A: Keep Using Legacy Token (Until Jan 1, 2026)

If your `shpat_` token still works:

1. Select **"Legacy Token"** from dropdown
2. Keep entering your existing store URL + token
3. Everything works as before ✓
4. **After Jan 1, 2026**: Must migrate to Client Credentials

### Option B: Migrate Now (Recommended)

Same as "For New Users" above. You can keep both methods for different stores.

---

## Troubleshooting

### "Connection failed" with Client Credentials

❌ **Problem**: Invalid Client ID or Secret
- ✅ **Solution**: Copy them again from Dev Dashboard Configuration tab

❌ **Problem**: Wrong store domain
- ✅ **Solution**: Use format `store-name.myshopify.com` (not custom domain)

❌ **Problem**: Missing API scopes
- ✅ **Solution**: In Dev Dashboard → Configuration → add `read_products` scope

### Proxy Server Not Running

❌ **Problem**: "Failed to fetch from proxy"
- ✅ **Solution**: If developing locally, run `npm run server` in project root

### Token Keeps Expiring

✅ **This is normal** - Client Credentials tokens valid 24 hours.
✅ **Automatic** - Plugin handles refresh automatically behind the scenes.

---

## API Scopes Required

These scopes must be enabled in your Dev Dashboard app:

```
read_products       # Required to fetch products
read_collections    # Required to fetch collections
```

Optional scopes for future features:
```
write_products      # For product updates/sync
write_collections   # For collection updates/sync
```

---

## Security Best Practices

### ✅ DO:
- Store Client Secret in environment variables in production
- Rotate credentials periodically
- Use separate Dev/Production apps
- Restrict API scopes to minimum needed
- Keep the proxy server on a trusted, secure server

### ❌ DON'T:
- Commit Client Secret to version control
- Share your Client Secret publicly
- Use production app credentials in development
- Use the same app for multiple businesses

---

## Timeline

| Date | Event |
|------|-------|
| **Now** | Client Credentials available (recommended) |
| **Now** | Legacy tokens still work |
| **Jan 1, 2026** | Legacy tokens stop working |
| **After Jan 1, 2026** | Only Client Credentials supported |

---

## Need Help?

- **Shopify Dev Dashboard**: https://shopify.dev/
- **Client Credentials Docs**: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant
- **Plugin Support**: See [AUTH_UPDATE.md](AUTH_UPDATE.md) for technical details
