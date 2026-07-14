import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Sen profesyonel bir reklam metni yazarısın. Verilen ürün/hizmet bilgisine göre Instagram için reklam metni oluştur.

Aşağıdaki formatta yanıt ver (JSON olarak):
{
  "headline": "Dikkat çekici bir başlık (maksimum 10 kelime)",
  "body": "Ana reklam metni (40-80 kelime arası, samimi ve ikna edici Türkçe ile)",
  "cta": "Harekete geçirici mesaj (örn: Hemen Al, Keşfet, Şimdi Dene, vs.)",
  "hashtags": "5 ilgili hashtag (virgülle ayrılmış)"
}

Kurallar:
- Metin samimi, sıcak ve profesyonel olsun
- Hedef kitleye doğrudan hitap et
- Ürünün/hizmetin faydalarını vurgula
- Instagram kullanıcılarına uygun, görsel odaklı ve kısa metinler yaz
- Duygusal tetikleyiciler kullan (aciliyet, özel hissetme, FOMO)
- Türkçe karakterleri düzgün kullan`;

export async function POST(request: Request) {
  try {
    const { product, description, targetAudience } = await request.json();

    if (!product || !description) {
      return NextResponse.json(
        { error: "Lütfen ürün adı ve açıklamasını girin" },
        { status: 400 }
      );
    }

    const userPrompt = `Ürün/Hizmet: ${product}
Açıklama: ${description}
${targetAudience ? `Hedef Kitle: ${targetAudience}` : ""}

Yukarıdaki bilgilere göre Instagram reklam metni oluştur.`;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "your_openai_api_key_here") {
      // Demo mode - return example data when no API key is configured
      return NextResponse.json({
        headline: `✨ ${product} ile Fark Yarat!`,
        body: `${product}, hayatınızı kolaylaştırmak için tasarlandı. ${description.substring(
          0,
          60
        )}... Profesyonel kalitede, uygun fiyatlı ve herkes için erişilebilir. Kaçırmayın, sınırlı stok!`,
        cta: "Hemen Keşfet",
        hashtags: "#reklam #yenilik #fırsat #kalite #keşfet",
        demo: true,
        message:
          "Demo modu: Gerçek metin için OpenAI API anahtarı ekleyin.",
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      throw new Error(
        errorData.error?.message || "Reklam metni oluşturulamadı"
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response
    let parsed;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch {
      // If parsing fails, return raw content
      return NextResponse.json({
        headline: "Reklam Metniniz Hazır!",
        body: content,
        cta: "Hemen İletişime Geç",
        hashtags: "#reklam #ürün #hizmet",
      });
    }

    return NextResponse.json(parsed);
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