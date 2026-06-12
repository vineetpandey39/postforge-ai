# PostForge AI - Fixed Build

A safer Instagram content generator for @aibyvineet.

## What is fixed

- Removed fabricated hardcoded AI news seed data.
- Refresh now returns only source-backed items with URL + date + source.
- Generate API refuses unverified items.
- Claude model name moved to a valid configurable default.
- Better JSON extraction and validation.
- Safer UI states and clearer warnings.
- Canva route now returns a clear limitation instead of pretending MCP can create designs from a normal API call.

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
