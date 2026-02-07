# Authentication Modernization Update

## Summary

The plugin now supports **both** legacy and modern Shopify authentication methods, with full support for the **Client Credentials OAuth 2.0 Grant**, which is Shopify's recommended approach as of 2024.

## What Changed

### 1. **Authentication Methods Supported**

#### Legacy Token (Deprecated Jan 1, 2026)
- Format: `shpat_*` tokens from Shopify Admin custom apps
- **Status**: Still works but being phased out
- **Sunset**: January 1, 2026

#### Client Credentials (Recommended)
- **Type**: OAuth 2.0 Grant (RFC 6749 section 4.4)
- **Source**: Shopify Dev Dashboard app configuration
- **Token Lifetime**: 24 hours
- **Status**: New standard, recommended for all new apps
- **Details**: Client ID + Client Secret from Dev Dashboard

### 2. **Code Updates**

#### [types.ts](src/types.ts)
```typescript
export type ShopifyCredentials = 
    | { type: "legacy"; storeDomain: string; accessToken: string }
    | { type: "client_credentials"; storeDomain: string; clientId: string; clientSecret: string }
```
- Updated `ShopifyCredentials` type to be a union supporting both auth methods
- Type-safe credential handling throughout the app

#### [services/shopify.ts](src/services/shopify.ts)
- `makeProxiedRequest()` now accepts flexible auth object:
  ```typescript
  auth: { accessToken: string } | { clientId: string; clientSecret: string }
  ```
- `ShopifyClient` constructor detects credential type and stores appropriate auth variant
- Supports both token types transparently

#### [server.js](server.js)
- **New**: OAuth token acquisition handler
- When `auth.clientId` is provided:
  - POST to `https://{storeDomain}/admin/oauth/access_token`
  - Sends `grant_type=client_credentials`, `client_id`, `client_secret`
  - Receives `access_token` (24-hour lifetime)
- **Token Caching**: Prevents redundant token requests
  - Caches tokens with 5-minute refresh buffer
  - Auto-refreshes before expiry
- Backward compatible with legacy `accessToken` method

#### [App.tsx](src/App.tsx)
- **New UI**: Auth method selector dropdown
  - "Legacy Token (Deprecated after Jan 1, 2026)"
  - "Client Credentials (Recommended)"
- **Dynamic Form Fields**:
  - Shows `Admin API Access Token` for legacy method
  - Shows `Client ID` + `Client Secret` for client credentials method
- **User Guidance**: 
  - Info banner for Client Credentials: "Get from Shopify Dev Dashboard"
  - Warning banner for Legacy: "Will stop working Jan 1, 2026"

### 3. **How It Works**

#### Legacy Token Flow (Unchanged)
1. User enters Store Domain + Admin API Token
2. Plugin sends token directly to Shopify Admin API
3. API authenticates with token
4. Works as before

#### Client Credentials Flow (New)
1. User enters Store Domain + Client ID + Client Secret
2. Plugin sends Client Credentials to proxy server
3. Server exchanges credentials for access token via OAuth endpoint
4. Token is cached (with 5-minute refresh buffer)
5. Subsequent API calls use cached token
6. On expiry, automatically re-acquires token
7. All transparent to user

### 4. **Settings Persistence**

Both authentication methods are saved to Framer collection plugin data:
```typescript
{
    authMethod: "legacy" | "client_credentials",
    storeDomain: string,
    accessToken?: string,        // For legacy
    clientId?: string,           // For client credentials
    clientSecret?: string,       // For client credentials
    includeProducts: boolean,
    includeCollections: boolean,
    autoSync: boolean
}
```

## Migration Path

### From Legacy to Client Credentials

1. **Create Dev Dashboard App**:
   - Go to https://shopify.dev/
   - Create new app via Dev Dashboard
   - Complete Step 4: Authentication Setup
   - Get Client ID and Client Secret

2. **Update Plugin**:
   - Select "Client Credentials" from dropdown
   - Enter Store Domain
   - Enter Client ID and Client Secret from Dev Dashboard
   - Click "Test Connection"
   - Settings auto-save

3. **Timeline**:
   - ✅ Now: Can use either method simultaneously
   - ✅ Jan 1, 2026: Legacy tokens stop working (system will fall back to Client Credentials)
   - After Jan 1, 2026: Only Client Credentials method will work

## Technical Details

### Client Credentials Token Acquisition

**Endpoint**: `POST https://{storeDomain}/admin/oauth/access_token`

**Request**:
```
grant_type=client_credentials
client_id={clientId}
client_secret={clientSecret}
```

**Response**:
```json
{
    "access_token": "...",
    "scope": "write_products,read_products,...",
    "expires_in": 86399
}
```

### Token Caching Strategy

The proxy server caches tokens in memory with:
- **Key**: `{storeDomain}:{clientId}`
- **TTL**: `expires_in` (86399 seconds = 24 hours)
- **Refresh Buffer**: 5 minutes before expiry
- **Behavior**: Automatic refresh on next request if expired

## Backward Compatibility

✅ **Fully compatible**:
- Existing apps using legacy tokens continue to work
- No breaking changes to existing plugin functionality
- Both methods can be used on different Shopify stores
- Settings seamlessly load whichever method was previously saved

## Testing the Update

### Test Legacy Token (existing flow)
1. Select "Legacy Token" from dropdown
2. Enter existing Store URL + Admin API Token
3. Click "Test Connection"
4. Should connect successfully (if token still valid)

### Test Client Credentials (new flow)
1. Create Dev Dashboard app at https://shopify.dev/
2. Copy Client ID and Client Secret
3. Select "Client Credentials" from dropdown
4. Enter Store URL + Client ID + Client Secret
5. Click "Test Connection"
6. Should connect successfully

## Documentation

See [SETUP.md](SETUP.md) for:
- Installation instructions
- Dev Dashboard app creation guide
- Running the proxy server
- Production deployment

## Security Notes

⚠️ **Important**:
- Never commit Client Secret to version control
- The proxy server must run on a secure, trusted server
- All credentials are transmitted over HTTPS in production
- Consider using environment variables for Client Secret in production
- Implement rate limiting on the proxy server for production use

## References

- [Shopify Dev Dashboard](https://shopify.dev/apps/build/dev-dashboard)
- [Client Credentials Grant Documentation](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant)
- [OAuth 2.0 RFC 6749 Section 4.4](https://tools.ietf.org/html/rfc6749#section-4.4)
