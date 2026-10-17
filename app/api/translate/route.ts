const TARGET_LANGUAGE_CODES: Record<string, string> = {
  es: "ES",
  fr: "FR",
  de: "DE",
  pt: "PT-BR",
  it: "IT",
  ja: "JA",
  ko: "KO",
  zh: "ZH",
  ar: "AR",
};
const MAX_TEXTS = 5;
const MAX_TEXT_LENGTH = 15_000;
const MAX_TOTAL_LENGTH = 25_000;
const MAX_REQUEST_BYTES = 100_000;

type TranslationRequest = {
  texts: string[];
  targetLanguage: string;
};

type DeepLTranslationResponse = {
  translations?: Array<{ text?: string }>;
};

export async function POST(request: Request) {
  const apiKey = process.env.DEEPL_API_KEY;
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
    !(body.targetLanguage in TARGET_LANGUAGE_CODES)
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
      "https://api-free.deepl.com/v2/translate",
      {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: texts, source_lang: "EN", target_lang: TARGET_LANGUAGE_CODES[targetLanguage] }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) {
      const traceId = response.headers.get("X-Trace-ID");
      console.error("DeepL translation returned an unsuccessful response.", { status: response.status, traceId });
      if (response.status === 456) {
        return Response.json({ error: "The DeepL API Free monthly translation limit has been reached." }, { status: 429 });
      }
      if (response.status === 401 || response.status === 403) {
        return Response.json({ error: "The DeepL API key was rejected. Check the server configuration." }, { status: 502 });
      }
      if (response.status === 429) {
        return Response.json({ error: "Translation is temporarily rate limited. Please try again shortly." }, { status: 429 });
      }
      return Response.json({ error: "Translation is temporarily unavailable. Please try again." }, { status: 502 });
    }

    const result = await response.json() as DeepLTranslationResponse;
    const translations = result.translations?.map((item) => item.text);
    if (!translations || translations.length !== texts.length || translations.some((text) => typeof text !== "string")) {
      console.error("DeepL returned an incomplete translation response.");
      return Response.json({ error: "Translation returned an unexpected response. Please try again." }, { status: 502 });
    }

    return Response.json({ translations });
  } catch (error) {
    console.error("Could not reach DeepL translation.", error);
    return Response.json({ error: "Translation is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
