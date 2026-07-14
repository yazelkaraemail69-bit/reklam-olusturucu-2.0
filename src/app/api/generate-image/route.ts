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

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "your_openai_api_key_here") {
      // Demo mode - return a placeholder when no API key is configured
      const demoImageUrl = `https://placehold.co/600x600/3b82f6/ffffff?text=${encodeURIComponent(
        prompt.substring(0, 50)
      )}`;
      return NextResponse.json({
        imageUrl: demoImageUrl,
        demo: true,
        message: "Demo modu: Gerçek bir görsel için OpenAI API anahtarı ekleyin.",
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Reklam görseli: ${prompt}. Profesyonel, yüksek kaliteli, ticari ürün fotoğrafçılığı stili.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      throw new Error(errorData.error?.message || "Görsel oluşturulamadı");
    }

    const data = await response.json();
    return NextResponse.json({ imageUrl: data.data[0].url });
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