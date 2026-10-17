# FlipStories

## Supabase email codes

Password recovery and email changes use Supabase Auth one-time codes. In the Supabase Dashboard, open **Authentication → Email Templates** and make sure both the **Reset Password** and **Change Email Address** templates include the OTP value `{{ .Token }}` in the email body. The app asks users to enter that code; a template that only sends `{{ .ConfirmationURL }}` will not provide a code for these screens.

## Story translation

On-demand story and comment translations use Google Cloud Translation Basic (v2). Enable billing and the Cloud Translation API in a Google Cloud project, create an API key restricted to that API, configure suitable API quotas and billing alerts, and set `GOOGLE_TRANSLATE_API_KEY` in the server environment (for local development, copy `.env.example` to `.env.local`). Do not expose this key in a `NEXT_PUBLIC_` variable.

When a reader chooses to translate, the requested story or comment text is sent to Google Cloud Translation. Requests are limited in size by the translation endpoint, and translation failures are shown in the app.
