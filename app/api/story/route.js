import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request) {
  const expected = process.env.BOT_SECRET_TOKEN;
  const authorization = request.headers.get("authorization");
  if (!expected || !authorization?.startsWith("Bearer ")) return false;

  const receivedBuffer = Buffer.from(authorization.slice(7));
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "Story polling is not configured" }, { status: 503 });
  }

  const { data: story, error } = await admin
    .from("stories")
    .select("id,title,author_id,profiles!stories_author_id_fkey(display_name,avatar_url)")
    .eq("status", "published")
    .eq("visibility", "public")
    .is("discord_posted_at", null)
    .order("published_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Could not load pending stories" }, { status: 500 });
  }
  if (!story) {
    return Response.json({ story: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: firstPage, error: pageError } = await admin
    .from("story_pages")
    .select("content")
    .eq("story_id", story.id)
    .eq("page_number", 1)
    .maybeSingle();
  if (pageError) {
    return Response.json({ error: "Could not load story content" }, { status: 500 });
  }

  const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
  const shareLink = new URL(`/?story=${encodeURIComponent(story.id)}`, request.url).toString();
  const firstPageContent = firstPage?.content?.trim() ?? "";
  return Response.json({
    story: {
      id: story.id,
      title: story.title,
      content: firstPageContent.length > 300 ? `${firstPageContent.slice(0, 297)}...` : firstPageContent,
      author: profile?.display_name || "Anonymous writer",
      authorAvatar: profile?.avatar_url ?? null,
      shareLink,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof payload?.id !== "string" || !payload.id.trim()) {
    return Response.json({ error: "Story id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "Story polling is not configured" }, { status: 503 });
  }

  const { error } = await admin
    .from("stories")
    .update({ discord_posted_at: new Date().toISOString() })
    .eq("id", payload.id.trim())
    .eq("status", "published")
    .eq("visibility", "public")
    .is("discord_posted_at", null);

  if (error) {
    return Response.json({ error: "Could not acknowledge story" }, { status: 500 });
  }
  return Response.json({ acknowledged: true });
}