---
title: How to Deploy to Cloudflare Pages
summary: |
  A step-by-step guide to deploying a Next.js application to Cloudflare Pages and setting up an automatic build pipeline.
---

## Prerequisites

- Cloudflare account (free)
- GitHub repository
- Next.js project

## Step 1: Log in to Cloudflare

Log in to the [Cloudflare dashboard](https://dash.cloudflare.com).

## Step 2: Create a Pages Project

Select "Pages" from the left sidebar.

![Pages Dashboard](/images/howto/deploy-cloudflare-pages/step-1.png)

Click the "Connect to GitHub" button.

## Step 3: Set Repository Permissions

Authenticate with your GitHub account and select the repository to deploy.

```bash
# Your repository needs these files
wrangler.toml
package.json
```

## Step 4: Configure Build Settings

On the Pages settings page:

- **Project name**: howto-guides
- **Framework**: Next.js
- **Build command**: npm run build
- **Build output directory**: out

## Step 5: Set Environment Variables (Optional)

Store sensitive information as environment variables:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.pages.dev
```

## Verify Deployment

After your first push, Cloudflare automatically starts the build:

```bash
git add .
git commit -m "Deploy to Cloudflare Pages"
git push origin main
```

You can monitor the deployment progress in the Pages dashboard.

## Set a Custom Domain

1. Go to your Pages project settings
2. In the "Custom domain" section, add your domain
3. Verify DNS records and wait

Deployment complete!
