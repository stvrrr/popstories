import { createAdminClient, isAuthorized, loadStoryDetails } from "../../../lib/server/story-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MINIMUM_MATCH_SCORE = 0.3;

function normalizeTitle(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function editSimilarity(left, right) {
  if (!left || !right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + substitutionCost,
      );
      diagonal = above;
    }
  }

  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

function titleSimilarity(query, candidate) {
  const normalizedQuery = normalizeTitle(query);
  const normalizedCandidate = normalizeTitle(candidate);
  if (normalizedQuery === normalizedCandidate) return 1;

  const queryWords = new Set(normalizedQuery.split(" ").filter(Boolean));
  const candidateWords = new Set(normalizedCandidate.split(" ").filter(Boolean));
  const sharedWords = [...queryWords].filter((word) => candidateWords.has(word)).length;
  const wordSimilarity = queryWords.size + candidateWords.size
    ? (2 * sharedWords) / (queryWords.size + candidateWords.size)
    : 0;
  const phraseSimilarity = normalizedQuery.length >= 3 &&
    (normalizedCandidate.includes(normalizedQuery) || normalizedQuery.includes(normalizedCandidate))
    ? 0.9 * Math.min(normalizedQuery.length, normalizedCandidate.length) /
      Math.max(normalizedQuery.length, normalizedCandidate.length)
    : 0;

  return Math.max(
    editSimilarity(normalizedQuery, normalizedCandidate),
    wordSimilarity,
    phraseSimilarity,
  );
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length > 120) {
    return Response.json({ error: "A search query of 1 to 120 characters is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "Story search is not configured" }, { status: 503 });
  }

  let bestMatch = null;
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data: stories, error } = await admin
      .from("stories")
      .select("id,title")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return Response.json({ error: "Could not search stories" }, { status: 500 });
    }

    for (const story of stories ?? []) {
      const score = titleSimilarity(query, story.title ?? "");
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { id: story.id, score };
      }
    }
    if ((stories ?? []).length < pageSize) break;
    offset += pageSize;
  }

  if (!bestMatch || bestMatch.score < MINIMUM_MATCH_SCORE) {
    return Response.json({ story: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: story, error } = await admin
    .from("stories")
    .select("id,title,excerpt,category,created_at,author_id,profiles!stories_author_id_fkey(username,display_name,avatar_url),likes(count)")
    .eq("id", bestMatch.id)
    .eq("status", "published")
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !story) {
    return Response.json({ error: "Could not load matching story" }, { status: 500 });
  }

  const details = await loadStoryDetails(admin, story, request.url);
  if (details.error) {
    return Response.json({ error: details.error }, { status: 500 });
  }

  return Response.json({
    story: { ...details.story, matchScore: Math.round(bestMatch.score * 100) },
  }, { headers: { "Cache-Control": "no-store" } });
}