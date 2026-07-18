import { NextResponse } from "next/server";

const VISION_MODEL = "openai/gpt-4o";
const IMAGE_MODELS = [
  "openai/dall-e-3",
  "google/gemini-2.5-flash-image",
  "black-forest-labs/flux-1-schnell",
  "black-forest-labs/flux-1-dev",
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

/**
 * Yalnızca 1 görsel (en iyi/seçili) vision modeline gönderilir.
 * Birden fazla görsel gönderilirse payload token limiti aşılır.
 */
async function analyzeImageWithVision(
  apiKey: string,
  image: ImageInput,
  imageCount: number,
  product: string,
  description: string
): Promise<string> {
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
            {
              type: "image_url",
              image_url: {
                url: `data:${image.mimeType};base64,${image.base64}`,
              },
            },
            {
              type: "text",
              text: `Analyze this product/advertisement image in detail.${imageCount > 1 ? ` (Note: User uploaded ${imageCount} product images; this is the primary one.)` : ""}

Extract:
1. Main product or subject (what is shown)
2. Color palette (dominant colors, tones)
3. Current style (minimalist, luxury, casual, etc.)
4. Lighting style (studio, natural, dramatic, etc.)
5. Background type (solid, lifestyle, gradient, etc.)
6. Overall mood and feeling
7. Target audience impression

Product context: "${product}" - "${description}"

Respond ONLY with valid JSON (no markdown, no extra text):
{"subject":"...","colors":"...","style":"...","lighting":"...","background":"...","mood":"...","audience":"..."}`,
            },
          ],
        },
      ],
      max_tokens: 300,
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

  // Görseli images veya content alanından al
  const images = data.choices?.[0]?.message?.images;
  const imageUrl = images?.[0]?.image_url?.url;
  if (imageUrl) return { imageUrl };

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
      base64Image,
      mimeType = "image/jpeg",
      images: multipleImages,
      imageCount: bodyImageCount,
      product = "",
      description = "",
      aspectRatio = "1:1",
      inspirationStyle = "",
      imageConcept = "lifestyle",  // Varsayılan mankenli
      lifestyleTheme = "urban",    // Varsayılan sokak/araba
      imagePrompt = "",            // Kullanıcının özel görsel yönlendirmesi
    } = body;

    // Görsel normalize et — sadece 1 görsel analiz için kullan
    let primaryImage: ImageInput | null = null;
    let imageCount = 1;

    if (multipleImages && Array.isArray(multipleImages) && multipleImages.length > 0) {
      primaryImage = multipleImages[0];
      imageCount = multipleImages.length;
    } else if (base64Image) {
      primaryImage = { base64: base64Image, mimeType };
      imageCount = typeof bodyImageCount === "number" ? bodyImageCount : 1;
    }

    if (!primaryImage) {
      return NextResponse.json(
        { error: "En az 1 görsel verisi gereklidir" },
        { status: 400 }
      );
    }

    const userApiKey = request.headers.get("x-user-api-key");
    const rawApiKey = userApiKey || process.env.OPENROUTER_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "").trim() : "";

    // Demo mode
    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      const demoImg = DEMO_ENHANCED_IMAGES[Math.floor(Math.random() * DEMO_ENHANCED_IMAGES.length)];
      return NextResponse.json({
        imageUrl: demoImg,
        analysis: {
          subject: "Ürün görseli",
          colors: "Canlı, profesyonel renkler",
          style: "Modern reklam stili",
          lighting: "Stüdyo aydınlaması",
          background: "Temiz, sade arka plan",
          mood: "Profesyonel ve güvenilir",
          audience: "Genel tüketici kitlesi",
        },
        enhancedPrompt: "Demo mode",
        demo: true,
        imageCount,
        message: `Demo modu aktif (${imageCount} görsel). Gerçek görsel geliştirme için API anahtarı ekleyin.`,
      });
    }

    const cleanProduct = product.substring(0, 100);
    const cleanDescription = description.substring(0, 600);

    // 1) Seçili görseli vision ile analiz et (sadece 1 görsel gönderilir)
    let analysisText = "";
    let analysisJson: Record<string, string> = {};

    try {
      analysisText = await analyzeImageWithVision(
        apiKey,
        primaryImage,
        imageCount,
        cleanProduct,
        cleanDescription
      );

      // JSON parse — markdown fence varsa temizle
      const cleaned = analysisText.replace(/```json|```/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
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

    // 3) İlham stili
    const styleInstructions: Record<string, string> = {
      minimalist: "ultra-minimalist aesthetic, pure white background, single product focus, maximum negative space, clean Scandinavian design",
      luxury: "luxurious dark background, deep black or midnight navy, subtle gold accents, dramatic moody lighting, premium editorial feel",
      vibrant: "vibrant saturated colors, bold gradient background, dynamic energy, pop art influence, Gen-Z aesthetic",
      organic: "natural organic feel, earth tones, warm botanical elements, soft natural lighting, sustainable brand aesthetic",
      tech: "sleek futuristic tech aesthetic, deep dark background, electric blue accents, glowing neon highlights, geometric shapes",
      retro: "vintage retro style, warm sepia film tones, grain texture, 70s-80s color palette, nostalgic atmosphere",
      cinematic: "cinematic composition, dramatic lighting, deep shadows, rich color grading, movie poster quality",
      pastel: "soft pastel color palette, dreamy airy background, cotton candy tones, gentle diffused lighting, feminine aesthetic",
      bold: "bold graphic design, high contrast black and white with single accent color, strong geometric composition",
    };

    const stylePromptPart = inspirationStyle && styleInstructions[inspirationStyle]
      ? `\nVisual style: ${styleInstructions[inspirationStyle]}.`
      : "";

    // 4) Konsept Prompt'u oluştur
    let conceptPromptPart = "";
    if (imageConcept === "lifestyle") {
      if (lifestyleTheme === "urban") {
        conceptPromptPart = `Scene: A professional high-fashion model wearing/using the product, posing outdoors on a trendy urban street city background, standing confidently in front of a sleek modern luxury sports car. Urban fashion look, commercial campaign style.`;
      } else if (lifestyleTheme === "nature") {
        conceptPromptPart = `Scene: A professional model wearing/using the product, posing outdoors in a beautiful lush green forest or natural organic garden, soft natural window light rays filtering through the leaves. Eco-lifestyle look.`;
      } else {
        conceptPromptPart = `Scene: A professional model wearing/using the product, posing inside a highly modern, cozy boutique cafe or elegant high-end restaurant with warm bokeh ambient lighting. Luxury lifestyle look.`;
      }
    } else {
      conceptPromptPart = `Scene: A premium commercial product studio photography shot. The product is placed centered on a professional clean studio backdrop or pedestal with perfect highlight reflections.`;
    }

    const analysisDetails = Object.keys(analysisJson).length > 0
      ? `\n[CRITICAL PRODUCT FEATURES TO PRESERVE]
- Exact Product Item: ${analysisJson.subject || "product"}
- Exact Original Color(s): ${analysisJson.colors || "original colors"}
- Product Style/Cut: ${analysisJson.style || "modern"}`
      : "";

    const multiImageNote = imageCount > 1
      ? `\n(Based on analysis of ${imageCount} product images uploaded by user)`
      : "";

    const userCustomDirection = imagePrompt
      ? `\n[USER CUSTOM STAGING DIRECTIVES - FOLLOW STRONGLY]
The user wants to stage the product exactly like this: "${imagePrompt}"`
      : "";

    const enhancedPrompt = `Create a stunning professional commercial advertising image.

Product Name: "${cleanProduct}"
Product Details: "${cleanDescription}"
${analysisDetails}
${userCustomDirection}
${multiImageNote}
${stylePromptPart}
${conceptPromptPart}

[CRITICAL INSTRUCTIONS - COLOR & PRODUCT FIDELITY]
1. Staging Preference: If "USER CUSTOM STAGING DIRECTIVES" is provided above, you MUST compositionally arrange the product exactly according to those directives (e.g. if it says "inside a cardboard box, carefully packaged", render the product exactly placed inside a nice open cardboard package box).
2. Product Representation: If the concept is "model/lifestyle" and no conflicting custom staging is requested, the model in the image MUST be wearing or holding the product. The product's shape, style, and details must match "Exact Product Item" (e.g. if it is baggy pants, they must be baggy pants).
3. Product Color Accuracy: You MUST keep the product's color EXACTLY as specified in "Exact Original Color(s)". For example, if the color is "black", the product (e.g. pants) the model is wearing MUST be black. Absolutely DO NOT change the product's color (do not make black pants blue, green, etc.).
3. Environment Contrast: You can use rich lighting or vibrant backdrops, but the product itself MUST retain its original color.
4. Quality: High-fashion commercial photoshoot styling, crisp focus on the model and product, no text, no logos, no watermarks, premium look.
5. Aspect Ratio: ${ratioInstruction}`;

    // 5) Görsel üret — modelleri sırayla dene
    const errors: string[] = [];
    for (const model of IMAGE_MODELS) {
      const result = await generateEnhancedImage(apiKey, model, enhancedPrompt);
      if ("imageUrl" in result) {
        return NextResponse.json({
          imageUrl: result.imageUrl,
          analysis: analysisJson,
          enhancedPrompt,
          model,
          imageCount,
        });
      }
      errors.push(`${model}: ${result.error}`);
      console.error(`Image generation failed with ${model}:`, result.error);
    }

    return NextResponse.json(
      {
        error:
          "Görsel oluşturulamadı. API anahtarınızı kontrol edin veya daha sonra tekrar deneyin. Detay: " +
          errors[0],
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
