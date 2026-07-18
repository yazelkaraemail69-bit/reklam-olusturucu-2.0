"use client";

import React, { useCallback, useRef, useState } from "react";

export type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  name: string;
  size: number;
};

type ImageUploaderProps = {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  maxImages?: number;
  minImages?: number;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function compressAndResizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<{ base64: string; previewUrl: string; file: File }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve({
          base64,
          previewUrl: URL.createObjectURL(file),
          file,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context could not be created"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(outputType, quality);
        const base64 = dataUrl.split(",")[1];

        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve({
              base64,
              previewUrl: URL.createObjectURL(compressedFile),
              file: compressedFile,
            });
          })
          .catch(reject);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export default function ImageUploader({
  images,
  onImagesChange,
  selectedImageId,
  onSelectImage,
  maxImages = 5,
  minImages = 1,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newErrors: string[] = [];
      const newImages: UploadedImage[] = [];

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        setErrors([`Maksimum ${maxImages} görsel yükleyebilirsiniz.`]);
        return;
      }

      const toProcess = fileArray.slice(0, remaining);
      setIsProcessing(true);

      for (const file of toProcess) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          newErrors.push(`${file.name}: Desteklenmeyen format (JPG, PNG, WebP kabul edilir)`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          newErrors.push(`${file.name}: Dosya boyutu 10MB'ı aşıyor`);
          continue;
        }

        try {
          const result = await compressAndResizeImage(file);
          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file: result.file,
            previewUrl: result.previewUrl,
            base64: result.base64,
            mimeType: result.file.type,
            name: result.file.name,
            size: result.file.size,
          });
        } catch {
          newErrors.push(`${file.name}: Görsel işlenemedi, lütfen tekrar deneyin`);
        }
      }

      setIsProcessing(false);
      setErrors(newErrors);

      if (newImages.length > 0) {
        const updated = [...images, ...newImages];
        onImagesChange(updated);
        if (!selectedImageId) {
          onSelectImage(newImages[0].id);
        }
      }
    },
    [images, maxImages, selectedImageId, onImagesChange, onSelectImage]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = images.filter((img) => img.id !== id);
    onImagesChange(updated);
    if (selectedImageId === id) {
      onSelectImage(updated.length > 0 ? updated[0].id : "");
    }
  };

  const selectedImage = images.find((img) => img.id === selectedImageId);
  const canAddMore = images.length < maxImages;
  const progress = Math.min((images.length / maxImages) * 100, 100);
  const isComplete = images.length >= minImages;

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-bold text-slate-200">
              Ürün / Reklam Görselleri
            </span>
          </div>
          <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-full">
            {images.length}/{maxImages}
          </span>
        </div>

        {isComplete ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Hazır!
          </span>
        ) : images.length > 0 ? (
          <span className="text-[10px] text-amber-400">
            {maxImages - images.length} daha ekleyin
          </span>
        ) : null}
      </div>

      {/* Progress bar */}
      {images.length > 0 && (
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Drop Zone — Always visible when can add more */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
            images.length === 0 ? "h-36" : "h-20"
          } ${
            isDragging
              ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
              : isProcessing
              ? "border-slate-600 bg-slate-900/20 cursor-wait"
              : "border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5"
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-[11px] text-slate-400 font-medium">Görseller işleniyor...</p>
            </>
          ) : (
            <>
              <div className={`rounded-xl flex items-center justify-center transition-all ${
                images.length === 0 ? "w-10 h-10" : "w-7 h-7"
              } ${isDragging ? "bg-indigo-500/20" : "bg-slate-900"}`}>
                <svg
                  className={`transition-colors ${isDragging ? "text-indigo-400" : "text-slate-500"} ${
                    images.length === 0 ? "w-5 h-5" : "w-4 h-4"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isDragging ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  )}
                </svg>
              </div>
              <div className="text-center">
                <p className={`font-semibold transition-colors ${isDragging ? "text-indigo-300" : "text-slate-400"} ${
                  images.length === 0 ? "text-xs" : "text-[11px]"
                }`}>
                  {isDragging
                    ? "Bırakın, yüklensin!"
                    : images.length === 0
                    ? "Görselleri sürükle & bırak veya tıkla"
                    : `Daha fazla görsel ekle (${maxImages - images.length} kalan)`}
                </p>
                {images.length === 0 && (
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    JPG, PNG, WebP · Maks 10MB · En fazla {maxImages} görsel
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Image Grid Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelectImage(img.id)}
                className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 block ${
                  selectedImageId === img.id
                    ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-105"
                    : "border-slate-700 hover:border-slate-500"
                }`}
                title={img.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />

                {/* Index badge */}
                <div className={`absolute bottom-0.5 left-0.5 text-[8px] font-bold px-1 py-0.5 rounded ${
                  selectedImageId === img.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900/80 text-slate-400"
                }`}>
                  {index + 1}
                </div>

                {/* Selected checkmark */}
                {selectedImageId === img.id && (
                  <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                    <div className="bg-indigo-600 rounded-full p-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => handleRemove(img.id, e)}
                className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                title="Görseli kaldır"
              >
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Empty slots to show capacity */}
          {canAddMore && Array.from({ length: Math.min(maxImages - images.length, 5 - images.length) }).map((_, i) => (
            <button
              key={`empty-${i}`}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-800 hover:border-indigo-500/40 flex items-center justify-center transition-all group"
              title="Görsel ekle"
            >
              <svg className="w-4 h-4 text-slate-700 group-hover:text-indigo-500/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Selected Image Large Preview */}
      {selectedImage && (
        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative">
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-slate-300 bg-slate-950/80 backdrop-blur px-2 py-1 rounded-full border border-slate-800">
              {selectedImage.name.length > 22 ? selectedImage.name.substring(0, 22) + "…" : selectedImage.name}
            </span>
            <span className="text-[9px] text-slate-500 bg-slate-950/80 backdrop-blur px-2 py-1 rounded-full border border-slate-800">
              {formatBytes(selectedImage.size)}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage.previewUrl}
            alt="Seçili görsel"
            className="w-full max-h-52 object-contain bg-slate-950"
          />
        </div>
      )}

      {/* Info tip when no images */}
      {images.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
          <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-[11px] text-blue-300 font-semibold">İpucu: Birden fazla görsel yükleyin</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Ürününüzün farklı açılarından en fazla {maxImages} görsel ekleyebilirsiniz. AI tüm görsellerinizi analiz ederek daha iyi sonuçlar üretir.
            </p>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-red-400">Yükleme Hataları</span>
            <button
              onClick={() => setErrors([])}
              className="text-red-400 hover:text-red-300 text-[10px]"
            >
              Kapat
            </button>
          </div>
          {errors.map((err, i) => (
            <p key={i} className="text-[10px] text-red-300 flex items-start gap-1.5">
              <svg className="w-3 h-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
