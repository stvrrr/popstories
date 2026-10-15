import { createServerSupabaseClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, content, shareLink } = payload ?? {};
  if (
    typeof title !== "string" || !title.trim() || title.length > 256 ||
    typeof content !== "string" || !content.trim() || content.length > 20000 ||
    typeof shareLink !== "string" || shareLink.length > 2048
  ) {
    return Response.json({ error: "Invalid story details" }, { status: 400 });
  }

  let parsedShareLink;
  try {
    parsedShareLink = new URL(shareLink);
  } catch {
    return Response.json({ error: "Invalid story link" }, { status: 400 });
  }
  if (
    !["http:", "https:"].includes(parsedShareLink.protocol) ||
    parsedShareLink.origin !== origin
  ) {
    return Response.json({ error: "Story link must be on this website" }, { status: 400 });
  }

  const botApiUrl = process.env.BOT_API_URL;
  const secretToken = process.env.BOT_SECRET_TOKEN;
  if (!botApiUrl || !secretToken) {
    return Response.json({ error: "Story notifications are not configured" }, { status: 503 });
  }

  let botEndpoint;
  try {
    const baseUrl = new URL(botApiUrl);
    if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error("Unsupported protocol");
    botEndpoint = new URL("/new-story", baseUrl);
  } catch {
    return Response.json({ error: "Invalid bot endpoint configuration" }, { status: 503 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const author = profile?.display_name?.trim() ||
      user.user_metadata?.display_name || user.user_metadata?.name || user.email || "Anonymous writer";

    const botResponse = await fetch(botEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        content: content.trim(),
        author,
        shareLink: parsedShareLink.toString(),
        secretToken,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!botResponse.ok) {
      return Response.json({ error: "Bot rejected the story notification" }, { status: 502 });
    }
    return Response.json({ delivered: true });
  } catch {
    return Response.json({ error: "Could not deliver the story notification" }, { status: 502 });
  }
}