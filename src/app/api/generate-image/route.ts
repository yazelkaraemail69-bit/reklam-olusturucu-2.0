import { NextResponse } from "next/server";

// OpenRouter'da görsel üretimi chat/completions endpoint'i ile,
// "modalities: ['image', 'text']" destekleyen modeller üzerinden yapılır.
// Gemini 2.5 Flash Image (nano-banana) şu an en iyi ve uygun fiyatlı seçenek.
const IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "google/gemini-2.5-flash-image-preview",
];

type OpenRouterImageResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      images?: Array<{
        type?: string;
        image_url?: { url?: string };
      }>;
    };
  }>;
  error?: { message?: string };
};

async function tryGenerateImage(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ imageUrl: string } | { error: string }> {
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
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    }
  );

  const data: OpenRouterImageResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      error: data.error?.message || `Model ${model} başarısız (${response.status})`,
    };
  }

  // Görseli yanıttan çıkar (base64 data URL olarak gelir)
  const images = data.choices?.[0]?.message?.images;
  const imageUrl = images?.[0]?.image_url?.url;

  if (imageUrl) {
    return { imageUrl };
  }

  return { error: "Model görsel döndürmedi" };
}

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

    // Reklam görseli için optimize edilmiş prompt
    const imagePrompt = `Create a professional, high-quality advertising image for the following product/service. The image should be suitable for Instagram advertising: eye-catching, commercial photography style, vibrant colors, clean composition, studio lighting, product-focused.

Product/Description: ${prompt}

Style requirements:
- Professional commercial product photography
- Instagram-ready square format aesthetics
- Bright, appealing, premium look
- No text or watermarks in the image`;

    // Modelleri sırayla dene
    const errors: string[] = [];
    for (const model of IMAGE_MODELS) {
      const result = await tryGenerateImage(apiKey, model, imagePrompt);
      if ("imageUrl" in result) {
        return NextResponse.json({ imageUrl: result.imageUrl, model });
      }
      errors.push(`${model}: ${result.error}`);
      console.error(`Image generation failed with ${model}:`, result.error);
    }

    // Tüm modeller başarısız olduysa hata döndür
    return NextResponse.json(
      {
        error:
          "Görsel oluşturulamadı. Denenen modeller başarısız oldu: " +
          errors.join(" | "),
      },
      { status: 502 }
    );
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
