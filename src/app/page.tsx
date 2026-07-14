"use client";

import { useState } from "react";

type AdCopy = {
  headline: string;
  body: string;
  cta: string;
  hashtags: string;
  demo?: boolean;
  message?: string;
};

type Step = 1 | 2 | 3;

export default function Home() {
  // Wizard state
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");

  // Result state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [adCopy, setAdCopy] = useState<AdCopy | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const canProceedStep1 = product.trim() !== "" && description.trim() !== "";

  const generateAll = async () => {
    setLoading(true);
    setError(null);
    setStep(3);

    const imagePromptText =
      imagePrompt.trim() || `${product} - ${description} reklam görseli`;

    try {
      setLoadingText("Reklam metni yazılıyor...");
      const copyRes = await fetch("/api/generate-ad-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, description, targetAudience }),
      });
      const copyData = await copyRes.json();
      if (!copyRes.ok) throw new Error(copyData.error);
      setAdCopy(copyData);

      setLoadingText("Reklam görseli oluşturuluyor... (yaklaşık 10 sn)");
      const imageRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePromptText }),
      });
      const imageData = await imageRes.json();
      if (!imageRes.ok) throw new Error(imageData.error);
      setImageUrl(imageData.imageUrl);

      if (imageData.demo || copyData.demo) {
        setError("Demo modu: Gerçek içerik için OpenRouter API anahtarı ekleyin.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "İçerik oluşturulamadı");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const regenerateImage = async () => {
    setLoading(true);
    setError(null);
    setLoadingText("Yeni görsel oluşturuluyor...");
    const imagePromptText =
      imagePrompt.trim() || `${product} - ${description} reklam görseli`;
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePromptText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Görsel oluşturulamadı");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const regenerateCopy = async () => {
    setLoading(true);
    setError(null);
    setLoadingText("Yeni reklam metni yazılıyor...");
    try {
      const res = await fetch("/api/generate-ad-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, description, targetAudience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdCopy(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Reklam metni oluşturulamadı"
      );
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `reklam-gorseli-${product
      .toLowerCase()
      .replace(/[^a-z0-9ğüşöçı]+/gi, "-")
      .substring(0, 30)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const resetAll = () => {
    setStep(1);
    setProduct("");
    setDescription("");
    setTargetAudience("");
    setImagePrompt("");
    setImageUrl(null);
    setAdCopy(null);
    setError(null);
  };

  const steps = [
    { num: 1, title: "Ürün Bilgileri", icon: "📦" },
    { num: 2, title: "Görsel Ayarları", icon: "🎨" },
    { num: 3, title: "Sonuçlar", icon: "✨" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Reklam Oluşturucu
              </h1>
              <p className="text-xs text-slate-500">
                AI Destekli Reklam Görseli & Metin Üretici
              </p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Baştan Başla
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <button
                  onClick={() => {
                    // Sadece geriye gidilebilir veya tamamlanmış adımlara
                    if (s.num < step || (s.num === 2 && canProceedStep1)) {
                      setStep(s.num as Step);
                    }
                  }}
                  className={`flex flex-col items-center gap-2 group ${
                    s.num <= step ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                      s.num === step
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-300 scale-110"
                        : s.num < step
                        ? "bg-green-100 text-green-600 border-2 border-green-300"
                        : "bg-white text-slate-400 border-2 border-slate-200"
                    }`}
                  >
                    {s.num < step ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span>{s.icon}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      s.num === step
                        ? "text-blue-600"
                        : s.num < step
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-2 mb-6 rounded-full transition-all duration-300 ${
                      s.num < step ? "bg-green-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm">
            <svg
              className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-amber-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-amber-400 hover:text-amber-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============ STEP 1: Product Info ============ */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">📦</div>
              <h2 className="text-2xl font-bold text-slate-800">
                Ürününüzü Tanıtın
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Reklamını yapmak istediğiniz ürün veya hizmetin bilgilerini
                girin
              </p>
            </div>

            <div className="space-y-5 max-w-lg mx-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ürün / Hizmet Adı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Örn: Organik Yüz Kremi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Açıklama <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ürününüzün özelliklerini, faydalarını ve öne çıkan yönlerini yazın..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hedef Kitle{" "}
                  <span className="text-slate-400 font-normal">
                    (isteğe bağlı)
                  </span>
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Örn: 25-40 yaş arası, cilt bakımına önem verenler"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full py-3.5 mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                Devam Et
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ============ STEP 2: Image Settings ============ */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎨</div>
              <h2 className="text-2xl font-bold text-slate-800">
                Görsel Ayarları
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Görselin nasıl görünmesini istediğinizi anlatın veya boş
                bırakın, AI sizin için karar versin
              </p>
            </div>

            <div className="space-y-5 max-w-lg mx-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Görsel Açıklaması{" "}
                  <span className="text-slate-400 font-normal">
                    (isteğe bağlı)
                  </span>
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Örn: Şık bir masada, doğal ışık altında krem şişesi, yanında taze çiçekler ve yeşil yapraklar..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
                />
                <p className="text-xs text-slate-400 mt-2">
                  💡 Boş bırakırsanız, ürün bilgilerinize göre otomatik görsel
                  oluşturulur
                </p>
              </div>

              {/* Özet kartı */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Özet
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Ürün:</span> {product}
                </p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                  <span className="font-semibold">Açıklama:</span>{" "}
                  {description}
                </p>
                {targetAudience && (
                  <p className="text-sm text-slate-600 mt-1">
                    <span className="font-semibold">Hedef Kitle:</span>{" "}
                    {targetAudience}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white text-slate-600 font-medium rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 17l-5-5m0 0l5-5m-5 5h12"
                    />
                  </svg>
                  Geri
                </button>
                <button
                  onClick={generateAll}
                  className="flex-[2] py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Reklamı Oluştur
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 3: Results ============ */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Loading state */}
            {loading && (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-10 border border-slate-100 text-center">
                <div className="inline-block w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-700 font-semibold">{loadingText}</p>
                <p className="text-sm text-slate-400 mt-1">
                  Lütfen bekleyin, AI çalışıyor...
                </p>
              </div>
            )}

            {/* Results grid */}
            {!loading && (imageUrl || adCopy) && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <span>🎨</span> Reklam Görseli
                    </h3>
                    <button
                      onClick={regenerateImage}
                      disabled={loading}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Yeniden Üret
                    </button>
                  </div>

                  {imageUrl ? (
                    <div className="space-y-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Reklam görseli"
                        className="w-full rounded-2xl border border-slate-200 shadow-md"
                      />
                      <button
                        onClick={downloadImage}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-lg shadow-green-200 hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Görseli İndir (PNG)
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                      Görsel henüz oluşturulmadı
                    </div>
                  )}
                </div>

                {/* Ad Copy Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <span>✍️</span> Instagram Metni
                    </h3>
                    <button
                      onClick={regenerateCopy}
                      disabled={loading}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Yeniden Üret
                    </button>
                  </div>

                  {adCopy ? (
                    <div className="space-y-3">
                      {/* Headline */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3.5 border border-blue-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                            Başlık
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(adCopy.headline, "headline")
                            }
                            className="text-blue-400 hover:text-blue-600 text-xs"
                          >
                            {copiedIndex === "headline" ? "✓ Kopyalandı" : "Kopyala"}
                          </button>
                        </div>
                        <p className="font-bold text-slate-800">
                          {adCopy.headline}
                        </p>
                      </div>

                      {/* Body */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Metin
                          </span>
                          <button
                            onClick={() => copyToClipboard(adCopy.body, "body")}
                            className="text-slate-400 hover:text-slate-600 text-xs"
                          >
                            {copiedIndex === "body" ? "✓ Kopyalandı" : "Kopyala"}
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {adCopy.body}
                        </p>
                      </div>

                      {/* CTA + Hashtags */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                          → {adCopy.cta}
                        </span>
                      </div>
                      <p className="text-xs text-blue-500">{adCopy.hashtags}</p>

                      {/* Copy All */}
                      <button
                        onClick={() => {
                          const fullText = `${adCopy.headline}\n\n${adCopy.body}\n\n${adCopy.cta}\n\n${adCopy.hashtags}`;
                          copyToClipboard(fullText, "all");
                        }}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                      >
                        {copiedIndex === "all" ? (
                          <>✓ Kopyalandı!</>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Tüm Metni Kopyala
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                      Metin henüz oluşturulmadı
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom actions */}
            {!loading && (imageUrl || adCopy) && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-white text-slate-600 font-medium rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 17l-5-5m0 0l5-5m-5 5h12"
                    />
                  </svg>
                  Ayarlara Dön
                </button>
                <button
                  onClick={resetAll}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Yeni Reklam Oluştur
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center py-6 border-t border-slate-200">
          <p className="text-sm text-slate-400">
            AI Destekli Reklam Oluşturucu &copy; 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
