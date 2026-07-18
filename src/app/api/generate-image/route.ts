import { NextResponse } from "next/server";

// Görsel üretim modelleri — sırayla denenir
const IMAGE_MODELS = [
  "openai/dall-e-3",
  "google/gemini-2.5-flash-image",
  "black-forest-labs/flux-1-schnell",
  "black-forest-labs/flux-1-dev",
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

// Demo/fallback görseller (anahtar kelimeye göre)
const FALLBACK_IMAGES = [
  { keywords: ["kozmetik", "krem", "cilt", "bakım", "cream", "skin", "cosmetic", "parfüm"], url: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["kahve", "cafe", "coffee", "fincan", "kupa", "çay"], url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["ayakkabı", "sneaker", "shoe", "spor", "koşu"], url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["yemek", "restoran", "lezzet", "food", "burger", "pizza", "tatlı"], url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["saat", "aksesuar", "watch", "takı", "mücevher"], url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["teknoloji", "telefon", "kulaklık", "tech", "gadget", "phone", "bilgisayar", "tablet"], url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["giysi", "elbise", "moda", "fashion", "kıyafet", "tişört"], url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["kitap", "eğitim", "kurs", "öğren", "book"], url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop&q=80" },
];

function getDemoImage(prompt: string): string {
  const cleanPrompt = prompt.toLowerCase();
  for (const item of FALLBACK_IMAGES) {
    if (item.keywords.some((kw) => cleanPrompt.includes(kw))) {
      return item.url;
    }
  }
  return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80";
}

// Stil açıklamaları
const STYLE_PROMPT_MAP: Record<string, string> = {
  minimalist: "ultra-minimalist, pure white background, single product hero, maximum negative space, Scandinavian design",
  luxury: "luxurious dark background, midnight navy, gold accents, dramatic moody lighting, premium editorial feel",
  vibrant: "vibrant saturated colors, bold gradient background, pop art influence, Gen-Z aesthetic, eye-catching",
  organic: "natural organic feel, earth tones, botanical elements, natural lighting, sustainable aesthetic",
  tech: "futuristic tech, dark background, electric blue accents, glowing neon, geometric shapes",
  retro: "vintage retro, warm sepia tones, grain texture, 1970s-80s color palette, nostalgic",
  cinematic: "cinematic, dramatic lighting, deep shadows, rich color grading, movie poster quality",
  pastel: "soft pastel colors, dreamy airy background, cotton candy tones, diffused lighting, feminine",
  bold: "bold graphic design, high contrast, single accent color, strong geometric, Swiss modernist",
};

async function tryGenerateImage(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ imageUrl: string } | { error: string }> {
  try {
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
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    const data: OpenRouterImageResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error: data.error?.message || `${model} başarısız (${response.status})`,
      };
    }

    // Görseli images veya content alanından al
    const images = data.choices?.[0]?.message?.images;
    const imageUrl = images?.[0]?.image_url?.url;
    if (imageUrl) return { imageUrl };

    const content = data.choices?.[0]?.message?.content;
    if (content && content.startsWith("data:image")) {
      return { imageUrl: content };
    }

    return { error: `${model} görsel döndürmedi` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}

export async function POST(request: Request) {
  try {
    const {
      prompt,
      aspectRatio = "1:1",
      referenceStyle = "",
      uploadedImageAnalysis = "",
      imageConcept = "lifestyle",  // Varsayılan mankenli
      lifestyleTheme = "urban",    // Varsayılan araba/sokak
    } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Lütfen bir açıklama girin" }, { status: 400 });
    }

    const userApiKey = request.headers.get("x-user-api-key");
    const rawApiKey = userApiKey || process.env.OPENROUTER_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "").trim() : "";

    // Demo modu
    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      return NextResponse.json({
        imageUrl: getDemoImage(prompt),
        demo: true,
        message: "Demo modu: Gerçek görsel için OpenRouter API anahtarı ekleyin.",
      });
    }

    // Aspect ratio
    let ratioInstruction = "1:1 square aspect ratio.";
    if (aspectRatio === "9:16") {
      ratioInstruction = "9:16 vertical portrait (mobile stories/reels).";
    } else if (aspectRatio === "16:9") {
      ratioInstruction = "16:9 landscape (banner/desktop).";
    }

    // Stil
    const stylePart =
      referenceStyle && STYLE_PROMPT_MAP[referenceStyle]
        ? ` Style: ${STYLE_PROMPT_MAP[referenceStyle]}.`
        : "";

    // Konsept ve Temalar
    let conceptPromptPart = "";
    if (imageConcept === "lifestyle") {
      if (lifestyleTheme === "urban") {
        conceptPromptPart = ` Scene: A professional model wearing/using the product, posing outdoors on a stylish city street in front of a modern premium luxury sports car. Urban fashion model photoshoot styling.`;
      } else if (lifestyleTheme === "nature") {
        conceptPromptPart = ` Scene: A professional model wearing/using the product, posing outdoors in a beautiful natural green forest or botanical garden. Natural organic lighting.`;
      } else {
        conceptPromptPart = ` Scene: A professional model wearing/using the product, posing inside a highly modern boutique cafe or cozy upscale restaurant.`;
      }
    } else {
      conceptPromptPart = ` Scene: A premium commercial product studio photography shot. Clean solid backdrop focus on the product, centered placement.`;
    }

    // Analiz ve renk koruma kuralları
    const analysisPart = uploadedImageAnalysis
      ? ` [CRITICAL COLOR & PRODUCT FIDELITY] You MUST keep the product's color and shape matching this reference: ${uploadedImageAnalysis}. If the reference says the product is black, the model MUST wear a black item (e.g. black pants). DO NOT change the product color.`
      : "";

    // Kısa ve net prompt (token tasarrufu için)
    const imagePrompt = `Professional commercial advertising shot for: ${prompt.substring(0, 150)}.${conceptPromptPart}${analysisPart}${stylePart} Aspect ratio: ${ratioInstruction} Symmetrical presentation, high quality, no text, no watermarks.`;

    // Modelleri sırayla dene
    const errors: string[] = [];
    for (const model of IMAGE_MODELS) {
      const result = await tryGenerateImage(apiKey, model, imagePrompt);
      if ("imageUrl" in result) {
        return NextResponse.json({ imageUrl: result.imageUrl, model });
      }
      errors.push(result.error);
      console.error(`Image gen failed [${model}]:`, result.error);
    }

    // Tüm modeller başarısız — hata mesajı ile dön (loading takılmasın)
    return NextResponse.json(
      {
        error:
          "Görsel oluşturulamadı. API kredinizi veya anahtarınızı kontrol edin. Detay: " +
          errors[0],
        fallbackImageUrl: getDemoImage(prompt), // Yedek görsel de gönder
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
            : "Görsel oluşturulurken beklenmedik hata",
      },
      { status: 500 }
    );
  }
}
