import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

const adminUserId = "b3cf6d3d-3f8c-43f1-92b6-b07b115accde";

export async function GET() {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.id !== adminUserId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const [{ data: users }, { data: stories }] = await Promise.all([
    admin.from("profiles").select("id,username,display_name,bio,avatar_url,created_at").order("created_at", { ascending: false }),
    admin.from("stories").select("id,title,status,visibility,author_id,created_at").order("created_at", { ascending: false })
  ]);
  return Response.json({ users: users ?? [], stories: stories ?? [] });
}

export async function PUT(request: Request) {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.id !== adminUserId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  const { id, username, display_name, bio, avatar_url } = await request.json() as {
    id?: string;
    username?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string | null;
  };
  if (!id || !username || !display_name) return Response.json({ error: "id, username, and display_name are required" }, { status: 400 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.from("profiles").update({
    username: username.trim().toLowerCase(),
    display_name: display_name.trim(),
    bio: (bio ?? "").trim(),
    avatar_url: avatar_url ?? null,
  }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.id !== adminUserId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  const { type, id } = await request.json() as { type?: "story" | "profile"; id?: string };
  if (!type || !id) return Response.json({ error: "type and id are required" }, { status: 400 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  if (type === "story") {
    const { error } = await admin.from("stories").delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  } else {
    const { error } = await admin.from("profiles").delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ ok: true });
}
