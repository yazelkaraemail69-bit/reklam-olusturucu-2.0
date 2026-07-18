"use client";

import { useState, useEffect, useRef } from "react";
import AdMockup from "@/components/AdMockup";
import ImageUploader, { UploadedImage } from "@/components/ImageUploader";
import InspirationGallery from "@/components/InspirationGallery";

type AdCopyVariation = {
  id: string;
  strategy: string;
  headline: string;
  body: string;
  cta: string;
};

type Step = 1 | 2 | 3;

export default function Home() {
  // Wizard state
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Profesyonel");
  const [language, setLanguage] = useState("Türkçe");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imagePrompt, setImagePrompt] = useState("");
  const [profileName, setProfileName] = useState("");

  // Settings & Custom API Key
  const [userApiKey, setUserApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // --- NEW: Image Upload State ---
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedUploadedImageId, setSelectedUploadedImageId] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<Record<string, string>>({});
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [useUploadedImage, setUseUploadedImage] = useState(false);

  // --- NEW: Logo Generator State ---
  const [activeTab, setActiveTab] = useState<"ad" | "logo">("ad");
  const [logoBrandName, setLogoBrandName] = useState("");
  const [logoTagline, setLogoTagline] = useState("");
  const [logoIndustry, setLogoIndustry] = useState("");
  const [logoStyle, setLogoStyle] = useState("minimalist");
  const [logoPalette, setLogoPalette] = useState("blue");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoDemoMode, setLogoDemoMode] = useState(false);
  const [logoPreviewBg, setLogoPreviewBg] = useState<"dark" | "light" | "transparent">("dark");

  // --- NEW: Inspiration Gallery State ---
  const [selectedInspirationStyle, setSelectedInspirationStyle] = useState<string | null>(null);

  // Scroll ref for enhance result
  const enhanceResultRef = useRef<HTMLDivElement>(null);

  // Result state
  const [variations, setVariations] = useState<AdCopyVariation[]>([]);
  const [hashtags, setHashtags] = useState("");
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Hydration handling
  useEffect(() => {
    const savedKey = localStorage.getItem("openrouter_api_key");
    if (savedKey) {
      setTimeout(() => setUserApiKey(savedKey), 0);
    }

    const savedProfile = localStorage.getItem("profile_name");
    if (savedProfile) {
      setTimeout(() => setProfileName(savedProfile), 0);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setUserApiKey(key);
    localStorage.setItem("openrouter_api_key", key);
  };

  const handleProfileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProfileName(name);
    localStorage.setItem("profile_name", name);
  };

  const canProceedStep1 = product.trim() !== "" && description.trim() !== "";
  const canProceedStep2 = platform.trim() !== "";

  // --- AI Görsel Geliştirme ---
  const handleEnhanceImage = async () => {
    if (uploadedImages.length === 0) return;

    setIsEnhancing(true);
    setEnhanceError(null);
    setEnhancedImageUrl(null);

    try {
      // Sadece seçili görseli (veya ilk görseli) gönder — payload boyutunu küçük tut
      const primaryImg =
        uploadedImages.find((img) => img.id === selectedUploadedImageId) ||
        uploadedImages[0];

      const res = await fetch("/api/enhance-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userApiKey ? { "x-user-api-key": userApiKey } : {}),
        },
        body: JSON.stringify({
          base64Image: primaryImg.base64,
          mimeType: primaryImg.mimeType,
          imageCount: uploadedImages.length, // Kaç görsel yüklendiğini bilgi olarak ilet
          product,
          description,
          aspectRatio,
          inspirationStyle: selectedInspirationStyle || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Görsel geliştirilemedi");

      setEnhancedImageUrl(data.imageUrl);
      setImageAnalysis(data.analysis || {});
      setUseUploadedImage(true);
      setImageUrl(data.imageUrl);

      setTimeout(() => {
        enhanceResultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
    } catch (err) {
      setEnhanceError(err instanceof Error ? err.message : "Görsel geliştirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // --- NEW: Logo Oluşturucu ---
  const generateLogo = async () => {
    if (!logoBrandName.trim()) return;
    setLogoLoading(true);
    setLogoError(null);
    setLogoUrl(null);

    try {
      const res = await fetch("/api/generate-logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userApiKey ? { "x-user-api-key": userApiKey } : {}),
        },
        body: JSON.stringify({
          brandName: logoBrandName,
          tagline: logoTagline,
          industry: logoIndustry,
          style: logoStyle,
          palette: logoPalette,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLogoUrl(data.imageUrl);
      setLogoDemoMode(!!data.demo);
      if (data.demo) {
        setLogoError("Demo modu aktif: Kendi logonuz için OpenRouter API anahtarınızı ekleyin.");
      }
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Logo oluşturulamadı");
    } finally {
      setLogoLoading(false);
    }
  };

  const handleSelectUploadedImage = (id: string) => {
    setSelectedUploadedImageId(id);
    const selectedImg = uploadedImages.find((img) => img.id === id);
    if (selectedImg && useUploadedImage) {
      setEnhancedImageUrl(selectedImg.previewUrl);
      setImageUrl(selectedImg.previewUrl);
    }
  };

  const generateAll = async () => {
    setLoading(true);
    setError(null);
    setStep(3);

    const imagePromptText =
      imagePrompt.trim() || `${product} - ${description} reklam görseli`;

    const analysisText =
      Object.keys(imageAnalysis).length > 0
        ? `Subject: ${imageAnalysis.subject || ""}, Style: ${imageAnalysis.style || ""}, Colors: ${imageAnalysis.colors || ""}`
        : "";

    try {
      // 1) Reklam metinlerini üret
      setLoadingText("Reklam metinleri yazılıyor...");
      const copyRes = await fetch("/api/generate-ad-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userApiKey ? { "x-user-api-key": userApiKey } : {}),
        },
        body: JSON.stringify({
          product,
          description,
          targetAudience,
          platform,
          tone,
          language,
        }),
      });
      const copyData = await copyRes.json();

      if (!copyRes.ok) {
        throw new Error(copyData.error || "Reklam metinleri oluşturulamadı");
      }

      const variations = copyData.variations || [];
      if (variations.length === 0) {
        throw new Error("Metin varyasyonları alınamadı. Lütfen tekrar deneyin.");
      }

      setVariations(variations);
      setHashtags(copyData.hashtags || "");
      setSelectedVariationIndex(0);

      // 2) Görsel — zaten geliştirilen görsel varsa kullan
      if (enhancedImageUrl && useUploadedImage) {
        setImageUrl(enhancedImageUrl);
        setIsDemoMode(!!copyData.demo);
        if (copyData.demo) {
          setError("Demo modu: Gerçek metinler için ayarlardan API anahtarı ekleyin.");
        }
      } else {
        setLoadingText("AI reklam görseli oluşturuluyor... (10-30 sn)");
        try {
          const imageRes = await fetch("/api/generate-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(userApiKey ? { "x-user-api-key": userApiKey } : {}),
            },
            body: JSON.stringify({
              prompt: imagePromptText,
              aspectRatio,
              referenceStyle: selectedInspirationStyle || "",
              uploadedImageAnalysis: analysisText,
            }),
          });
          const imageData = await imageRes.json();

          if (!imageRes.ok) {
            // Görsel üretilemedi — fallback varsa onu kullan, takılma
            const fallback = imageData.fallbackImageUrl;
            if (fallback) {
              setImageUrl(fallback);
              setError(
                `Görsel üretilemedi (${imageData.error || "API hatası"}). Demo görsel gösteriliyor.`
              );
            } else {
              setError(
                `Görsel oluşturulamadı: ${imageData.error || "Bilinmeyen hata"}. Metinler hazır, görseli daha sonra yeniden deneyebilirsiniz.`
              );
            }
          } else {
            setImageUrl(imageData.imageUrl);
            setIsDemoMode(!!imageData.demo || !!copyData.demo);
            if (imageData.demo || copyData.demo) {
              setError(
                "Demo modu: Gerçek görsel ve metinler için ayarlardan OpenRouter API anahtarı ekleyin."
              );
            }
          }
        } catch (imgErr) {
          // Görsel hatası tüm akışı durdurmasın
          setError(
            `Görsel yüklenemedi: ${imgErr instanceof Error ? imgErr.message : "Bağlantı hatası"}. Metinler hazır.`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "İçerik oluşturulamadı. Lütfen tekrar deneyin.");
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
        headers: {
          "Content-Type": "application/json",
          ...(userApiKey ? { "x-user-api-key": userApiKey } : {}),
        },
        body: JSON.stringify({
          prompt: imagePromptText,
          aspectRatio,
          referenceStyle: selectedInspirationStyle || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.imageUrl);
      setUseUploadedImage(false);
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
    setLoadingText("Yeni varyasyonlar yazılıyor...");
    try {
      const res = await fetch("/api/generate-ad-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userApiKey ? { "x-user-api-key": userApiKey } : {}),
        },
        body: JSON.stringify({
          product,
          description,
          targetAudience,
          platform,
          tone,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVariations(data.variations || []);
      setHashtags(data.hashtags || "");
      setSelectedVariationIndex(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Reklam metinleri oluşturulamadı"
      );
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let targetWidth = img.width;
      let targetHeight = img.height;
      let cropWidth = img.width;
      let cropHeight = img.height;
      let startX = 0;
      let startY = 0;

      if (aspectRatio === "1:1") {
        const size = Math.min(img.width, img.height);
        cropWidth = size;
        cropHeight = size;
        startX = (img.width - size) / 2;
        startY = (img.height - size) / 2;
        targetWidth = 1080;
        targetHeight = 1080;
      } else if (aspectRatio === "9:16") {
        const targetRatio = 9 / 16;
        const currentRatio = img.width / img.height;
        if (currentRatio > targetRatio) {
          cropWidth = img.height * targetRatio;
          startX = (img.width - cropWidth) / 2;
        } else {
          cropHeight = img.width / targetRatio;
          startY = (img.height - cropHeight) / 2;
        }
        targetWidth = 1080;
        targetHeight = 1920;
      } else if (aspectRatio === "16:9") {
        const targetRatio = 16 / 9;
        const currentRatio = img.width / img.height;
        if (currentRatio > targetRatio) {
          cropWidth = img.height * targetRatio;
          startX = (img.width - cropWidth) / 2;
        } else {
          cropHeight = img.width / targetRatio;
          startY = (img.height - cropHeight) / 2;
        }
        targetWidth = 1920;
        targetHeight = 1080;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
        try {
          const croppedUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = croppedUrl;
          link.download = `reklam-gorseli-${aspectRatio.replace(":", "-")}-${product
            .toLowerCase()
            .replace(/[^a-z0-9ğüşöçı]+/gi, "-")
            .substring(0, 30)}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          // Fallback if tainted
          const link = document.createElement("a");
          link.href = imageUrl;
          link.download = `reklam-gorseli-${product}.png`;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    };
    img.onerror = () => {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `reklam-gorseli-${product}.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const downloadLogo = () => {
    if (!logoUrl) return;
    const link = document.createElement("a");
    link.href = logoUrl;
    link.download = `logo-${logoBrandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadCampaignPackage = () => {
    if (!variations.length) return;
    
    let content = `=== REKLAM KAMPANYASI RAPORU ===\n`;
    content += `Ürün: ${product}\n`;
    content += `Açıklama: ${description}\n`;
    content += `Hedef Kitle: ${targetAudience || "Belirtilmedi"}\n`;
    content += `Platform: ${platform} | Ton: ${tone} | Dil: ${language}\n`;
    content += `Görsel URL: ${imageUrl || "Oluşturulmadı"}\n\n`;
    
    variations.forEach((v, idx) => {
      content += `--- Varyasyon ${idx + 1} (${v.strategy}) ---\n`;
      content += `Başlık: ${v.headline}\n`;
      content += `Metin: ${v.body}\n`;
      content += `CTA: ${v.cta}\n\n`;
    });
    
    content += `Hashtagler:\n${hashtags}\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${product.toLowerCase().replace(/\s+/g, "-")}-kampanya-paketi.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setStep(1);
    setProduct("");
    setDescription("");
    setTargetAudience("");
    setImagePrompt("");
    setImageUrl(null);
    setVariations([]);
    setHashtags("");
    setError(null);
    // Reset new state
    setUploadedImages([]);
    setSelectedUploadedImageId(null);
    setEnhancedImageUrl(null);
    setImageAnalysis({});
    setEnhanceError(null);
    setUseUploadedImage(false);
    setSelectedInspirationStyle(null);

    // Reset logo state
    setLogoBrandName("");
    setLogoTagline("");
    setLogoIndustry("");
    setLogoStyle("minimalist");
    setLogoPalette("blue");
    setLogoUrl(null);
    setLogoLoading(false);
    setLogoError(null);
  };

  const platforms = ["Instagram", "Facebook", "LinkedIn", "Google", "TikTok"];
  const tones = ["Profesyonel", "Samimi", "Eğlenceli", "Lüks", "Acil (FOMO)"];
  const languages = ["Türkçe", "İngilizce", "Almanca", "Fransızca", "İspanyolca"];
  const aspectRatios = [
    { label: "1:1 Kare (Post)", value: "1:1" },
    { label: "9:16 Dikey (Story/TikTok)", value: "9:16" },
    { label: "16:9 Yatay (Banner)", value: "16:9" },
  ];

  const steps = [
    { num: 1, title: "Detaylar", icon: "📦" },
    { num: 2, title: "Platform", icon: "🎨" },
    { num: 3, title: "Sonuçlar", icon: "✨" },
  ];

  const activeVariation = variations[selectedVariationIndex];

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#0c101b]/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Reklam Oluşturucu 2.0
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                AI Destekli Akıllı Kampanya Mimarı
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl border transition-all ${
                showSettings 
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-400" 
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title="Ayarlar & API Anahtarı"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={resetAll}
              className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yeni Proje
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className="bg-[#0c101b]/80 border-b border-slate-800/80 sticky top-[73px] z-40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 flex gap-6">
          <button
            onClick={() => setActiveTab("ad")}
            className={`py-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "ad"
                ? "border-indigo-500 text-slate-100"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📢</span> Reklam Oluşturucu
          </button>
          <button
            onClick={() => setActiveTab("logo")}
            className={`py-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "logo"
                ? "border-indigo-500 text-slate-100"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🎯</span> Logo Oluşturucu
          </button>
        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === "ad" && (
            <div className="space-y-6">
          
          {/* Settings panel */}
          {showSettings && (
            <div className="glass-card rounded-2xl p-6 border border-indigo-500/20 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>⚙️</span> API ve Mockup Ayarları
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-200">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">OpenRouter API Anahtarı</label>
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={handleApiKeyChange}
                    placeholder="sk-or-v1-..."
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    API anahtarınız tarayıcınızda (localStorage) şifreli şekilde saklanır, sunucuya kaydedilmez. Anahtar girilmezse demo modunda çalışır.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mockup Profil Adı</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={handleProfileNameChange}
                    placeholder="Örn: Butiğim veya Kahve Dünyası"
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wizard Steps */}
          <div className="glass-card rounded-3xl p-8 space-y-6">
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              {steps.map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1 last:flex-initial">
                  <button
                    disabled={s.num > step && !(s.num === 2 && canProceedStep1)}
                    onClick={() => setStep(s.num as Step)}
                    className="flex items-center gap-2.5 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                        s.num === step
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105"
                          : s.num < step
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-900 text-slate-500 border border-slate-800"
                      }`}
                    >
                      {s.num < step ? "✓" : s.num}
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Adım 0{s.num}</span>
                      <span className={`text-xs font-bold ${s.num === step ? "text-slate-100" : "text-slate-400"}`}>
                        {s.title}
                      </span>
                    </div>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`h-[1px] flex-1 mx-4 ${idx + 1 < step ? "bg-emerald-500/40" : "bg-slate-800"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                <span className="text-amber-400 mt-0.5">⚠️</span>
                <div className="text-xs text-amber-200 leading-relaxed flex-1">{error}</div>
                <button onClick={() => setError(null)} className="text-amber-400 hover:text-amber-200">✕</button>
              </div>
            )}

            {/* ============ STEP 1: Product Details ============ */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-100">Kampanya Detayları</h2>
                  <p className="text-xs text-slate-400">Ürününüzün veya hizmetinizin temel niteliklerini belirleyin</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Ürün / Hizmet Adı <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {product.length}/80
                      </span>
                    </div>
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      maxLength={80}
                      placeholder="Örn: Akıllı Aromaterapi Difüzörü"
                      className="w-full px-4 py-3 rounded-xl text-sm glass-input outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Ürün Özellikleri & Faydaları <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {description.length}/600
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={600}
                      placeholder="Ürününüz ne işe yarar? Rakiplerinden ayıran en çarpıcı 2-3 faydasını buraya yazın..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm glass-input outline-none resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Hedef Kitle <span className="text-slate-500">(İsteğe Bağlı)</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {targetAudience.length}/150
                      </span>
                    </div>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      maxLength={150}
                      placeholder="Örn: Ev ofis çalışanları, yoga severler, 25-45 yaş arası kadınlar"
                      className="w-full px-4 py-3 rounded-xl text-sm glass-input outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dil</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm glass-input outline-none"
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang} className="bg-slate-900 text-slate-100">{lang}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Metin Tonu</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm glass-input outline-none"
                      >
                        {tones.map((t) => (
                          <option key={t} value={t} className="bg-slate-900 text-slate-100">{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ===== Görsel Yükleme Bölümü ===== */}
                <div className="pt-2 border-t border-slate-800/80 space-y-4">
                  {/* Başlık */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Ürün Görselleri <span className="text-slate-500 font-normal">(İsteğe Bağlı)</span></p>
                      <p className="text-[10px] text-slate-500">En fazla 5 görsel ekleyin · AI hepsini analiz eder</p>
                    </div>
                  </div>

                  <ImageUploader
                    images={uploadedImages}
                    onImagesChange={setUploadedImages}
                    selectedImageId={selectedUploadedImageId}
                    onSelectImage={handleSelectUploadedImage}
                    maxImages={5}
                    minImages={1}
                  />

                  {/* Görsel işlem butonları — yalnızca görsel yüklendiyse göster */}
                  {uploadedImages.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {/* Doğrudan kullan */}
                        <button
                          type="button"
                          onClick={() => {
                            const img = uploadedImages.find((i) => i.id === selectedUploadedImageId) || uploadedImages[0];
                            if (img) {
                              setUseUploadedImage(true);
                              setEnhancedImageUrl(img.previewUrl);
                              setImageUrl(img.previewUrl);
                            }
                          }}
                          className={`flex-1 py-2.5 font-semibold rounded-xl border transition-all text-xs flex items-center justify-center gap-1.5 ${
                            useUploadedImage && !enhancedImageUrl?.startsWith("http")
                              ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {useUploadedImage && !enhancedImageUrl?.startsWith("http") ? "✓ Seçildi" : "Doğrudan Kullan"}
                        </button>

                        {/* AI ile geliştir */}
                        <button
                          type="button"
                          onClick={handleEnhanceImage}
                          disabled={isEnhancing}
                          className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200 flex items-center justify-center gap-1.5 text-xs"
                        >
                          {isEnhancing ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              {uploadedImages.length > 1 ? `${uploadedImages.length} görsel işleniyor...` : "Geliştiriliyor..."}
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              AI ile Geliştir {uploadedImages.length > 1 ? `(${uploadedImages.length} görsel)` : ""}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Enhance Error */}
                      {enhanceError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-[10px] text-red-300 font-semibold">Görsel Geliştirme Hatası</p>
                            <p className="text-[10px] text-red-300/80 mt-0.5">{enhanceError}</p>
                          </div>
                          <button onClick={() => setEnhanceError(null)} className="text-red-400 hover:text-red-300 text-xs shrink-0">✕</button>
                        </div>
                      )}

                      {/* Enhanced Result */}
                      {enhancedImageUrl && (
                        <div ref={enhanceResultRef} className="space-y-2 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Görsel Hazır!
                            </span>
                            <span className="text-[9px] text-slate-500">Bu görsel kampanyanızda kullanılacak</span>
                          </div>
                          <div className="rounded-xl overflow-hidden border border-emerald-500/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={enhancedImageUrl}
                              alt="AI Geliştirilmiş Görsel"
                              className="w-full max-h-48 object-cover"
                            />
                          </div>
                          {/* Analysis chips */}
                          {Object.keys(imageAnalysis).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {imageAnalysis.style && (
                                <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                                  🎨 {imageAnalysis.style}
                                </span>
                              )}
                              {imageAnalysis.mood && (
                                <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                                  💫 {imageAnalysis.mood}
                                </span>
                              )}
                              {imageAnalysis.colors && (
                                <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                                  🌈 {imageAnalysis.colors}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* ===== Görsel Yükleme Bölümü Sonu ===== */}

                <div className="pt-4">
                  <button
                    disabled={!canProceedStep1}
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    Devam Et
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ============ STEP 2: Platform & Dimensions ============ */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-100">Platform ve Görsel Ayarları</h2>
                  <p className="text-xs text-slate-400">Reklam kanallarınızı, formatı ve tasarım stilini özelleştirin</p>
                </div>

                <div className="space-y-4">
                  {/* Platform Selection cards */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Reklam Platformu</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {platforms.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPlatform(p)}
                          className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-all text-center flex items-center justify-center gap-2 ${
                            platform === p
                              ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/10"
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          {p === "Instagram" && "📸"}
                          {p === "Facebook" && "👥"}
                          {p === "LinkedIn" && "💼"}
                          {p === "Google" && "🔍"}
                          {p === "TikTok" && "🎵"}
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect ratio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Görsel Formatı</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {aspectRatios.map((ratio) => (
                        <button
                          key={ratio.value}
                          type="button"
                          onClick={() => setAspectRatio(ratio.value)}
                          className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                            aspectRatio === ratio.value
                              ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span className="text-[10px] text-slate-400">{ratio.label}</span>
                          <span className="font-bold">{ratio.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ===== NEW: Inspiration Gallery ===== */}
                  <div className="border-t border-slate-800/80 pt-4">
                    <InspirationGallery
                      selectedStyleId={selectedInspirationStyle}
                      onSelectStyle={setSelectedInspirationStyle}
                    />
                  </div>
                  {/* ===== END: Inspiration Gallery ===== */}

                  {/* Custom Image Prompt — only if no uploaded & enhanced image */}
                  {!enhancedImageUrl && (
                    <div className="border-t border-slate-800/80 pt-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300">
                          Görsel Detayları <span className="text-slate-500">(İsteğe Bağlı)</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {imagePrompt.length}/300
                        </span>
                      </div>
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        maxLength={300}
                        placeholder="AI'ın üreteceği görselin sahnesini detaylandırın. Örn: Modern minimalist bir yatak odasında, komodin üstünde hafif buhar çıkartan difüzör, arkada yumuşak bir ışık..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl text-sm glass-input outline-none resize-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        💡 Boş bırakırsanız, ürün bilgilerinize göre reklam temalı bir görsel otomatik hayal edilir.
                      </span>
                    </div>
                  )}

                  {/* Enhanced image summary banner */}
                  {enhancedImageUrl && (
                    <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={enhancedImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-violet-500/30" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-violet-300">AI Geliştirilmiş Görsel Hazır ✓</p>
                        <p className="text-[10px] text-violet-200/60 truncate">Bu görsel kampanyanızda kullanılacak</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEnhancedImageUrl(null); setUseUploadedImage(false); setImageUrl(null); }}
                        className="text-[10px] text-slate-500 hover:text-slate-300 shrink-0"
                      >
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={generateAll}
                    className="flex-[2] py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Reklam Kampanyasını Oluştur
                  </button>
                </div>
              </div>
            )}

            {/* ============ STEP 3: Results Panel ============ */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{loadingText}</h4>
                      <p className="text-xs text-slate-400 mt-1">Bu işlem biraz sürebilir, lütfen sayfayı kapatmayın.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                          <span>✨</span> Sonuçlar ve Metin Seçenekleri
                        </h2>
                        <p className="text-xs text-slate-400">AI sizin için 3 farklı stratejide metin üretti.</p>
                      </div>
                      
                      <button
                        onClick={regenerateCopy}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
                      >
                        Metinleri Yeniden Yaz
                      </button>
                    </div>

                    {/* Variations Tab selectors */}
                    {variations.length > 0 && (
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 overflow-x-auto">
                        {variations.map((v, index) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariationIndex(index)}
                            className={`flex-1 min-w-[100px] text-center py-2.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                              selectedVariationIndex === index
                                ? "bg-indigo-600 text-white shadow-md"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                            }`}
                          >
                            {v.strategy}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Active Variation View */}
                    {activeVariation ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-3">
                          
                          {/* Headline block */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                                Başlık / Kanca (Headline)
                              </span>
                              <button
                                onClick={() => copyToClipboard(activeVariation.headline, "headline")}
                                className="text-[10px] text-slate-400 hover:text-slate-200"
                              >
                                {copiedIndex === "headline" ? "✓ Kopyalandı" : "Kopyala"}
                              </button>
                            </div>
                            <h3 className="font-bold text-slate-100 text-sm leading-relaxed">
                              {activeVariation.headline}
                            </h3>
                          </div>

                          <hr className="border-slate-800/80" />

                          {/* Body block */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Gövde Metni (Caption Body)
                              </span>
                              <button
                                onClick={() => copyToClipboard(activeVariation.body, "body")}
                                className="text-[10px] text-slate-400 hover:text-slate-200"
                              >
                                {copiedIndex === "body" ? "✓ Kopyalandı" : "Kopyala"}
                              </button>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-light">
                              {activeVariation.body}
                            </p>
                          </div>

                          <hr className="border-slate-800/80" />

                          {/* CTA Block */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                                CTA: {activeVariation.cta}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hashtags display */}
                        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                          <p className="text-xs text-blue-400 font-mono truncate">{hashtags}</p>
                          <button
                            onClick={() => copyToClipboard(hashtags, "hashtags")}
                            className="text-[10px] text-slate-400 hover:text-slate-200 shrink-0 ml-2"
                          >
                            {copiedIndex === "hashtags" ? "✓" : "Kopyala"}
                          </button>
                        </div>

                        {/* Copy & Export Actions */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            onClick={() => {
                              const fullText = `${activeVariation.headline}\n\n${activeVariation.body}\n\nEylem Çağrısı: ${activeVariation.cta}\n\n${hashtags}`;
                              copyToClipboard(fullText, "all");
                            }}
                            className="py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            {copiedIndex === "all" ? "✓ Kopyalandı!" : "Aktif Metni Kopyala"}
                          </button>
                          <button
                            onClick={downloadCampaignPackage}
                            className="py-3 bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            Kampanya Paketini İndir (.TXT)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        Metin varyasyonları bulunamadı.
                      </div>
                    )}

                    {/* Image Settings action block */}
                    {imageUrl && (
                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Görsel Ayarları</span>
                        <div className="flex gap-2">
                          <button
                            onClick={regenerateImage}
                            className="px-3 py-1.5 border border-slate-850 bg-slate-900 text-slate-300 hover:bg-slate-800 text-[10px] font-bold rounded-lg transition-colors"
                          >
                            Görseli Yeniden Üret
                          </button>
                          <button
                            onClick={downloadImage}
                            className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold rounded-lg transition-colors"
                          >
                            Görseli İndir (PNG)
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-6 border-t border-slate-800">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-800 transition-all text-xs"
                      >
                        Ayarlara Dön
                      </button>
                      <button
                        onClick={resetAll}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl shadow-lg transition-all text-xs"
                      >
                        Yeni Reklam Oluştur
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

          {activeTab === "logo" && (
            <div className="glass-card rounded-3xl p-8 space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-100">Logo Tasarım Detayları</h2>
                <p className="text-xs text-slate-400">Markanız için vektörel ve modern bir logo tasarlayın</p>
              </div>

              {logoError && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">⚠️</span>
                  <div className="text-xs text-amber-200 leading-relaxed flex-1">{logoError}</div>
                  <button onClick={() => setLogoError(null)} className="text-amber-400 hover:text-amber-200">✕</button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Marka / Şirket Adı <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {logoBrandName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    value={logoBrandName}
                    onChange={(e) => setLogoBrandName(e.target.value)}
                    maxLength={50}
                    placeholder="Örn: Kahve Dünyası"
                    className="w-full px-4 py-3 rounded-xl text-sm glass-input outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Slogan / Alt Başlık <span className="text-slate-500">(İsteğe Bağlı)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {logoTagline.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={logoTagline}
                    onChange={(e) => setLogoTagline(e.target.value)}
                    maxLength={100}
                    placeholder="Örn: Taze Çekilmiş Lezzet"
                    className="w-full px-4 py-3 rounded-xl text-sm glass-input outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Sektör <span className="text-slate-500">(İsteğe Bağlı)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {logoIndustry.length}/80
                    </span>
                  </div>
                  <input
                    type="text"
                    value={logoIndustry}
                    onChange={(e) => setLogoIndustry(e.target.value)}
                    maxLength={80}
                    placeholder="Örn: Gıda / Kafe"
                    className="w-full px-4 py-3 rounded-xl text-sm glass-input outline-none font-medium"
                  />
                </div>

                {/* Logo Style Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Tasarım Stili</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: "minimalist", label: "Minimalist", icon: "⬜" },
                      { id: "luxury", label: "Lüks / Premium", icon: "✨" },
                      { id: "geometric", label: "Geometrik", icon: "📐" },
                      { id: "letterpress", label: "Retro / Vintage", icon: "✉️" },
                      { id: "mascot", label: "Maskot / Çizim", icon: "🦊" },
                      { id: "futuristic", label: "Fütüristik / Tech", icon: "💻" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLogoStyle(item.id)}
                        className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                          logoStyle === item.id
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/10"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-lg leading-none">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Color Palette */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Renk Paleti</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: "blue", label: "Kurumsal Mavi", colors: "bg-blue-500" },
                      { id: "premium", label: "Altın & Siyah", colors: "bg-amber-400" },
                      { id: "vibrant", label: "Canlı / Enerjik", colors: "bg-red-500" },
                      { id: "pastel", label: "Soft Pastel", colors: "bg-pink-300" },
                      { id: "monochrome", label: "Siyah & Beyaz", colors: "bg-slate-500" },
                      { id: "nature", label: "Doğa / Toprak", colors: "bg-green-500" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLogoPalette(item.id)}
                        className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-all text-center flex items-center justify-between gap-2 ${
                          logoPalette === item.id
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/10"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className={`w-3.5 h-3.5 rounded-full ${item.colors} border border-white/20`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  disabled={logoLoading || !logoBrandName.trim()}
                  onClick={generateLogo}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {logoLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logo Çiziliyor...
                    </>
                  ) : (
                    <>
                      <span>🎨</span> Logo Tasarımını Başlat
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Mobile Mockup (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          {activeTab === "ad" && (
            <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col items-center justify-center">
              
              {/* Live mockup customizer panel */}
              <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simülatör Canlı Önizleme</span>
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                  {platforms.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                        platform === p 
                          ? "bg-indigo-600 text-white shadow" 
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {p.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <AdMockup
                platform={platform}
                headline={activeVariation ? activeVariation.headline : product}
                body={activeVariation ? activeVariation.body : description}
                cta={activeVariation ? activeVariation.cta : ""}
                hashtags={hashtags}
                imageUrl={imageUrl}
                profileName={profileName || product || "Markanız"}
                aspectRatio={aspectRatio}
              />

              {/* Bottom info helper */}
              <p className="text-[10px] text-slate-500 mt-4 text-center">
                💡 Soldaki formda yaptığınız tüm değişiklikler ve seçtiğiniz reklam metni varyasyonu anında simülatörde güncellenir.
              </p>
            </div>
          )}

          {activeTab === "logo" && (
            <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col items-center justify-center space-y-6 animate-fadeIn">
              
              <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo Önizleme Modu</span>
                <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                  {(["dark", "light", "transparent"] as const).map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setLogoPreviewBg(bg)}
                      className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all uppercase ${
                        logoPreviewBg === bg 
                          ? "bg-indigo-600 text-white shadow" 
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {bg === "dark" && "Koyu"}
                      {bg === "light" && "Açık"}
                      {bg === "transparent" && "Şeffaf"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Main Box */}
              <div className={`w-full aspect-square rounded-2xl border flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                logoPreviewBg === "dark" ? "bg-slate-950 border-slate-800 text-white" :
                logoPreviewBg === "light" ? "bg-white border-slate-200 text-slate-900" :
                "bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950/60 border-dashed border-slate-800"
              }`}>
                {logoUrl ? (
                  <div className="relative group p-8 w-full h-full flex flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Tasarlanan Logo"
                      className="max-w-[70%] max-h-[70%] object-contain"
                    />
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-xs font-bold font-mono tracking-wider">{logoBrandName}</p>
                      {logoTagline && <p className="text-[9px] opacity-60 font-light mt-0.5">{logoTagline}</p>}
                    </div>
                  </div>
                ) : logoLoading ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-500 animate-pulse">Logo hayal ediliyor...</p>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500 flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🎯</span>
                    <span className="text-xs font-medium">Soldaki formu doldurup logoyu oluşturun</span>
                  </div>
                )}
              </div>

              {logoUrl && (
                <div className="w-full space-y-5 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Logo Dosya İşlemleri</span>
                    <button
                      onClick={downloadLogo}
                      className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold rounded-xl transition-all"
                    >
                      Logoyu İndir (PNG)
                    </button>
                  </div>

                  {/* PREMIUM MOCKUPS SECTION */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marka Uygulama Simülasyonları</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Card Mockup */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between aspect-[1.6/1] shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full" />
                        <div className="flex items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoUrl} alt="" className="w-6 h-6 object-contain" />
                          <div className="leading-none">
                            <span className="text-[9px] font-bold block text-white">{logoBrandName}</span>
                            {logoTagline && <span className="text-[7px] text-slate-400 font-light block mt-0.5">{logoTagline}</span>}
                          </div>
                        </div>
                        <div className="text-[7px] text-slate-500 space-y-0.5">
                          <p className="font-semibold text-slate-400">Kaan Güçtaş</p>
                          <p>Genel Müdür</p>
                          <p className="font-mono mt-1 text-slate-400">info@markaniz.com</p>
                        </div>
                        <span className="absolute top-1 left-2 text-[7px] text-slate-600 font-semibold tracking-widest uppercase">Kartvizit</span>
                      </div>

                      {/* T-Shirt Mockup */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center justify-center aspect-[1.6/1] shadow-lg relative overflow-hidden group">
                        <svg className="w-10 h-10 text-slate-700 absolute" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2c1.1 0 2 .9 2 2h3.5c.3 0 .5.2.5.5v3.6c2-.3 3.5-1.5 3.5-1.5s-.6 2.5-3.5 3.4V20c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-10c-2.9-.9-3.5-3.4-3.5-3.4s1.5 1.2 3.5 1.5V4.5c0-.3.2-.5.5-.5H10c0-1.1.9-2 2-2z" />
                        </svg>
                        <div className="z-10 mt-1 flex flex-col items-center justify-center scale-90 group-hover:scale-95 transition-transform">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoUrl} alt="" className="w-5 h-5 object-contain" />
                          <span className="text-[6px] font-extrabold text-slate-400 mt-0.5 uppercase tracking-wider">{logoBrandName}</span>
                        </div>
                        <span className="absolute top-1 left-2 text-[7px] text-slate-600 font-semibold tracking-widest uppercase">T-Shirt</span>
                      </div>
                    </div>

                    {/* Website Header Mockup */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative group">
                      {/* Browser bar */}
                      <div className="bg-slate-950/80 px-3 py-1 flex items-center justify-between border-b border-slate-850 text-[7px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                          <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded ml-2 font-mono">www.{logoBrandName.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com</span>
                        </div>
                      </div>
                      {/* Web Header mock */}
                      <div className="bg-[#0b0f19] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoUrl} alt="" className="w-4 h-4 object-contain" />
                          <span className="text-[9px] font-extrabold text-white">{logoBrandName}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[8px] text-slate-400">
                          <span>Anasayfa</span>
                          <span>Ürünler</span>
                          <span>Hakkımızda</span>
                          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold">İletişim</span>
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-2 text-[6px] text-slate-600 font-semibold tracking-widest uppercase">Web Header</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto text-center py-6 border-t border-slate-900 bg-[#06080d]">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          AI Reklam Oluşturucu 2.0 &copy; 2026 · Kaan Guctas Project
        </p>
      </footer>
    </div>
  );
}

