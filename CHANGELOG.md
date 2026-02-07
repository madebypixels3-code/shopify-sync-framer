# Changelog

## [2.0.0] - 2024-12-19

### 🚀 Major Changes: Authentication Modernization

#### Added
- **Client Credentials OAuth 2.0 Support** - Shopify's recommended authentication method
  - `client_credentials` grant type per RFC 6749 section 4.4
  - Client ID + Client Secret authentication
  - 24-hour token lifetime with automatic refresh
  - Token caching in proxy server to minimize API calls
  
- **Dual Authentication Support** - Seamless backward compatibility
  - Legacy: `shpat_*` tokens from custom apps (continues to work until Jan 1, 2026)
  - Modern: Client Credentials from Dev Dashboard (recommended)
  - UI selector for users to choose authentication method
  
- **Updated UI Components**
  - Auth method dropdown selector
  - Dynamic form fields (show relevant fields based on auth method)
  - Info banner for Client Credentials: "Get from Shopify Dev Dashboard"
  - Warning banner for Legacy: "Will stop working January 1, 2026"
  - Conditional field validation

- **Backend Proxy Enhancements**
  - OAuth token acquisition endpoint
  - Token exchange via `POST /admin/oauth/access_token`
  - In-memory token caching with TTL
  - 5-minute refresh buffer before token expiry
  - Automatic token re-acquisition on expiry

- **Documentation**
  - [AUTH_UPDATE.md](AUTH_UPDATE.md) - Complete technical migration guide
  - [QUICKSTART.md](QUICKSTART.md) - User-friendly setup instructions
  - Security best practices section
  - Timeline for legacy token deprecation

#### Changed
- **types.ts**: `ShopifyCredentials` is now a discriminated union type
  ```typescript
  type ShopifyCredentials = 
    | { type: "legacy"; storeDomain: string; accessToken: string }
    | { type: "client_credentials"; storeDomain: string; clientId: string; clientSecret: string }
  ```

- **services/shopify.ts**: Updated function signatures
  - `makeProxiedRequest()` now accepts flexible auth object
  - `ShopifyClient` constructor handles both credential types
  - Transparent credential type detection

- **server.js**: Enhanced proxy server
  - `getAccessToken()` function for OAuth token acquisition
  - Token cache with automatic expiry handling
  - Support for both auth methods at proxy level

- **App.tsx**: Comprehensive UI updates
  - Auth method selector (legacy vs client credentials)
  - Conditional form field rendering
  - Dynamic validation based on selected auth method
  - Improved error messaging
  - Settings persistence for both auth types

#### Fixed
- CORS bypass via proxy server (existing functionality maintained)
- Rate limiting and throttle handling (existing functionality maintained)
- Credential persistence to Framer collection (extended to support both types)

#### Security
- Client Secret never exposed in browser (handled server-side)
- OAuth token acquisition secured via server-to-server communication
- Credentials can be stored in environment variables (recommended for production)

#### Deprecated
- Legacy `shpat_*` token authentication (still works until January 1, 2026)

### 📊 Compatibility

- ✅ **Backward Compatible**: Existing apps using legacy tokens continue to work
- ✅ **Forward Compatible**: Ready for Shopify's 2026 transition
- ✅ **No Breaking Changes**: All existing features work as before
- ✅ **Both Methods Supported**: Legacy and modern can be used on different stores

### 🔄 Migration Path

Users can migrate from legacy to client credentials:
1. Create app in Shopify Dev Dashboard
2. Select "Client Credentials (Recommended)" in plugin UI
3. Enter Client ID + Secret
4. Test connection
5. Settings auto-save

### 📚 Updated Files

Core Services:
- `src/types.ts` - Type definitions
- `src/services/shopify.ts` - Shopify API client
- `src/App.tsx` - React component

Backend:
- `server.js` - Express proxy server with OAuth support

Documentation:
- `AUTH_UPDATE.md` - Technical deep-dive
- `QUICKSTART.md` - User setup guide
- `CHANGELOG.md` - This file

### 🧪 Testing

All features tested and verified:
- ✅ Build passes without errors (TypeScript)
- ✅ Proxy server validates without errors
- ✅ Form fields render correctly
- ✅ Auth method switching works
- ✅ Conditional validation working
- ✅ Settings persist to Framer collection
- ✅ Both auth methods can be used

### 📅 Timeline

- **Now**: Client Credentials available and recommended
- **Now**: Legacy tokens still fully functional
- **Jan 1, 2026**: Legacy token creation disabled, existing tokens continue
- **After Jan 1, 2026**: Only Client Credentials method available

### 🔗 References

- Shopify Dev Dashboard: https://shopify.dev/apps/build/dev-dashboard
- Client Credentials Docs: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant
- OAuth 2.0 RFC: https://tools.ietf.org/html/rfc6749#section-4.4

---

## Previous Versions

### [1.3.0] - CORS Proxy & Polaris UI
- Added Express.js backend proxy for CORS bypass
- Implemented Shopify Polaris UI kit
- Responsive design

### [1.2.0] - Framer CMS Managed Collections
- Switched from HTTP API to managed collection API
- Added field setup and upsert logic

### [1.1.0] - Initial Plugin Release
- Shopify Admin API client
- Product and collection syncing
- Rate limiting and pagination
