import { NextResponse } from "next/server";

// OpenRouter image generation models supporting modalities: ['image', 'text']
const IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "black-forest-labs/flux-1-schnell",
  "black-forest-labs/flux-1-dev",
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

// High-quality fallback images based on keywords to avoid boring placeholder boxes in demo mode
const FALLBACK_IMAGES = [
  { keywords: ["kozmetik", "krem", "cilt", "bakım", "cream", "skin", "cosmetic"], url: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["kahve", "cafe", "coffee", "fincan", "kupa"], url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["ayakkabı", "sneaker", "shoe", "spor"], url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["yemek", "restoran", "lezzet", "food", "burger", "pizza"], url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["saat", "aksesuar", "watch", "takı"], url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80" },
  { keywords: ["teknoloji", "telefon", "kulaklık", "tech", "gadget", "phone"], url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80" }
];

function getDemoImage(prompt: string): string {
  const cleanPrompt = prompt.toLowerCase();
  for (const item of FALLBACK_IMAGES) {
    if (item.keywords.some(kw => cleanPrompt.includes(kw))) {
      return item.url;
    }
  }
  // Default clean design/business fallback
  return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80";
}

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

  // Görseli yanıttan çıkar (base64 data URL veya url olarak gelir)
  const images = data.choices?.[0]?.message?.images;
  const imageUrl = images?.[0]?.image_url?.url;

  if (imageUrl) {
    return { imageUrl };
  }

  return { error: "Model görsel döndürmedi" };
}

// Stil ID'lerini açıklayıcı prompt talimatlarına çevir
const STYLE_PROMPT_MAP: Record<string, string> = {
  minimalist: "ultra-minimalist aesthetic, pure white or very light background, single product hero focus, maximum negative space, clean lines, Scandinavian design",
  luxury: "luxurious dark background, deep black or midnight navy, subtle gold or champagne metallic accents, dramatic moody cinematic lighting, premium editorial fashion magazine feel",
  vibrant: "vibrant saturated colors, bold dynamic gradient background, high energy pop art influence, Gen-Z aesthetic, punchy eye-catching composition",
  organic: "natural organic feel, linen or kraft paper texture, warm earth tones, soft botanical elements, natural window lighting, sustainable eco-brand aesthetic",
  tech: "sleek futuristic tech aesthetic, deep dark blue background, electric cyan or neon blue accents, glowing light effects, geometric shapes, silicon valley premium style",
  retro: "vintage retro style, warm sepia faded film tones, grain texture overlay, 1970s-80s color palette, nostalgic warm atmospheric mood",
  cinematic: "cinematic wide-angle composition, dramatic split lighting or rim lighting, deep shadows, rich color grading, movie poster quality, atmospheric bokeh or fog",
  pastel: "soft dreamy pastel color palette, airy light background, cotton candy tones, gentle diffused lighting, feminine approachable aesthetic",
  bold: "bold graphic design, high contrast black and white with single vibrant accent color, strong geometric composition, Swiss modernist design influence",
};

export async function POST(request: Request) {
  try {
    const { prompt, aspectRatio = "1:1", referenceStyle = "", uploadedImageAnalysis = "" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Lütfen bir açıklama girin" },
        { status: 400 }
      );
    }

    const userApiKey = request.headers.get("x-user-api-key");
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      // Return a beautiful dynamic Unsplash fallback in demo mode
      const demoImageUrl = getDemoImage(prompt);
      return NextResponse.json({
        imageUrl: demoImageUrl,
        demo: true,
        message: "Demo modu: Gerçek bir görsel için OpenRouter API anahtarı ekleyin.",
      });
    }

    // Map aspect ratio to explicit instructions
    let ratioInstruction = "Use 1:1 square aspect ratio.";
    if (aspectRatio === "9:16") {
      ratioInstruction = "Use 9:16 vertical portrait aspect ratio (perfect for mobile stories/reels).";
    } else if (aspectRatio === "16:9") {
      ratioInstruction = "Use 16:9 landscape aspect ratio (perfect for banner/desktop).";
    }

    // İlham stili ve yüklenen görsel analizi dahil et
    const stylePart = referenceStyle && STYLE_PROMPT_MAP[referenceStyle]
      ? `\nVisual style: ${STYLE_PROMPT_MAP[referenceStyle]}.`
      : "";

    const analysisPart = uploadedImageAnalysis
      ? `\nProduct context from uploaded image: ${uploadedImageAnalysis}`
      : "";

    // Reklam görseli için optimize edilmiş prompt
    const imagePrompt = `Create a professional, high-quality advertising image for the following product/service. The image should be suitable for advertising: eye-catching, commercial photography style, vibrant colors, clean composition, studio lighting, product-focused.
    
Product/Description: ${prompt}
${analysisPart}
${stylePart}

Style requirements:
- Professional commercial product photography
- ${ratioInstruction}
- Bright, appealing, premium look
- No text, typography, logos, or watermarks in the image`;

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

