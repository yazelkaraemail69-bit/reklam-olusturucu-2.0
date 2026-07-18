"use client";

import React from "react";

type AdMockupProps = {
  platform: string;
  headline: string;
  body: string;
  cta: string;
  hashtags: string;
  imageUrl: string | null;
  profileName?: string;
  profileImage?: string;
  aspectRatio?: string;
};

export default function AdMockup({
  platform,
  headline,
  body,
  cta,
  hashtags,
  imageUrl,
  profileName = "Markanız",
  profileImage,
  aspectRatio = "1:1",
}: AdMockupProps) {
  // Safe defaults
  const displayHeadline = headline || "Dikkat Çekici Bir Başlık";
  const displayBody = body || "Reklamınızın detayları burada görünecektir. Ürün veya hizmetinizin en önemli özelliklerini ve sunduğu faydaları buraya yazabilirsiniz.";
  const displayCta = cta || "Daha Fazla Bilgi";
  const displayHashtags = hashtags || "#kalite #yenilik #reklam";
  const defaultProfilePic = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    profileName
  )}&backgroundColor=3b82f6,8b5cf6&fontFamily=Arial`;

  const finalProfileImage = profileImage || defaultProfilePic;

  // Aspect ratio helper CSS classes for wrapper
  const getAspectClass = () => {
    if (aspectRatio === "9:16") return "aspect-[9/16]";
    if (aspectRatio === "16:9") return "aspect-[16/9]";
    return "aspect-square"; // 1:1
  };

  const renderMockup = () => {
    switch (platform) {
      case "Instagram":
        return (
          <div className="w-full max-w-sm mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={finalProfileImage}
                  alt={profileName}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-100">{profileName}</span>
                  <span className="text-[10px] text-slate-400">Sponsorlu</span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>

            {/* Post Image Container */}
            <div className={`relative w-full bg-slate-950 overflow-hidden flex items-center justify-center ${getAspectClass()}`}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Instagram Reklam Görseli"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <svg className="w-12 h-12 text-slate-700 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">Görsel Bekleniyor...</span>
                </div>
              )}
            </div>

            {/* Instagram CTA Bar */}
            <div className="bg-slate-950/70 border-b border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
                {displayCta}
              </span>
              <span className="text-slate-400 hover:text-white cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            {/* Post Action Buttons */}
            <div className="flex items-center justify-between p-3 text-slate-300">
              <div className="flex items-center gap-4">
                <button className="hover:text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="hover:text-slate-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                <button className="hover:text-slate-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.908-2.454a1 1 0 00.548-.894M12 6.5l.01-.01M13.59 13.25l-4.908 2.454a1 1 0 01-1.096-.108l.01.01" />
                  </svg>
                </button>
              </div>
              <button className="hover:text-slate-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            {/* Caption & Comments */}
            <div className="px-3 pb-4 text-xs space-y-1">
              <p className="font-bold text-slate-100">1,248 beğenme</p>
              <div className="leading-relaxed">
                <span className="font-bold text-slate-100 mr-1.5">{profileName}</span>
                <span className="text-slate-200 font-semibold">{displayHeadline}</span>
                <p className="text-slate-300 mt-1 whitespace-pre-wrap">{displayBody}</p>
                <p className="text-blue-400 mt-1 cursor-pointer font-medium">{displayHashtags}</p>
              </div>
            </div>
          </div>
        );

      case "Facebook":
        return (
          <div className="w-full max-w-sm mx-auto bg-[#18191a] border border-[#2f3031] rounded-2xl overflow-hidden shadow-2xl text-slate-200">
            {/* FB Header */}
            <div className="p-3.5 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={finalProfileImage}
                alt={profileName}
                className="w-10 h-10 rounded-full border border-slate-700 object-cover"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-100">{profileName}</span>
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#b0b3b8]">
                  <span>Sponsorlu</span>
                  <span>·</span>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* FB Caption */}
            <div className="px-3.5 pb-2 text-xs leading-relaxed">
              <p className="text-slate-200 font-semibold mb-1">{displayHeadline}</p>
              <p className="text-slate-300 whitespace-pre-wrap">{displayBody}</p>
              <p className="text-[#4599ff] mt-1 cursor-pointer">{displayHashtags}</p>
            </div>

            {/* FB Image */}
            <div className={`relative w-full bg-black overflow-hidden flex items-center justify-center ${getAspectClass()}`}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Facebook Reklam Görseli"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[#242526] flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <span className="text-xs">Görsel Bekleniyor...</span>
                </div>
              )}
            </div>

            {/* FB Bottom Ad Card */}
            <div className="bg-[#242526] p-3 flex items-center justify-between border-t border-[#2f3031]">
              <div className="flex flex-col gap-0.5 max-w-[70%]">
                <span className="text-[10px] text-[#b0b3b8] uppercase tracking-wider">WWW.LINKINIZ.COM</span>
                <span className="text-xs font-bold text-slate-100 truncate">{displayHeadline}</span>
              </div>
              <button className="px-4 py-1.5 bg-[#3a3b3c] hover:bg-[#4e4f50] text-xs font-bold rounded-lg text-slate-100 shrink-0 transition-colors">
                {displayCta}
              </button>
            </div>

            {/* FB Reactions */}
            <div className="px-3.5 py-2.5 flex items-center justify-between border-t border-[#2f3031] text-[11px] text-[#b0b3b8]">
              <div className="flex items-center gap-1">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px]">👍</span>
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] -ml-2">❤️</span>
                <span>342 Beğeni</span>
              </div>
              <div className="flex items-center gap-2">
                <span>12 Paylaşım</span>
              </div>
            </div>
          </div>
        );

      case "LinkedIn":
        return (
          <div className="w-full max-w-sm mx-auto bg-[#1b1f23] border border-[#2d3237] rounded-xl overflow-hidden shadow-2xl text-[#e1e9f0]">
            {/* LinkedIn Header */}
            <div className="p-3.5 flex items-start gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={finalProfileImage}
                alt={profileName}
                className="w-11 h-11 rounded-lg border border-slate-700 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white hover:underline cursor-pointer truncate">{profileName}</span>
                </div>
                <span className="block text-[10px] text-slate-400 truncate">12,450 Takipçi</span>
                <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                  <span>Şimdi</span>
                  <span>·</span>
                  <span>Sponsorlu</span>
                  <span>·</span>
                  <span className="text-slate-300">🌐</span>
                </div>
              </div>
            </div>

            {/* LinkedIn Body */}
            <div className="px-3.5 pb-2.5 text-[11px] leading-relaxed text-slate-200">
              <p className="whitespace-pre-wrap">{displayBody}</p>
              <p className="text-blue-400 mt-1 cursor-pointer font-medium">{displayHashtags}</p>
            </div>

            {/* LinkedIn Ad Container */}
            <div className="border border-[#2d3237] mx-3.5 mb-3.5 rounded-lg overflow-hidden bg-[#22272c]">
              <div className={`relative w-full bg-slate-950 overflow-hidden flex items-center justify-center ${getAspectClass()}`}>
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="LinkedIn Reklam Görseli"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#1d2226] flex items-center justify-center text-slate-500 text-xs">
                    Görsel Bekleniyor...
                  </div>
                )}
              </div>
              <div className="p-3.5 flex items-center justify-between border-t border-[#2d3237] bg-[#22272c]">
                <div className="flex flex-col gap-0.5 max-w-[70%]">
                  <span className="text-xs font-bold text-white truncate">{displayHeadline}</span>
                  <span className="text-[10px] text-slate-400 truncate">{profileName}</span>
                </div>
                <button className="px-4 py-1.5 border border-blue-400 text-blue-400 hover:bg-blue-950/20 text-xs font-bold rounded-full transition-colors shrink-0">
                  {displayCta}
                </button>
              </div>
            </div>
          </div>
        );

      case "Google":
        return (
          <div className="w-full max-w-sm mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-slate-200">
            {/* Google Header mockup */}
            <div className="flex items-center gap-2 mb-3.5 border-b border-slate-800 pb-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Google</span>
              <span className="text-xs text-slate-400">Arama Sonucu Önizlemesi</span>
            </div>

            <div className="space-y-1.5">
              {/* URL */}
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>https://www.google.com</span>
                <span>›</span>
                <span className="truncate">{profileName.toLowerCase().replace(/\s+/g, "-")}</span>
              </div>

              {/* Title */}
              <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer leading-snug">
                {displayHeadline} | {profileName}
              </h4>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1 rounded mr-1 shrink-0 uppercase tracking-wider">Sponsorlu</span>
                {displayBody} {displayHashtags}
              </p>

              {/* CTA link preview */}
              <div className="pt-2 text-xs">
                <span className="text-blue-400 font-medium hover:underline cursor-pointer flex items-center gap-0.5">
                  ➜ {displayCta}
                </span>
              </div>
            </div>
          </div>
        );

      case "TikTok":
        return (
          <div className="w-full max-w-[280px] mx-auto aspect-[9/16] bg-black border border-slate-800 rounded-[36px] overflow-hidden shadow-2xl relative text-white">
            {/* TikTok Video/Image Background */}
            <div className="absolute inset-0 z-0 bg-[#0c0c0d] flex items-center justify-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="TikTok Reklam Görseli"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600">
                  <svg className="w-10 h-10 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px]">TikTok Görseli Bekleniyor</span>
                </div>
              )}
            </div>

            {/* Gradient Overlay for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />

            {/* Top Bar (For You tab) */}
            <div className="absolute top-4 left-0 right-0 z-20 flex justify-center gap-4 text-xs font-semibold text-slate-400">
              <span className="hover:text-white cursor-pointer">Takip Edilen</span>
              <span className="text-white border-b-2 border-white pb-1 cursor-pointer">Sizin İçin</span>
            </div>

            {/* Right Side Icons */}
            <div className="absolute right-3.5 bottom-28 z-20 flex flex-col items-center gap-4 text-xs">
              <div className="relative mb-2">
                {/* Profile Pic with red badge */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={finalProfileImage}
                  alt={profileName}
                  className="w-9 h-9 rounded-full border-2 border-white object-cover"
                />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] border border-white">+</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl">❤️</span>
                <span className="text-[9px] mt-0.5">2.4K</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl">💬</span>
                <span className="text-[9px] mt-0.5">182</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl">Bookmark</span>
                <span className="text-[9px] mt-0.5">41</span>
              </div>
            </div>

            {/* Bottom Content / Info Overlay */}
            <div className="absolute bottom-4 left-4 right-14 z-20 space-y-2">
              <div className="space-y-1">
                <h5 className="font-bold text-xs text-white">@{profileName.toLowerCase().replace(/\s+/g, "")}</h5>
                <p className="text-[10px] text-slate-200 line-clamp-3 whitespace-pre-wrap">
                  <span className="font-bold">{displayHeadline}</span> - {displayBody}
                </p>
                <p className="text-[10px] text-[#41d6db] font-medium">{displayHashtags}</p>
              </div>

              {/* TikTok Music Tag */}
              <div className="flex items-center gap-1.5 text-[9px] text-slate-300">
                <span className="animate-spin">🎵</span>
                <span className="truncate">Orijinal Ses - {profileName}</span>
              </div>

              {/* Action Button (CTA) */}
              <button className="w-full py-2 bg-[#ff0050] hover:bg-[#e60048] text-white text-[10px] font-bold rounded-md shadow-lg transition-colors flex items-center justify-center gap-1 uppercase tracking-wider">
                <span>{displayCta}</span>
                <span className="text-xs">➜</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[450px]">
      <div className="w-full flex items-center justify-center mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
          {platform} Canlı Önizleme
        </span>
      </div>
      {renderMockup()}
    </div>
  );
}
