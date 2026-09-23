# Popstories

A minimal Next.js starter ready to run locally or deploy on Vercel.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production check

```bash
npm run build
npm run start
```

## Supabase setup

Run the SQL files in `supabase/` in the Supabase SQL Editor before using the admin panel. In particular, `supabase/migrations/20260923000000_site_settings.sql` creates the `site_settings` table used to change the site image. After running it, reload the API schema cache or wait a few seconds before retrying the update.
huss