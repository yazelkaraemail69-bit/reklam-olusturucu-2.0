import { NextResponse } from "next/server";

// Metin modelleri — sırayla denenir
const TEXT_MODELS = [
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
  "anthropic/claude-3-haiku",
  "meta-llama/llama-3.1-8b-instruct:free",
];

const SYSTEM_PROMPT = `Sen profesyonel bir dijital pazarlama ve reklam metni yazarısın.
Verilen ürün, hedef kitle, ton, platform ve dil bilgisine göre 3 farklı reklam metni varyasyonu oluştur.

Her varyasyon farklı bir pazarlama açısı kullanmalıdır:
1. Fayda & Değer Odaklı: Ürünün çözdüğü probleme ve somut faydalara odaklan.
2. Duygusal & Hikaye Odaklı: Kullanıcının duygularına hitap et.
3. Kısa & Eylem Odaklı: Hızlı okunan, aciliyet hissi veren yapı.

SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:
{"variations":[{"id":"v1","strategy":"Fayda & Özellik Odaklı","headline":"...","body":"...","cta":"..."},{"id":"v2","strategy":"Duygusal & Hikaye Odaklı","headline":"...","body":"...","cta":"..."},{"id":"v3","strategy":"Kısa & Eylem Odaklı","headline":"...","body":"...","cta":"..."}],"hashtags":"#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"}`;

export async function POST(request: Request) {
  try {
    const {
      product,
      description,
      targetAudience,
      platform = "Instagram",
      tone = "Profesyonel",
      language = "Türkçe",
    } = await request.json();

    if (!product || !description) {
      return NextResponse.json(
        { error: "Lütfen ürün adı ve açıklamasını girin" },
        { status: 400 }
      );
    }

    // Kısa ve net kullanıcı prompt'u — karakter limitini aşmamak için
    const userPrompt = `Ürün: ${product.substring(0, 100)}
Açıklama: ${description.substring(0, 300)}
${targetAudience ? `Hedef Kitle: ${targetAudience.substring(0, 100)}` : ""}
Platform: ${platform}
Ton: ${tone}
Dil: ${language}

JSON formatında 3 varyasyon oluştur.`;

    const userApiKey = request.headers.get("x-user-api-key");
    const rawApiKey = userApiKey || process.env.OPENROUTER_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "").trim() : "";

    // Demo modu
    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      return NextResponse.json({
        variations: [
          {
            id: "v1",
            strategy: "Fayda & Özellik Odaklı",
            headline: `✨ ${product} ile Hayatını Kolaylaştır!`,
            body: `${product} ile ${description.substring(0, 80)}... Farkı hemen görün!`,
            cta: "Şimdi Satın Al",
          },
          {
            id: "v2",
            strategy: "Duygusal & Hikaye Odaklı",
            headline: "Hak Ettiğin Özeni Kendine Göster",
            body: `Her gün koşturmaca içinde kendinizi unutuyor musunuz? ${product} ile güne taze bir başlangıç yapın.`,
            cta: "Daha Fazla Bilgi",
          },
          {
            id: "v3",
            strategy: "Kısa & Eylem Odaklı",
            headline: "Büyük Değişim, Küçük Adım!",
            body: `${product} ile anında sonuç. Sınırlı stok — fırsatı kaçırmayın!`,
            cta: "Fırsatı Yakala",
          },
        ],
        hashtags: "#reklam #yenilik #fırsat #kalite #keşfet",
        demo: true,
        message: "Demo modu: Gerçek metinler için OpenRouter API anahtarı ekleyin.",
      });
    }

    // Modelleri sırayla dene
    const errors: string[] = [];

    for (const model of TEXT_MODELS) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": "https://reklam-olusturucu.vercel.app",
              "X-Title": "Reklam Olusturucu",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 1200,
            }),
          }
        );

        const data = await response.json().catch(() => ({})) as {
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string };
        };

        if (!response.ok) {
          const errMsg = data.error?.message || `${model} başarısız (${response.status})`;
          errors.push(`${model}: ${errMsg}`);
          console.error(`Ad copy model ${model} failed:`, errMsg);
          continue; // Sonraki modeli dene
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          errors.push(`${model}: Boş yanıt`);
          continue;
        }

        // JSON parse et — markdown fence varsa temizle
        let parsed;
        try {
          const cleaned = content.replace(/```json|```/g, "").trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            parsed = JSON.parse(cleaned);
          }
        } catch {
          // Parse başarısız — ham metni tek varyasyon olarak dön
          return NextResponse.json({
            variations: [
              {
                id: "v1",
                strategy: "Fayda & Özellik Odaklı",
                headline: `${product} Reklamı`,
                body: content.substring(0, 500),
                cta: "Hemen İncele",
              },
            ],
            hashtags: `#${product.toLowerCase().replace(/\s+/g, "")} #reklam #kampanya`,
          });
        }

        // variations yoksa veya boşsa hata ver
        if (!parsed.variations || parsed.variations.length === 0) {
          errors.push(`${model}: variations alanı boş`);
          continue;
        }

        return NextResponse.json({ ...parsed, model });

      } catch (modelErr) {
        const msg = modelErr instanceof Error ? modelErr.message : "Bilinmeyen hata";
        errors.push(`${model}: ${msg}`);
        console.error(`Ad copy model ${model} threw:`, msg);
      }
    }

    // Tüm modeller başarısız
    return NextResponse.json(
      {
        error:
          "Reklam metni oluşturulamadı. API anahtarınızı kontrol edin. Detay: " +
          errors[0],
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Ad copy generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Reklam metni oluşturulurken bir hata oluştu",
      },
      { status: 500 }
    );
  }
}