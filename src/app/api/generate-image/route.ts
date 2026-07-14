import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Lütfen bir açıklama girin" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      // Demo mode - return a placeholder when no API key is configured
      const demoImageUrl = `https://placehold.co/600x600/3b82f6/ffffff?text=${encodeURIComponent(
        prompt.substring(0, 50)
      )}`;
      return NextResponse.json({
        imageUrl: demoImageUrl,
        demo: true,
        message:
          "Demo modu: Gerçek bir görsel için OpenRouter API anahtarı ekleyin.",
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
          messages: [
            {
              role: "system",
              content:
                "Sen bir görsel tanımlama asistanısın. Kullanıcının verdiği reklam açıklamasını, DALL-E için optimize edilmiş, detaylı bir İngilizce prompt'a çevir. Sadece prompt'u yaz, başka bir şey yazma.",
            },
            {
              role: "user",
              content: `Bu reklam için DALL-E prompt'u oluştur: ${prompt}. Profesyonel, yüksek kaliteli, ticari ürün fotoğrafçılığı stili.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);
      throw new Error(
        errorData.error?.message || "Görsel prompt'u oluşturulamadı"
      );
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    // Now generate the image using OpenRouter's image generation
    const imageResponse = await fetch(
      "https://openrouter.ai/api/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://reklam-olusturucu.vercel.app",
          "X-Title": "Reklam Olusturucu",
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux-schnell",
          prompt: generatedPrompt,
          n: 1,
          size: "1024x1024",
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json().catch(() => ({}));
      console.error("OpenRouter image API error:", errorData);

      // Fallback: Return a placeholder if image generation fails
      const fallbackUrl = `https://placehold.co/600x600/3b82f6/ffffff?text=${encodeURIComponent(
        "Reklam Görseli"
      )}`;
      return NextResponse.json({
        imageUrl: fallbackUrl,
        generatedPrompt,
        note: "Görsel oluşturulamadı, placeholder gösteriliyor.",
      });
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data?.[0]?.url || imageData.data?.[0]?.b64_json;

    if (!imageUrl) {
      throw new Error("Görsel URL'si alınamadı");
    }

    return NextResponse.json({ imageUrl, generatedPrompt });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Görsel oluşturulurken bir hata oluştu",
      },
      { status: 500 }
    );
  }
}