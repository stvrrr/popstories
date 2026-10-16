import { createAdminClient, isAuthorized, loadStoryDetails } from "../../../lib/server/story-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storyId = new URL(request.url).searchParams.get("id");
  if (!storyId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storyId)) {
    return Response.json({ error: "A valid story id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "Story lookup is not configured" }, { status: 503 });
  }

  const { data: story, error } = await admin
    .from("stories")
    .select("id,title,excerpt,category,created_at,author_id,profiles!stories_author_id_fkey(username,display_name,avatar_url),likes(count)")
    .eq("id", storyId)
    .eq("status", "published")
    .eq("visibility", "public")
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Could not load story" }, { status: 500 });
  }
  if (!story) {
    return Response.json({ error: "Story not found" }, { status: 404 });
  }

  const storyDetails = await loadStoryDetails(admin, story, request.url);
  if (storyDetails.error) {
    return Response.json({ error: storyDetails.error }, { status: 500 });
  }
  return Response.json(storyDetails, { headers: { "Cache-Control": "no-store" } });
}