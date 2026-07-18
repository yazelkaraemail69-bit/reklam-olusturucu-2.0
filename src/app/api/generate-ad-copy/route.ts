import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Sen profesyonel bir dijital pazarlama ve reklam metni yazarısın (Copywriter).
Verilen ürün/hizmet, hedef kitle, ton, seçilen platform ve dil bilgisine göre 3 farklı reklam metni varyasyonu oluştur.

Her bir varyasyon farklı bir pazarlama açısı ve psikolojik tetikleyici kullanmalıdır:
1. Varyasyon (Fayda & Değer Odaklı): Ürünün/hizmetin çözdüğü probleme ve sunduğu somut faydalara odaklanmalıdır.
2. Varyasyon (Duygusal & Hikaye Odaklı): Kullanıcının duygularına hitap etmeli, bir hikaye veya bağ kurulabilir bir senaryo sunmalıdır.
3. Varyasyon (Kısa & Doğrudan Eylem Odaklı): Hızlı okunan, merak uyandıran veya aciliyet (FOMO) hissi veren, doğrudan CTA'e yönlendiren yapıda olmalıdır.

Aşağıdaki JSON formatında yanıt ver:
{
  "variations": [
    {
      "id": "v1",
      "strategy": "Fayda & Özellik Odaklı",
      "headline": "Dikkat çekici başlık (Platforma uygun uzunlukta)",
      "body": "Reklam gövde metni (Platforma uygun uzunlukta)",
      "cta": "Harekete geçirici mesaj (örn: Hemen Al, Keşfet, Kayıt Ol)"
    },
    {
      "id": "v2",
      "strategy": "Duygusal & Hikaye Odaklı",
      "headline": "...",
      "body": "...",
      "cta": "..."
    },
    {
      "id": "v3",
      "strategy": "Kısa & Eylem Odaklı",
      "headline": "...",
      "body": "...",
      "cta": "..."
    }
  ],
  "hashtags": "Platforma uygun 5 adet hashtag (boşluklarla ayrılmış, örn: #urun #kalite ...)"
}

Kurallar:
- Yanıt SADECE geçerli bir JSON olmalıdır. Markdown veya ek açıklama yazma.
- Metinler belirtilen dilde yazılmalıdır.
- Seçilen ton ve stile tam olarak uymalıdır.
- Belirtilen platformun karakter limitleri ve genel dil yapısına uygun olmalıdır (Örn: LinkedIn profesyonel/kurumsal, Google Arama başlık/açıklama formatı, TikTok kanca ve senaryo formatı).`;

export async function POST(request: Request) {
  try {
    const { product, description, targetAudience, platform = "Instagram", tone = "Profesyonel", language = "Türkçe" } = await request.json();

    if (!product || !description) {
      return NextResponse.json(
        { error: "Lütfen ürün adı ve açıklamasını girin" },
        { status: 400 }
      );
    }

    const userPrompt = `Ürün/Hizmet: ${product}
Açıklama: ${description}
${targetAudience ? `Hedef Kitle: ${targetAudience}` : ""}
Reklam Platformu: ${platform}
Metin Tonu: ${tone}
Yazım Dili: ${language}

Yukarıdaki bilgilere göre reklam metinlerini oluştur.`;

    const userApiKey = request.headers.get("x-user-api-key");
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      // Demo mode - return example data in the new format
      return NextResponse.json({
        variations: [
          {
            id: "v1",
            strategy: "Fayda & Özellik Odaklı",
            headline: `✨ ${product} ile Hayatını Kolaylaştır!`,
            body: `${product} günlük rutinlerinizde size zaman kazandırmak için tasarlandı. Doğal bileşenleri ve güçlü formülüyle ${description.substring(0, 100)}... Deneyin ve farkı hemen görün!`,
            cta: "Şimdi Satın Al"
          },
          {
            id: "v2",
            strategy: "Duygusal & Hikaye Odaklı",
            headline: "Hak Ettiğin Özeni Kendine Göster",
            body: "Her gün koşturmaca içinde kendini unutuyor musun? Kendine küçük bir iyilik yapmanın tam zamanı. `${product}` ile güne taze bir başlangıç yap, enerjini tazele ve günün tadını çıkar.",
            cta: "Daha Fazla Bilgi"
          },
          {
            id: "v3",
            strategy: "Kısa & Eylem Odaklı",
            headline: "Büyük Değişim, Küçük Adım!",
            body: "Beklemek yok! ${product} ile anında sonuç. Sınırlı stok ve lansmana özel %20 indirim fırsatını kaçırmayın.",
            cta: "Fırsatı Yakala"
          }
        ],
        hashtags: "#reklam #yenilik #fırsat #kalite #keşfet",
        demo: true,
        message: "Demo modu: Gerçek metinler için OpenRouter API anahtarı ekleyin."
      });
    }

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
          model: "openai/gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.75,
          max_tokens: 800,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);
      throw new Error(
        errorData.error?.message || "Reklam metni oluşturulamadı"
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch {
      // If parsing fails, fall back to structuring raw content
      return NextResponse.json({
        variations: [
          {
            id: "v1",
            strategy: "Fayda & Özellik Odaklı",
            headline: "Reklam Metniniz Hazır!",
            body: content,
            cta: "Hemen İletişime Geç"
          }
        ],
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