# PostForge AI - Fixed Build

A safer Instagram content generator for @aibyvineet.

## What is fixed

- Removed fabricated hardcoded AI news seed data.
- Refresh now returns only source-backed items with URL + date + source.
- Generate API refuses unverified items.
- Claude model name moved to a valid configurable default.
- Better JSON extraction and validation.
- Safer UI states and clearer warnings.
- Canva route can autofill a Canva brand template with clean carousel copy as an editable backup path.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your keys in `.env.local`.

## Environment variables

- `OPENAI_API_KEY` - required for refresh and image generation.
- `ANTHROPIC_API_KEY` - required for post generation.
- Optional: `ANTHROPIC_MODEL` - default: `claude-sonnet-4-6`.
- `BLOB_READ_WRITE_TOKEN` - required to upload generated carousel images to public URLs for Instagram posting.
- `INSTAGRAM_ACCESS_TOKEN` - required for Instagram Graph API publishing.
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` - required Instagram professional account ID.
- Optional: `META_GRAPH_VERSION` - default: `v23.0`.
- Optional: `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET` - your Canva app credentials if you later add full OAuth.
- `CANVA_ACCESS_TOKEN` - required for the Canva editable-design route.
- `CANVA_BRAND_TEMPLATE_ID` - required Canva brand template to autofill with carousel copy.

## Canva editable backup

The app now sends only production-ready fields to Canva: cover headline, cover subline, slide headlines, short sublines, stats, caption, CTA, hashtags, and `@aibyvineet`. It does not send internal strategy/source copy into the template.

Create a Canva brand template with fields named:

```text
cover_headline
cover_subline
handle
slide_1_role
slide_1_headline
slide_1_subline
slide_1_stat
...
slide_5_role
slide_5_headline
slide_5_subline
slide_5_stat
caption
cta
hashtags
```

Add `CANVA_ACCESS_TOKEN` and `CANVA_BRAND_TEMPLATE_ID` to Vercel and redeploy. The existing AI image route remains the direct Instagram publishing route; Canva is the editable backup route.
