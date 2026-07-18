"use client";

import React from "react";

export type InspirationStyle = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  previewUrl: string;
  tags: string[];
  accentColor: string;
  bgGradient: string;
};

export const INSPIRATION_STYLES: InspirationStyle[] = [
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Beyaz zemin, temiz ürün odağı, maksimum boşluk",
    emoji: "⬜",
    previewUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop&q=80",
    tags: ["Temiz", "Sade", "Lüks"],
    accentColor: "text-slate-300",
    bgGradient: "from-slate-100 to-white",
  },
  {
    id: "luxury",
    name: "Lüks / Koyu",
    description: "Siyah zemin, altın aksan, dramatik sinematik ışık",
    emoji: "✨",
    previewUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80",
    tags: ["Premium", "Koyu", "Gold"],
    accentColor: "text-amber-400",
    bgGradient: "from-amber-900/20 to-slate-950",
  },
  {
    id: "vibrant",
    name: "Canlı / Renkli",
    description: "Güçlü gradientler, doygun renkler, GenZ enerjisi",
    emoji: "🎨",
    previewUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop&q=80",
    tags: ["Enerjik", "Bold", "GenZ"],
    accentColor: "text-fuchsia-400",
    bgGradient: "from-fuchsia-900/20 to-indigo-900/20",
  },
  {
    id: "organic",
    name: "Doğal / Organik",
    description: "Keten dokusu, toprak tonlar, sürdürülebilir estetik",
    emoji: "🌿",
    previewUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&auto=format&fit=crop&q=80",
    tags: ["Doğal", "Earthy", "Eco"],
    accentColor: "text-green-400",
    bgGradient: "from-green-900/20 to-stone-900/20",
  },
  {
    id: "tech",
    name: "Teknoloji",
    description: "Koyu mavi, neon parıltı, fütüristik şekiller",
    emoji: "💻",
    previewUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80",
    tags: ["Futurist", "Neon", "Tech"],
    accentColor: "text-cyan-400",
    bgGradient: "from-cyan-900/20 to-blue-950",
  },
  {
    id: "retro",
    name: "Retro / Vintage",
    description: "Sepia tonlar, film grenli, 70'ler nostaljik estetik",
    emoji: "📷",
    previewUrl: "https://images.unsplash.com/photo-1525338078858-d762b5e32f2c?w=400&auto=format&fit=crop&q=80",
    tags: ["Vintage", "Film", "Nostaljik"],
    accentColor: "text-amber-500",
    bgGradient: "from-amber-900/20 to-orange-950",
  },
  {
    id: "cinematic",
    name: "Sinematik",
    description: "Film kadrajı, dramatik ışıklandırma, derin atmosfer",
    emoji: "🎬",
    previewUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80",
    tags: ["Film", "Dramatik", "Atmosferik"],
    accentColor: "text-purple-400",
    bgGradient: "from-purple-900/20 to-slate-950",
  },
  {
    id: "pastel",
    name: "Pastel / Soft",
    description: "Açık pastel renkler, havadar arka plan, yumuşak ışık",
    emoji: "🌸",
    previewUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80",
    tags: ["Soft", "Pastel", "Feminine"],
    accentColor: "text-pink-400",
    bgGradient: "from-pink-900/20 to-rose-950/20",
  },
  {
    id: "bold",
    name: "Bold / Grafik",
    description: "Yüksek kontrast, güçlü siyah-beyaz, İsviçre tasarım etkisi",
    emoji: "⚡",
    previewUrl: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400&auto=format&fit=crop&q=80",
    tags: ["Kontrast", "Graphic", "Impact"],
    accentColor: "text-slate-100",
    bgGradient: "from-slate-800 to-slate-950",
  },
];

type InspirationGalleryProps = {
  selectedStyleId: string | null;
  onSelectStyle: (id: string | null) => void;
};

export default function InspirationGallery({
  selectedStyleId,
  onSelectStyle,
}: InspirationGalleryProps) {
  const handleSelect = (id: string) => {
    onSelectStyle(selectedStyleId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            Tasarım İlhamı Galerisi
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Bir stil seç → AI reklamını o stile göre oluşturur
          </p>
        </div>
        {selectedStyleId && (
          <button
            type="button"
            onClick={() => onSelectStyle(null)}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors underline"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {INSPIRATION_STYLES.map((style) => {
          const isSelected = selectedStyleId === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => handleSelect(style.id)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 group text-left ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]"
                  : "border-slate-800 hover:border-slate-600"
              }`}
            >
              {/* Preview Image */}
              <div className="relative h-20 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={style.previewUrl}
                  alt={style.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${style.bgGradient} opacity-60`} />

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Emoji badge */}
                <div className="absolute top-1.5 left-1.5 text-base leading-none">{style.emoji}</div>
              </div>

              {/* Info */}
              <div className="p-2 bg-slate-950/90 border-t border-slate-800">
                <p className={`text-[10px] font-bold leading-tight ${isSelected ? "text-indigo-300" : "text-slate-300"}`}>
                  {style.name}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {style.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected style description */}
      {selectedStyleId && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5 animate-fadeIn">
          <span className="text-lg leading-none mt-0.5">
            {INSPIRATION_STYLES.find((s) => s.id === selectedStyleId)?.emoji}
          </span>
          <div>
            <p className="text-[11px] font-bold text-indigo-300">
              {INSPIRATION_STYLES.find((s) => s.id === selectedStyleId)?.name} Stili Seçildi
            </p>
            <p className="text-[10px] text-indigo-200/70 mt-0.5">
              {INSPIRATION_STYLES.find((s) => s.id === selectedStyleId)?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
