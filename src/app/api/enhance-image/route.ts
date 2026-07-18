import { NextResponse } from "next/server";

const VISION_MODEL = "google/gemini-2.5-flash";
const IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "black-forest-labs/flux-1-schnell",
  "black-forest-labs/flux-1-dev",
  "google/gemini-2.5-flash-image-preview",
];

type OpenRouterResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string; code?: number };
};

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
  error?: { message?: string; code?: number };
};

// Demo mode fallback görseller
const DEMO_ENHANCED_IMAGES = [
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1080&auto=format&fit=crop&q=90",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&auto=format&fit=crop&q=90",
  "https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=1080&auto=format&fit=crop&q=90",
  "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1080&auto=format&fit=crop&q=90",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&auto=format&fit=crop&q=90",
];

type ImageInput = {
  base64: string;
  mimeType: string;
};

async function analyzeImagesWithVision(
  apiKey: string,
  images: ImageInput[],
  product: string,
  description: string
): Promise<string> {
  // Birden fazla görsel için içerik dizisi oluştur
  const imageContent = images.slice(0, 5).map((img) => ({
    type: "image_url" as const,
    image_url: {
      url: `data:${img.mimeType};base64,${img.base64}`,
    },
  }));

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://reklam-olusturucu.vercel.app",
      "X-Title": "Reklam Olusturucu",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text",
              text: `Analyze ${images.length > 1 ? "these " + images.length + " product/advertisement images" : "this product/advertisement image"} in detail. Extract:
1. Main product or subject (what is shown)
2. Color palette (dominant colors, tones)
3. Current style (minimalist, luxury, casual, etc.)
4. Lighting style (studio, natural, dramatic, etc.)
5. Background type (solid, lifestyle, gradient, etc.)
6. Overall mood and feeling
7. Target audience impression

Product context: "${product}" - "${description}"

Respond in English with a concise JSON analysis:
{
  "subject": "...",
  "colors": "...",
  "style": "...",
  "lighting": "...",
  "background": "...",
  "mood": "...",
  "audience": "..."
}`,
            },
          ],
        },
      ],
    }),
  });

  const data: OpenRouterResponse = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errMsg = data.error?.message || "Vision analysis failed";
    throw new Error(errMsg);
  }

  return data.choices?.[0]?.message?.content || "";
}

async function generateEnhancedImage(
  apiKey: string,
  model: string,
  enhancedPrompt: string
): Promise<{ imageUrl: string } | { error: string }> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://reklam-olusturucu.vercel.app",
      "X-Title": "Reklam Olusturucu",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: enhancedPrompt }],
      modalities: ["image", "text"],
    }),
  });

  const data: OpenRouterImageResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg = data.error?.message || `Model ${model} başarısız (${response.status})`;
    return { error: errMsg };
  }

  // Görseli content veya images alanından al
  const images = data.choices?.[0]?.message?.images;
  const imageUrl = images?.[0]?.image_url?.url;

  if (imageUrl) return { imageUrl };

  // İçerik alanında base64 veri URL'si olabilir
  const content = data.choices?.[0]?.message?.content;
  if (content && content.startsWith("data:image")) {
    return { imageUrl: content };
  }

  return { error: "Model görsel döndürmedi" };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      base64Image,        // Geriye dönük uyumluluk için tek görsel
      mimeType = "image/jpeg",
      images: multipleImages, // Çoklu görsel desteği: [{base64, mimeType}]
      product = "",
      description = "",
      aspectRatio = "1:1",
      inspirationStyle = "",
    } = body;

    // Görsel listesini normalize et (tek veya çoklu)
    let imageList: ImageInput[] = [];
    if (multipleImages && Array.isArray(multipleImages) && multipleImages.length > 0) {
      imageList = multipleImages.slice(0, 5);
    } else if (base64Image) {
      imageList = [{ base64: base64Image, mimeType }];
    }

    if (imageList.length === 0) {
      return NextResponse.json(
        { error: "En az 1 görsel verisi gereklidir" },
        { status: 400 }
      );
    }

    const userApiKey = request.headers.get("x-user-api-key");
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    // Demo mode — API key yok
    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      const demoImg = DEMO_ENHANCED_IMAGES[Math.floor(Math.random() * DEMO_ENHANCED_IMAGES.length)];
      return NextResponse.json({
        imageUrl: demoImg,
        analysis: {
          subject: "Ürün görseli",
          colors: "Canlı, profesyonel renkler",
          style: "Modern reklam stili",
          lighting: "Stüdyo aydınlatması",
          background: "Temiz, sade arka plan",
          mood: "Profesyonel ve güvenilir",
          audience: "Genel tüketici kitlesi",
        },
        enhancedPrompt: "Demo mode - AI prompt gösterilmiyor",
        demo: true,
        imageCount: imageList.length,
        message: `Demo modu aktif (${imageList.length} görsel analiz edildi). Gerçek görsel geliştirme için OpenRouter API anahtarı ekleyin.`,
      });
    }

    // 1) Yüklenen görselleri vision ile analiz et
    let analysisText = "";
    let analysisJson: Record<string, string> = {};

    try {
      analysisText = await analyzeImagesWithVision(
        apiKey,
        imageList,
        product,
        description
      );

      // JSON parse dene
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisJson = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error("Vision analysis error:", err);
      // Analiz başarısız olsa da devam et
    }

    // 2) Aspect ratio talimatı
    let ratioInstruction = "Square 1:1 aspect ratio, perfect for Instagram feed posts.";
    if (aspectRatio === "9:16") {
      ratioInstruction = "Vertical 9:16 aspect ratio, perfect for Instagram/TikTok Stories and Reels.";
    } else if (aspectRatio === "16:9") {
      ratioInstruction = "Landscape 16:9 aspect ratio, perfect for banners and desktop displays.";
    }

    // 3) İlham stili talimatı
    const styleInstructions: Record<string, string> = {
      minimalist: "ultra-minimalist aesthetic, pure white background, single product focus, maximum negative space, clean lines, Scandinavian design influence",
      luxury: "luxurious dark background, deep black or midnight navy, subtle gold or champagne accents, dramatic moody lighting, premium editorial feel, high-end fashion magazine style",
      vibrant: "vibrant saturated colors, bold gradient background, dynamic energy, pop art influence, punchy and eye-catching, Gen-Z aesthetic",
      organic: "natural organic feel, linen or kraft paper texture, earth tones, warm botanical elements, soft natural lighting, sustainable brand aesthetic",
      tech: "sleek futuristic tech aesthetic, deep blue or dark background, electric blue accents, glowing neon highlights, clean geometric shapes, silicon valley style",
      retro: "vintage retro style, warm sepia or faded film tones, grain texture, 70s-80s color palette, nostalgic warm atmosphere",
      cinematic: "cinematic wide-angle feel, dramatic side lighting, deep shadows, rich color grading, movie poster composition, atmospheric fog or bokeh",
      pastel: "soft pastel color palette, dreamy airy background, cotton candy tones, gentle diffused lighting, feminine and approachable",
      bold: "bold graphic design style, high contrast black and white with single accent color, geometric shapes, strong typography zones, Swiss design influence",
    };

    const stylePromptPart = inspirationStyle && styleInstructions[inspirationStyle]
      ? `\nVisual style: ${styleInstructions[inspirationStyle]}.`
      : "";

    // 4) Geliştirilmiş prompt oluştur
    const analysisDetails = Object.keys(analysisJson).length > 0
      ? `\nProduct analysis from ${imageList.length} uploaded image(s):
- Subject: ${analysisJson.subject || "product"}
- Colors: ${analysisJson.colors || "professional colors"}
- Current style: ${analysisJson.style || "modern"}
- Lighting: ${analysisJson.lighting || "studio"}
- Background: ${analysisJson.background || "clean"}
- Mood: ${analysisJson.mood || "professional"}`
      : "";

    const enhancedPrompt = `Create a stunning, professional advertising image that dramatically improves upon this product/concept.

Product: "${product || "product"}"
Description: "${description || "high quality product"}"
${analysisDetails}
${stylePromptPart}

Enhancement requirements:
- ${ratioInstruction}
- Professional commercial product photography quality
- Instagram-ready, scroll-stopping visual impact
- Perfect studio lighting or appropriate atmospheric lighting
- Crisp, sharp focus on product
- Premium, aspirational feel
- No text, watermarks, logos, or typography overlays in the image
- Colors should be rich, vibrant, and commercially appealing
- Composition should follow rule of thirds or centered hero shot`;

    // 5) Görsel üret
    const errors: string[] = [];
    for (const model of IMAGE_MODELS) {
      const result = await generateEnhancedImage(apiKey, model, enhancedPrompt);
      if ("imageUrl" in result) {
        return NextResponse.json({
          imageUrl: result.imageUrl,
          analysis: analysisJson,
          enhancedPrompt,
          model,
          imageCount: imageList.length,
        });
      }
      errors.push(`${model}: ${result.error}`);
      console.error(`Enhanced image generation failed with ${model}:`, result.error);
    }

    return NextResponse.json(
      {
        error: "Görsel geliştirilemedi. Lütfen API anahtarınızı kontrol edin veya daha sonra tekrar deneyin. Detay: " + errors[0],
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Enhance image error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Görsel işlenirken beklenmedik bir hata oluştu",
      },
      { status: 500 }
    );
  }
}
