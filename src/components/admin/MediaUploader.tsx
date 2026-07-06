import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, X, PlayCircle, Loader2 } from "lucide-react";
import { motion } from 'motion/react';
import { uploadFile } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { CropModal } from "./CropModal";

interface MediaUploaderProps {
  label?: string;
  accept?: "video" | "image" | "both";
  onUpload: (url: string) => void;
  currentMedia?: string;
  uploadedBy?: "admin" | "coach";
  bucket?: string;
  aspectRatio?: number;
}

export function MediaUploader({ 
  label = "Média", 
  accept = "both", 
  onUpload, 
  currentMedia, 
  uploadedBy = "admin",
  bucket,
  aspectRatio = 16/9
}: MediaUploaderProps) {
  const [uploadState, setUploadState] = useState<'idle'|'uploading'|'done'>('idle');
  const [preview, setPreview] = useState<string | null>(currentMedia || null);
  const [fileType, setFileType] = useState<'image'|'video'|'youtube'|null>(currentMedia ? (currentMedia.includes('youtube.com') || currentMedia.includes('youtu.be') ? 'youtube' : currentMedia.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image') : null);

  useEffect(() => {
    setPreview(currentMedia || null);
    setFileType(currentMedia ? (currentMedia.includes('youtube.com') || currentMedia.includes('youtu.be') ? 'youtube' : currentMedia.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image') : null);
  }, [currentMedia]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accessToken } = useAuth();

  const acceptString = accept === "video" ? "video/*" : accept === "image" ? "image/*" : "image/*,video/*";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const uploadToBucket = async (file: File) => {
    setUploadState('uploading');
    setError(null);
    setFileType(file.type.startsWith('video/') ? 'video' : 'image');

    try {
      const uploadBucket = bucket || (accept === "video" ? "formations-videos" : "admin-media");
      const url = await uploadFile(uploadBucket, file, accessToken);
      
      setPreview(url);
      onUpload(url);
      setUploadState('done');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload.");
      setUploadState('idle');
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    
    // Check file type
    if (accept === "video" && !file.type.startsWith("video/")) {
      setError("Veuillez sélectionner une vidéo.");
      return;
    }
    if (accept === "image" && !file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image.");
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      await uploadToBucket(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload("");
    setUploadState('idle');
    setYoutubeUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (youtubeUrlInput && (youtubeUrlInput.includes('youtube.com') || youtubeUrlInput.includes('youtu.be'))) {
      setPreview(youtubeUrlInput);
      onUpload(youtubeUrlInput);
      setUploadState('done');
      setFileType('youtube');
    } else {
      setError("URL YouTube invalide");
    }
  };

  return (
    <div className="w-full">
      {cropImage && (
        <CropModal
          image={cropImage}
          aspect={aspectRatio}
          onClose={() => setCropImage(null)}
          onCrop={async (blob) => {
            setCropImage(null);
            const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
            await uploadToBucket(file);
          }}
        />
      )}
      {label && <label className="block text-sm font-ui text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">{label}</label>}
      
      {!preview ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[160px]
            ${isDragging ? "border-[var(--color-accent-energy)] bg-[var(--color-accent-energy)]/10" : "border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/5"}
            ${error ? "border-[var(--color-accent-secondary)] bg-[var(--color-accent-secondary)]/10" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleChange} 
            accept={acceptString}
            className="hidden" 
          />
          
          {uploadState === 'uploading' ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-[var(--color-accent-energy)] animate-spin mb-4" />
              <p className="text-sm font-ui text-[var(--color-text-secondary)] mt-2 uppercase tracking-widest">Upload en cours...</p>
            </div>
          ) : (
            <>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center mb-4 text-[var(--color-accent-primary)]"
              >
                <UploadCloud className="w-6 h-6" />
              </motion.div>
              <p className="text-[var(--color-text-primary)] font-ui font-semibold mb-1">Glisser votre fichier ici</p>
              <p className="text-[var(--color-text-secondary)] text-sm mb-4">ou cliquez pour parcourir</p>
              <button 
                type="button"
                className="px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md text-sm text-[var(--color-text-primary)] hover:border-[var(--color-accent-primary)] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Parcourir
              </button>
              {(accept === 'video' || accept === 'both') && (
                <div className="mt-4 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-[var(--color-border)]"></div>
                    <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest">OU</span>
                    <div className="flex-1 h-px bg-[var(--color-border)]"></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Lien YouTube..." 
                      value={youtubeUrlInput}
                      onChange={(e) => setYoutubeUrlInput(e.target.value)}
                      className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-primary)]"
                    />
                    <button 
                      type="button"
                      onClick={handleYoutubeSubmit}
                      className="px-3 py-2 bg-[var(--color-accent-primary)] text-white rounded-md text-sm font-semibold hover:bg-[var(--color-accent-primary)]/80 transition-colors"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-surface)] group">
          {fileType === 'youtube' ? (
            <div className={`relative ${aspectRatio === 1 ? 'aspect-square' : 'aspect-video'} bg-black flex items-center justify-center`}>
              <img 
                src={`https://img.youtube.com/vi/${preview?.includes('v=') ? preview.split('v=')[1].split('&')[0] : preview?.split('/').pop()}/0.jpg`} 
                alt="YouTube Preview" 
                className="w-full h-full object-cover opacity-50"
                referrerPolicy="no-referrer"
              />
              <PlayCircle className="absolute w-12 h-12 text-white/80" />
            </div>
          ) : fileType === 'video' ? (
            <div className={`relative ${aspectRatio === 1 ? 'aspect-square' : 'aspect-video'} bg-black flex items-center justify-center`}>
              <video src={preview || undefined} className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
              <PlayCircle className="absolute w-12 h-12 text-white/80" />
            </div>
          ) : (
            <div className={`relative ${aspectRatio === 1 ? 'aspect-square' : 'aspect-video'} bg-black`}>
              <img src={preview || undefined} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          
          {uploadState === 'done' && (
            <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs p-2 text-center font-ui uppercase tracking-widest">Upload réussi ✓</div>
          )}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md text-sm font-ui font-semibold hover:bg-[var(--color-accent-primary)]/80 transition-colors"
            >
              Remplacer
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-[var(--color-accent-secondary)] text-white rounded-md hover:bg-[var(--color-accent-secondary)]/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleChange} 
            accept={acceptString}
            className="hidden" 
          />
        </div>
      )}
      
      {error && <p className="text-[var(--color-accent-secondary)] text-sm mt-2 font-ui">{error}</p>}
    </div>
  );
}
