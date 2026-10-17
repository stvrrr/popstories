# FlipStories

## Supabase email codes

Password recovery and email changes use Supabase Auth one-time codes. In the Supabase Dashboard, open **Authentication → Email Templates** and make sure both the **Reset Password** and **Change Email Address** templates include the OTP value `{{ .Token }}` in the email body. The app asks users to enter that code; a template that only sends `{{ .ConfirmationURL }}` will not provide a code for these screens.
