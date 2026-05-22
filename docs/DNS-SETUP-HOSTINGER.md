# DNS Setup Guide for arbitrades.sbs on Hostinger

This guide walks you through configuring DNS records on Hostinger to point `arbitrades.sbs` to Vercel (frontend) and Railway (API engine).

## Overview

| Subdomain | Service | Purpose |
|-----------|---------|---------|
| `arbitrades.sbs` | Vercel | Web dashboard (root domain) |
| `www.arbitrades.sbs` | Vercel | WWW redirect |
| `api.arbitrades.sbs` | Railway | Rust arbitrage engine API |

## Step 1: Access DNS Zone Editor

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Go to **Domains** → Find `arbitrades.sbs` → Click **Manage**
3. Click **DNS / Nameservers** in the left sidebar
4. Select **DNS Zone Editor** (not Nameservers - keep Hostinger nameservers)

## Step 2: Add Vercel DNS Records (Frontend)

Add these records for the web dashboard:

### For Root Domain (arbitrades.sbs)

| Type | Name | Value | TTL |
|------|------|-------|------|
| `A` | `@` | `76.76.21.21` | 3600 |

> **Note:** `76.76.21.21` is Vercel's default IP for A records. Vercel also provides a CNAME option - check your Vercel project settings for the exact target.

### For WWW Subdomain

| Type | Name | Value | TTL |
|------|------|-------|------|
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |

## Step 3: Add Railway DNS Records (API Engine)

Add this record for the API:

### For API Subdomain

| Type | Name | Value | TTL |
|------|------|-------|------|
| `CNAME` | `api` | `b76wt8si.up.railway.app` | 3600 |

> **Note:** The CNAME target `b76wt8si.up.railway.app` is your Railway app's default domain. You can find this in Railway Dashboard → Your Service → Settings → Networking.

## Step 4: Configure Vercel Custom Domain

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your **techub-arbitrades-app** project
3. Go to **Settings** → **Domains**
4. Click **Add** and enter `arbitrades.sbs`
5. Vercel will verify the DNS records automatically
6. Also add `www.arbitrades.sbs` - Vercel will redirect it to the root domain
7. Wait for SSL certificate provisioning (automatic, usually 1-2 minutes)

### Set Environment Variables on Vercel

1. In your Vercel project → **Settings** → **Environment Variables**
2. Add:
   ```
   NEXT_PUBLIC_API_URL = https://api.arbitrades.sbs
   ```
3. Redeploy the project for the env var to take effect

## Step 5: Configure Railway Custom Domain

1. Go to [Railway Dashboard](https://railway.app)
2. Select your engine service
3. Go to **Settings** → **Networking**
4. Click **Custom Domain**
5. Enter `api.arbitrades.sbs`
6. Railway will provision an SSL certificate automatically
7. The CNAME record you added in Step 3 will be verified

## Step 6: Verify DNS Propagation

DNS changes can take 5 minutes to 48 hours to propagate (usually under 1 hour with Hostinger).

Check propagation using these commands:

```bash
# Check root domain A record
dig arbitrades.sbs A +short

# Check www CNAME
dig www.arbitrades.sbs CNAME +short

# Check API CNAME
dig api.arbitrades.sbs CNAME +short

# Or use an online tool
# https://dnschecker.org/#A/arbitrades.sbs
```

Expected results:
- `arbitrades.sbs` → `76.76.21.21`
- `www.arbitrades.sbs` → `cname.vercel-dns.com`
- `api.arbitrades.sbs` → `b76wt8si.up.railway.app`

## Step 7: Verify HTTPS/SSL

After DNS propagates:

1. Visit `https://arbitrades.sbs` - should show the Vercel-hosted dashboard
2. Visit `https://api.arbitrades.sbs/api/health` - should return "Techub Arbitrades Engine is running"
3. Both should have valid SSL certificates (issued by Let's Encrypt via Vercel/Railway)

## Troubleshooting

### DNS not resolving
- Verify you're using Hostinger nameservers (not external DNS)
- Check that you didn't add trailing dots to CNAME values
- Wait 30-60 minutes and check again

### SSL certificate issues
- Vercel and Railway auto-provision SSL after DNS verification
- If SSL fails, remove and re-add the custom domain in the dashboard
- Ensure there are no conflicting CAA records

### Vercel domain verification fails
- Make sure the A record for `@` points to `76.76.21.21`
- If using CNAME for root domain (not all DNS providers support this), use `cname.vercel-dns.com`

### Railway domain verification fails
- Verify the CNAME target matches your Railway app's domain
- Check that `api` subdomain CNAME points to `b76wt8si.up.railway.app`

### API not accessible from frontend
- Verify `NEXT_PUBLIC_API_URL` is set to `https://api.arbitrades.sbs` in Vercel
- Check CORS settings in the Rust engine (should allow `arbitrades.sbs` origin)
- Ensure Railway service is running (check Railway dashboard)

## Summary of DNS Records

```
Type    Name    Value                           TTL
A       @       76.76.21.21                     3600
CNAME   www     cname.vercel-dns.com            3600
CNAME   api     b76wt8si.up.railway.app         3600
```

## Architecture Diagram

```
                    ┌─────────────────────┐
                    │   arbitrades.sbs     │
                    │   (Hostinger DNS)    │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │  A Record    │   │ CNAME www    │   │ CNAME api    │
    │  76.76.21.21 │   │ vercel-dns   │   │ railway.app  │
    └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
           │                  │                   │
           ▼                  ▼                   ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │    Vercel    │   │  Vercel      │   │   Railway    │
    │  (Frontend)  │   │  (Redirect)  │   │  (Engine)    │
    └──────────────┘   └──────────────┘   └──────────────┘
```
