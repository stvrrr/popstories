import { createAdminClient, isAuthorized, loadStoryDetails } from "../../../lib/server/story-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    .select("id,title,excerpt,category,created_at,author_id,profiles!stories_author_id_fkey(username,display_name,avatar_url),likes(count)")
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

  const storyDetails = await loadStoryDetails(admin, story, request.url);
  if (storyDetails.error) {
    return Response.json({ error: "Could not load story content" }, { status: 500 });
  }
  return Response.json(storyDetails, { headers: { "Cache-Control": "no-store" } });
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