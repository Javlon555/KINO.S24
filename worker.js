
const MODEL = "gemini-2.5-flash";

export default {
  async fetch(request, env) {
    const allowedOrigin = "https://javlon555.github.io";
    const origin = request.headers.get("Origin");

    const headers = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (origin && origin !== allowedOrigin) {
      return new Response(
        JSON.stringify({ error: "Ruxsat berilmagan manba" }),
        { status: 403, headers }
      );
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ message: "KINO.S24 AI server ishlayapti" }),
        { headers }
      );
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API kaliti sozlanmagan" }),
        { status: 500, headers }
      );
    }

    try {
      const data = await request.json();
      const { topic, duration, genre, language, format } = data;

      if (!topic || !String(topic).trim()) {
        return new Response(
          JSON.stringify({ error: "Kino mavzusini kiriting" }),
          { status: 400, headers }
        );
      }

      const prompt = `
Sen professional kino ssenariynavchisisan.
KINO.S24 uchun original kino ssenariysi yarat.

MAVZU: ${topic}
DAVOMIYLIGI: ${duration || "15 daqiqa"}
JANR: ${genre || "Drama"}
TIL: ${language || "O'zbekcha"}
FORMAT: ${format || "16:9"}

Quyidagilarni tayyorla:
1. Kino nomi.
2. Qisqacha mazmuni.
3. Asosiy aktyorlar va ularning tavsifi.
4. Voqealar ketma-ketligi.
5. Raqamlangan sahnalar.
6. Har bir sahnada joy, vaqt, harakat va kamera tasviri.
7. Aktyorlarning tabiiy dialoglari.
8. Kuchli yakun.

Ssenariyni kino ishlab chiqarishga mos, batafsil yoz.
Hozirgi javobga sig'adigan darajada ko'p sahna yarat.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 8192
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: result.error?.message || "Gemini xatosi"
          }),
          { status: response.status, headers }
        );
      }

      const script =
        result.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("\n") || "";

      return new Response(
        JSON.stringify({
          success: true,
          model: MODEL,
          script
        }),
        { headers }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Server xatosi: " + error.message }),
        { status: 500, headers }
      );
    }
  }
};
