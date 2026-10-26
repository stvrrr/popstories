import {
  createAdminClient,
  getPublicStoryLikeCount,
  isAuthorized,
} from "../../../../lib/server/story-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORY_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DISCORD_USER_ID_PATTERN = /^[1-9][0-9]{0,19}$/;

async function readLikeRequest(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return { error: Response.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }

  if (typeof payload?.storyId !== "string" || !STORY_ID_PATTERN.test(payload.storyId)) {
    return { error: Response.json({ error: "A valid storyId is required" }, { status: 400 }) };
  }
  if (typeof payload?.discordUserId !== "string" || !DISCORD_USER_ID_PATTERN.test(payload.discordUserId)) {
    return { error: Response.json({ error: "A valid Discord user ID is required" }, { status: 400 }) };
  }
  return { storyId: payload.storyId, discordUserId: payload.discordUserId };
}

async function handleLike(request, action) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await readLikeRequest(request);
  if (payload.error) return payload.error;

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "Discord likes are not configured" }, { status: 503 });
  }

  if (action === "toggle") {
    const { data, error } = await admin.rpc("toggle_discord_story_like", {
      p_story_id: payload.storyId,
      p_discord_user_id: payload.discordUserId,
    });

    if (error) {
      return Response.json({ error: "Could not toggle story like" }, { status: 500 });
    }
    if (!data?.length) {
      return Response.json({ error: "Story not found" }, { status: 404 });
    }

    return Response.json({
      storyId: payload.storyId,
      liked: data[0].liked,
      likeCount: Number(data[0].like_count),
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: story, error: storyError } = await admin
    .from("stories")
    .select("id")
    .eq("id", payload.storyId)
    .eq("status", "published")
    .eq("visibility", "public")
    .maybeSingle();

  if (storyError) {
    return Response.json({ error: "Could not load story" }, { status: 500 });
  }
  if (!story) {
    return Response.json({ error: "Story not found" }, { status: 404 });
  }

  const result = action === "like"
    ? await admin
        .from("discord_story_likes")
        .upsert(
          { story_id: payload.storyId, discord_user_id: payload.discordUserId },
          { onConflict: "story_id,discord_user_id", ignoreDuplicates: true },
        )
    : await admin
        .from("discord_story_likes")
        .delete()
        .eq("story_id", payload.storyId)
        .eq("discord_user_id", payload.discordUserId);

  if (result.error) {
    return Response.json({ error: `Could not ${action} story` }, { status: 500 });
  }

  const likeCountResult = await getPublicStoryLikeCount(admin, payload.storyId);
  if (likeCountResult.error) {
    return Response.json({ error: "Could not load updated like count" }, { status: 500 });
  }

  return Response.json({
    storyId: payload.storyId,
    liked: action === "like",
    likeCount: likeCountResult.count,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  return handleLike(request, "toggle");
}

export async function DELETE(request) {
  return handleLike(request, "unlike");
}
