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

async function getRatingSummary(admin, storyId) {
  let ratingCount = 0;
  let ratingTotal = 0;
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await admin
      .from("story_comments")
      .select("rating")
      .eq("story_id", storyId)
      .not("rating", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) return { error };
    for (const row of data ?? []) {
      ratingTotal += row.rating;
      ratingCount += 1;
    }
    if ((data ?? []).length < pageSize) break;
    offset += pageSize;
  }

  return {
    average: ratingCount ? Math.round((ratingTotal / ratingCount) * 10) / 10 : null,
    count: ratingCount,
  };
}

function toPlainText(content) {
  return content
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:div|p|li|h[1-6])\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, value) => {
      const codePoint = Number(value);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : "\uFFFD";
    })
    .replace(/&#x([\da-f]+);/gi, (_, value) => {
      const codePoint = Number.parseInt(value, 16);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : "\uFFFD";
    })
    .replace(/\s+/g, " ")
    .trim();
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

  const [pageResult, commentsResult, commentCountResult, ratingResult] = await Promise.all([
    admin
      .from("story_pages")
      .select("content")
      .eq("story_id", story.id)
      .eq("page_number", 1)
      .maybeSingle(),
    admin
      .from("story_comments")
      .select("id,content,rating,created_at,user_id,profiles!story_comments_user_id_fkey(display_name,username,avatar_url)")
      .eq("story_id", story.id)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("story_comments")
      .select("id", { count: "exact", head: true })
      .eq("story_id", story.id),
    getRatingSummary(admin, story.id),
  ]);
  if (pageResult.error || commentsResult.error || commentCountResult.error || ratingResult.error) {
    return Response.json({ error: "Could not load story content" }, { status: 500 });
  }

  const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
  const shareLink = new URL(`/?story=${encodeURIComponent(story.id)}`, request.url).toString();
  const firstPageContent = toPlainText(pageResult.data?.content ?? "");
  const context = firstPageContent.length > 200 ? `${firstPageContent.slice(0, 197)}...` : firstPageContent;
  const comments = (commentsResult.data ?? []).map((comment) => {
    const commentProfile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
    return {
      id: comment.id,
      content: comment.content,
      rating: comment.rating,
      createdAt: comment.created_at,
      author: commentProfile?.display_name || "Reader",
      username: commentProfile?.username || "",
      avatar: commentProfile?.avatar_url ?? null,
    };
  });
  return Response.json({
    story: {
      id: story.id,
      title: story.title,
      description: story.excerpt ?? "",
      context,
      content: context,
      author: profile?.display_name || "Anonymous writer",
      authorId: story.author_id,
      username: profile?.username || "",
      authorAvatar: profile?.avatar_url ?? null,
      category: story.category ?? "",
      createdAt: story.created_at,
      likes: story.likes?.[0]?.count ?? 0,
      comments,
      commentCount: commentCountResult.count ?? 0,
      rating: ratingResult,
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