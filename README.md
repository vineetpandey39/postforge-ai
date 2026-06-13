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
- `CANVA_BRAND_TEMPLATE_ID` - single Canva brand template fallback.
- `CANVA_TEMPLATE_POOL` - preferred; JSON list of Canva brand templates to rotate through.

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

Add `CANVA_ACCESS_TOKEN` and either `CANVA_TEMPLATE_POOL` or `CANVA_BRAND_TEMPLATE_ID` to Vercel and redeploy. The existing AI image route remains the direct Instagram publishing route; Canva is the editable backup route.

Use `CANVA_TEMPLATE_POOL` when you want different layouts instead of one repeated template:

```json
[
  {
    "id": "YOUR_DARK_NEON_BRAND_TEMPLATE_ID",
    "name": "Purple black AI tech",
    "style": "dark neon viral AI",
    "fields": [
      "cover_headline",
      "cover_subline",
      "handle",
      "slide_1_role",
      "slide_1_headline",
      "slide_1_subline",
      "slide_2_role",
      "slide_2_headline",
      "slide_2_subline",
      "slide_3_role",
      "slide_3_headline",
      "slide_3_subline",
      "slide_4_role",
      "slide_4_headline",
      "slide_4_subline",
      "slide_5_headline",
      "slide_5_subline"
    ]
  },
  {
    "id": "YOUR_EDITORIAL_BRAND_TEMPLATE_ID",
    "name": "Editorial prompt guide",
    "style": "light serif education"
  },
  {
    "id": "YOUR_DASHBOARD_BRAND_TEMPLATE_ID",
    "name": "Data proof dashboard",
    "style": "metrics and proof"
  }
]
```

The app randomly picks from this pool each time Canva generation runs. The `Try Different Canva Template` button asks the server to avoid the last template when the pool has more than one option.

The optional `fields` array tells PostForge to send only fields that exist in that Canva template. Use it for templates that do not have stat, caption, CTA, or hashtag placeholders.

Canva public marketplace template IDs, such as `EAG8wiHfHdI`, are good inspiration/base templates. For Autofill, first customize them in your Canva account, rename the text fields to match the field names above, and publish each one as your own Canva brand template. Put those resulting brand template IDs in `CANVA_TEMPLATE_POOL`.
