# Production Deployment Guide

## Overview
This guide walks you through deploying the **Shopify Sync Framer Plugin** to production. The project consists of:
- **Backend**: Node.js/Express server (`server.js`)
- **Frontend**: React + Vite (Framer Plugin)

---

## Step 1: Pre-Deployment Checklist

### Environment Setup
- [ ] Verify all environment variables are configured
- [ ] Test locally with `npm run dev`
- [ ] Run build without errors: `npm run build:prod`
- [ ] Verify backend server starts: `npm run server`

### Code Quality
- [ ] Lint code: `npm --prefix shopify-sync-cms run lint`
- [ ] Test all features locally
- [ ] Check for console errors in browser
- [ ] Verify Shopify API credentials work

---

## Step 2: Build the Project

### Local Build Test
```bash
# Navigate to project root
cd /Users/gurjotsingh/Documents/Shopify\ Sync\ Framer\ Plugin

# Install dependencies
npm install

# Build frontend for production
npm run build:prod

# Verify build output
ls -la shopify-sync-cms/dist/
```

---

## Step 3: Environment Variables

### Backend Server (.env or server.js)
```bash
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Frontend Environment (.env.production)
Create `shopify-sync-cms/.env.production`:
```bash
VITE_API_URL=https://your-backend-domain.com
VITE_SHOPIFY_CLIENT_ID=your_shopify_client_id
```

---

## Step 4: Deployment Options

### Option A: Vercel (Recommended)
Vercel is configured in `vercel.json` and supports Node.js backends.

#### Steps:
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Production**
   ```bash
   npm run deploy
   ```

4. **Deploy Preview (optional)**
   ```bash
   npm run deploy:preview
   ```

5. **Configure Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add all required env vars
   - Redeploy after adding variables

#### Verify Deployment
- Backend API: `https://your-vercel-domain.com/api/shopify-proxy`
- Frontend: `https://your-vercel-domain.com`
- Health Check: `https://your-vercel-domain.com/api/health`

---

### Option B: Docker + Cloud (AWS, GCP, Azure)

#### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build frontend
COPY shopify-sync-cms ./shopify-sync-cms
WORKDIR /app/shopify-sync-cms
RUN npm install && npm run build:prod

# Copy API files
WORKDIR /app
COPY server.js ./
COPY api/ ./api/

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server.js"]
```

#### Build and Push
```bash
docker build -t shopify-sync:latest .
docker tag shopify-sync:latest your-registry/shopify-sync:latest
docker push your-registry/shopify-sync:latest
```

---

### Option C: Traditional Hosting (Heroku, Render, Railway)

#### For Heroku:
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set PORT=3001
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

---

## Step 5: Configure Shopify Admin API

### Update Credentials in Production
1. Go to Shopify Admin → Apps and Integrations → App settings
2. Update API credentials if needed
3. Update CORS allowed origins to include your production domain

### Required Scopes (Admin API)
- `write_products`
- `read_products`
- `write_orders`
- `read_orders`
- `write_inventory`
- `read_inventory`

---

## Step 6: SSL/TLS Certificate

### For Vercel
- Automatically managed by Vercel ✓

### For Other Hosts
- Use Let's Encrypt (free)
- Configure in your hosting provider
- Ensure HTTPS is enforced

---

## Step 7: Testing Production

### Health Check
```bash
curl https://your-domain.com/api/health
```

### API Endpoint Test
```bash
curl -X POST https://your-domain.com/api/shopify-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "storeDomain": "your-store.myshopify.com",
    "clientId": "your_client_id",
    "clientSecret": "your_client_secret"
  }'
```

### Frontend Access
Visit `https://your-domain.com` in browser and verify:
- [ ] Page loads without errors
- [ ] API calls work
- [ ] Shopify sync functions correctly

---

## Step 8: Monitoring & Logs

### View Logs
- **Vercel**: Dashboard → Deployments → Logs
- **Docker/AWS**: CloudWatch or container logs
- **Heroku**: `heroku logs --tail`

### Monitor Performance
- Check response times
- Monitor error rates
- Track API quota usage

---

## Step 9: Security Hardening

### Before Going Live
- [ ] Remove debug console logs
- [ ] Enable CORS restrictions to specific domains
- [ ] Set secure headers (HSTS, CSP)
- [ ] Rotate API credentials regularly
- [ ] Use environment variables for secrets (NEVER commit credentials)
- [ ] Enable rate limiting on API endpoints
- [ ] Set up error tracking (Sentry, etc.)

### Add Security Headers
In `server.js`, add:
```javascript
import helmet from 'helmet'

app.use(helmet())
```

---

## Step 10: Post-Deployment

### Update Documentation
- [ ] Update README with production URLs
- [ ] Document any configuration changes
- [ ] Create runbook for troubleshooting

### Set Up Monitoring
- [ ] Configure error alerts
- [ ] Set up uptime monitoring
- [ ] Create status page

### Backup & Recovery
- [ ] Document backup procedures
- [ ] Create recovery runbook
- [ ] Test disaster recovery plan

---

## Rollback Procedure

### If Issues Occur
```bash
# Vercel
vercel rollback

# Heroku
heroku releases
heroku rollback v123

# Docker/AWS
docker pull your-registry/shopify-sync:previous-tag
# Redeploy previous version
```

---

## Performance Optimization

### Frontend
```bash
# Build with optimizations
npm run build:prod

# Check bundle size
npm --prefix shopify-sync-cms run build:prod
```

### Backend
- Use gzip compression
- Implement caching headers
- Use CDN for static assets

---

## Troubleshooting

### Common Issues

**Issue: CORS errors in production**
- Solution: Update `CORS_ORIGIN` env variable to your production domain

**Issue: API calls returning 403**
- Solution: Verify Shopify credentials and scopes in production config

**Issue: Frontend not loading assets**
- Solution: Check `vite.config.ts` base URL configuration

**Issue: Port conflicts**
- Solution: Change PORT environment variable

---

## Support & Next Steps

1. **Framer Plugin Packaging** (if publishing to Framer):
   ```bash
   npm run pack
   ```

2. **Monitor Performance**: Set up alerts for errors and downtime

3. **Iterate**: Gather feedback and deploy updates using the same process

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run locally (both frontend & backend) |
| `npm run build:prod` | Build for production |
| `npm run deploy` | Deploy to Vercel production |
| `npm run deploy:preview` | Deploy preview to Vercel |
| `npm run server` | Run backend only |
| `npm run pack` | Pack Framer plugin |

