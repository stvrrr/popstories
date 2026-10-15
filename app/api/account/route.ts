import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export async function DELETE(request: Request) {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user?.email) {
    return Response.json({ error: "You must be signed in to delete your account." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "A password is required to delete your account." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("password" in body) ||
    typeof body.password !== "string" ||
    !body.password
  ) {
    return Response.json({ error: "A password is required to delete your account." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !serviceKey) {
    return Response.json({ error: "Account deletion is not configured on the server." }, { status: 503 });
  }

  const verificationClient = createClient(url, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: verified, error: verificationError } =
    await verificationClient.auth.signInWithPassword({
      email: user.email,
      password: body.password,
    });

  if (verificationError || verified.user?.id !== user.id) {
    return Response.json({ error: "The password is incorrect." }, { status: 403 });
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return Response.json({ error: `Could not delete your account: ${deleteError.message}` }, { status: 500 });
  }

  return Response.json({ ok: true });
}
