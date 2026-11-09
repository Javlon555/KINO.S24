const MODEL = "gemini-3.8-flash";
const ALLOWED_ORIGIN = "https://javlon555.github.io";

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
      "Vary": "Origin"
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) {
        return new Response(null, { status: 403 });
      }

      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    if (request.method === "GET") {
      return reply({
        success: true,
        message: "KINO.S24 server ishlayapti",
        model: MODEL,
        apiKeyExists: Boolean(env.GEMINI_API_KEY)
      });
    }

    if (request.method !== "POST") {
      return reply({ error: "POST so‘rovi kerak" }, 405);
    }

    if (origin !== ALLOWED_ORIGIN) {
      return reply({ error: "Sayt manzili ruxsat etilmagan" }, 403);
    }

    if (!env.GEMINI_API_KEY) {
      return reply({ error: "GEMINI_API_KEY topilmadi" }, 500);
    }

    try {
      const data = await request.json();
      const topic = String(data.topic || "").trim();

      if (!topic) {
        return reply({ error: "Kino mavzusini kiriting" }, 400);
      }

      const prompt = `
Sen professional kino ssenariynavchisisan.
KINO.S24 uchun original kino ssenariysi yoz.

MAVZU: ${topic}
DAVOMIYLIGI: ${data.duration || "15 daqiqa"}
JANR: ${data.genre || "Drama"}
TIL: ${data.language || "O‘zbekcha"}
FORMAT: ${data.format || "16:9"}

Quyidagilarni tayyorla:
1. Kino nomi va mazmuni.
2. Asosiy qahramonlar va tashqi ko‘rinishi.
3. Voqealar ketma-ketligi.
4. Raqamlangan sahnalar.
5. Har bir sahnaning joyi, vaqti va tasviri.
6. Kamera va aktyorlar harakati.
7. Tabiiy dialoglar.
8. Kuchli yakun.

Ssenariy izchil, batafsil va kino ishlab chiqarishga mos bo‘lsin.
`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL + ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              maxOutputTokens: 8192
            }
          })
        }
      );

      const raw = await response.text();
      let result;

      try {
        result = JSON.parse(raw);
      } catch {
        return reply({
          error: "Gemini noto‘g‘ri javob qaytardi",
          status: response.status
        }, 502);
      }

      if (!response.ok) {
        return reply({
          error: result.error?.message || "Gemini API xatosi",
          status: response.status
        }, 502);
      }

      const script = (result.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || "")
        .join("\n")
        .trim();

      if (!script) {
        return reply({
          error: "Gemini bo‘sh javob qaytardi"
        }, 502);
      }

      return reply({
        success: true,
        model: MODEL,
        script
      });

    } catch (error) {
      return reply({
        error: "Server xatosi",
        details: error.message
      }, 500);
    }
  }
};