import { NextResponse } from "next/server";

const IMAGE_MODELS = [
  "black-forest-labs/flux-1-dev",
  "black-forest-labs/flux-1-schnell",
  "google/gemini-2.5-flash-image",
];

// Fallback logo icons for demo mode
const DEMO_LOGOS = [
  "https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=500&auto=format&fit=crop&q=80", // Minimal Abstract icon
  "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&auto=format&fit=crop&q=80", // Geometric icon
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=500&auto=format&fit=crop&q=80", // Business/corporate style
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=500&auto=format&fit=crop&q=80", // Artistic logo
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=500&auto=format&fit=crop&q=80"  // Pattern/badge style
];

async function tryGenerateLogo(
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
        "X-Title": "Reklam Olusturucu Logo Modulu",
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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      error: data.error?.message || `Model ${model} başarısız (${response.status})`,
    };
  }

  const images = data.choices?.[0]?.message?.images;
  const imageUrl = images?.[0]?.image_url?.url;

  if (imageUrl) {
    return { imageUrl };
  }

  return { error: "Model logo görseli döndürmedi" };
}

export async function POST(request: Request) {
  try {
    const { brandName, tagline = "", industry = "", style = "minimalist", palette = "blue" } = await request.json();

    if (!brandName) {
      return NextResponse.json(
        { error: "Lütfen bir marka adı girin" },
        { status: 400 }
      );
    }

    const userApiKey = request.headers.get("x-user-api-key");
    const rawApiKey = userApiKey || process.env.OPENROUTER_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "").trim() : "";

    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      const demoImageUrl = DEMO_LOGOS[Math.floor(Math.random() * DEMO_LOGOS.length)];
      return NextResponse.json({
        imageUrl: demoImageUrl,
        demo: true,
        message: "Demo modu: Gerçek bir logo için OpenRouter API anahtarı ekleyin.",
      });
    }

    // Stil yönlendirmeleri
    const styleDescriptions: Record<string, string> = {
      minimalist: "vector, clean minimalist flat logo, simple shape, maximum negative space, modern line art, highly professional, isolated on solid white background",
      luxury: "luxurious premium logo, sophisticated emblem, gold metallic foil details on solid black background, royal badge style, elegant typography",
      geometric: "geometric abstract logo, perfectly balanced shapes, sacred geometry, clean sharp lines, vector grid format, modern corporate style",
      letterpress: "bold letterpress style logo, vintage crest, detailed stamp, organic hand-crafted feel, rustic look, solid background",
      mascot: "friendly vector cartoon mascot logo, thick clean outlines, high contrast, web-app style avatar icon, charming personality",
      futuristic: "futuristic tech logo, cybernetic neon accents, glowing paths, circuit-board pattern elements, dark theme presentation"
    };

    // Renk paleti yönlendirmeleri
    const paletteDescriptions: Record<string, string> = {
      blue: "professional corporate dark blue, trustworthy sky blue and white",
      premium: "luxury gold, rich champagne metallic, deep carbon black, platinum gray",
      vibrant: "energetic crimson red, bright sunset orange, deep magenta",
      pastel: "dreamy soft lilac, pastel pink, mint cream green, peach cream",
      monochrome: "timeless high contrast pure black and pure white",
      nature: "sustainable leaf green, warm wooden brown, sand gold, earthy tones"
    };

    const stylePart = styleDescriptions[style] || styleDescriptions.minimalist;
    const palettePart = paletteDescriptions[palette] || paletteDescriptions.blue;
    const sloganPart = tagline ? `incorporating tagline/slogan text "${tagline}"` : "without tagline";

    // Vektör kalitesinde logo promptu oluştur
    const logoPrompt = `Create a professional high-quality vector logo icon for a brand named "${brandName}" in the "${industry}" industry.
Logo properties:
- Style: ${stylePart}
- Color Palette: ${palettePart}
- Brand Name to display: "${brandName}" ${sloganPart}
- Presentation: Center-aligned, isolated on a solid color backdrop, perfect symmetrical design, no busy details.
- Avoid: Photorealistic elements, shadows, 3D render look (unless requested), messy text, complex borders. The logo must look clean, scalable, and instantly recognizable.`;

    const errors: string[] = [];
    for (const model of IMAGE_MODELS) {
      const result = await tryGenerateLogo(apiKey, model, logoPrompt);
      if ("imageUrl" in result) {
        return NextResponse.json({ imageUrl: result.imageUrl, model });
      }
      errors.push(`${model}: ${result.error}`);
      console.error(`Logo generation failed with ${model}:`, result.error);
    }

    return NextResponse.json(
      {
        error:
          "Logo oluşturulamadı. Denenen modeller başarısız oldu: " +
          errors.join(" | "),
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Logo generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Logo oluşturulurken bir hata oluştu",
      },
      { status: 500 }
    );
  }
}
