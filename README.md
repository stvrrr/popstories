# Flip Stories

## Security response headers

The Next.js app sends a Content Security Policy, anti-framing and MIME-sniffing protections, a referrer policy, a restrictive permissions policy, and HSTS. The policy allows Google Fonts and HTTPS-hosted images; browser connections to Supabase are restricted to `NEXT_PUBLIC_SUPABASE_URL`. Set that variable in the deployment build environment so the policy matches the Supabase project. API responses are marked `Cache-Control: no-store`; the public static pages may still be cached.

The app does not enable cross-origin API access. If a CDN or reverse proxy sits in front of Next.js, make sure it preserves these response headers and serves the site over HTTPS.

## Supabase email codes

Password recovery and email changes use Supabase Auth one-time codes. In the Supabase Dashboard, open **Authentication → Email Templates** and make sure both the **Reset Password** and **Change Email Address** templates include the OTP value `{{ .Token }}` in the email body. The app asks users to enter that code; a template that only sends `{{ .ConfirmationURL }}` will not provide a code for these screens.

## Story translation

On-demand story and comment translations use the DeepL API Free endpoint. [Sign up for a DeepL API Free plan](https://www.deepl.com/pro-api), then [find your API key](https://www.deepl.com/your-account/keys) and set it as `DEEPL_API_KEY` in the server environment (for local development, copy `.env.example` to `.env.local`). Do not expose this key in a `NEXT_PUBLIC_` variable. DeepL's Free API has a monthly character quota; check the current [DeepL API plans and pricing](https://www.deepl.com/pro-api) for its limit and terms.

When a reader chooses to translate, the requested story or comment text is sent to DeepL. Requests are limited in size by the translation endpoint, and translation failures are shown in the app. When the monthly quota is exhausted, the app reports that translations are temporarily unavailable.

## Litecoin donations

The donation preview is available at `/donate`. To enable it, copy your Litecoin **mainnet receive address** from Trust Wallet into `NEXT_PUBLIC_LITECOIN_ADDRESS` in `.env.local` (or set the same variable in your deployment environment), then restart or redeploy the app. The address is public by design; never put a recovery phrase or private key in the app. The page generates a Litecoin payment QR code and wallet link locally, and donations go directly to that address. Donors should send Litecoin on the Litecoin network only.

## Discord story likes

The Discord bot can like and unlike public, published stories without requiring readers to have Flip Stories accounts. Configure `BOT_SECRET_TOKEN` in the server environment and send it as a bearer token; keep it private to the bot and server. The bot provides the reader's Discord snowflake ID, and each Discord user can have one like per story.

Apply the `20261026000000_discord_story_likes.sql` Supabase migration before using this endpoint.

Use one Discord button for both liking and unliking. On every button interaction, send `POST /api/discord/likes` with JSON `{ "storyId": "<story UUID>", "discordUserId": "<clicking user's Discord snowflake>" }`. The endpoint atomically toggles that user's like and returns `{ "storyId": "...", "liked": true|false, "likeCount": number }`; update the button label or style using the returned `liked` state. `DELETE` on the same endpoint with the same JSON body removes the like without toggling. The like count includes both account-based and Discord likes. The Discord IDs themselves are private and are never returned by the API.
