const SUPPORTED_LANGUAGES = new Set(["es", "fr", "de", "pt", "it", "ja", "ko", "zh", "ar"]);
const MAX_TEXTS = 5;
const MAX_TEXT_LENGTH = 15_000;
const MAX_TOTAL_LENGTH = 25_000;
const MAX_REQUEST_BYTES = 100_000;

type TranslationRequest = {
  texts: string[];
  targetLanguage: string;
};

type GoogleTranslationResponse = {
  data?: {
    translations?: Array<{ translatedText?: string }>;
  };
};

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Story translation is not configured on the server." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "The text is too long to translate in one request." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "A valid translation request is required." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("texts" in body) ||
    !Array.isArray(body.texts) ||
    !body.texts.length ||
    body.texts.length > MAX_TEXTS ||
    !body.texts.every((text) => typeof text === "string" && text.trim().length > 0) ||
    !("targetLanguage" in body) ||
    typeof body.targetLanguage !== "string" ||
    !SUPPORTED_LANGUAGES.has(body.targetLanguage)
  ) {
    return Response.json({ error: "The translation request is invalid." }, { status: 400 });
  }

  const { texts, targetLanguage } = body as TranslationRequest;
  const totalLength = texts.reduce((total, text) => total + text.length, 0);
  if (texts.some((text) => text.length > MAX_TEXT_LENGTH) || totalLength > MAX_TOTAL_LENGTH) {
    return Response.json({ error: "The text is too long to translate in one request." }, { status: 413 });
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texts, source: "en", target: targetLanguage, format: "text" }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) {
      console.error("Google Cloud Translation returned an unsuccessful response.", response.status);
      return Response.json({ error: "Translation is temporarily unavailable. Please try again." }, { status: 502 });
    }

    const result = await response.json() as GoogleTranslationResponse;
    const translations = result.data?.translations?.map((item) => item.translatedText);
    if (!translations || translations.length !== texts.length || translations.some((text) => typeof text !== "string")) {
      console.error("Google Cloud Translation returned an incomplete response.");
      return Response.json({ error: "Translation returned an unexpected response. Please try again." }, { status: 502 });
    }

    return Response.json({ translations });
  } catch (error) {
    console.error("Could not reach Google Cloud Translation.", error);
    return Response.json({ error: "Translation is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
