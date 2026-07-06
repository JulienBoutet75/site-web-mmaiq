import React, { useState, useRef, useEffect } from 'react';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';
import { Pencil, Image as ImageIcon, Video, Trash2, Check, Plus, Upload } from 'lucide-react';
import { uploadFile } from '../../lib/supabase';

// --- EditableText ---
export function EditableText({
  path,
  defaultText,
  className = "",
  as: Component = "span",
}: {
  path: string;
  defaultText: string;
  className?: string;
  as?: any;
}) {
  const { isAdmin, siteData, updateText } = useSite();
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLElement>(null);

  const text = siteData.texts[path] || defaultText;

  const handleBlur = () => {
    setIsEditing(false);
    if (textRef.current) {
      updateText(path, textRef.current.innerText);
    }
  };

  const renderTextWithMMAIQ = (text: string) => {
    const parts = text.split(/(MMA IQ)/g);
    return parts.map((part, i) => 
      part === "MMA IQ" ? (
        <span key={i} className="font-days-one tracking-normal">MMA IQ</span>
      ) : (
        part
      )
    );
  };

  if (!isAdmin) {
    // Render normally with line breaks if any
    return (
      <Component className={className}>
        {text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {renderTextWithMMAIQ(line)}
            {i < text.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </Component>
    );
  }

  return (
    <div className="relative group inline-block w-full">
      <Component
        ref={textRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onClick={() => setIsEditing(true)}
        className={`
          ${className}
          ${isEditing ? 'outline-none border border-purple-500 bg-white/5 cursor-text' : 'cursor-pointer hover:border hover:border-dashed hover:border-purple-500'}
          transition-all duration-200
        `}
      >
        {text}
      </Component>
      {!isEditing && (
        <div className="absolute -top-2 -right-2 bg-purple-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <Pencil size={12} className="text-white" />
        </div>
      )}
    </div>
  );
}

// --- EditableSelect ---
export function EditableSelect({
  path,
  options,
  defaultText,
  className = "",
  as: Component = "span",
}: {
  path: string;
  options: { value: string; label: string }[];
  defaultText: string;
  className?: string;
  as?: any;
}) {
  const { isAdmin, siteData, updateText } = useSite();
  const [isEditing, setIsEditing] = useState(false);

  const value = siteData.texts[path] || defaultText;
  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : defaultText;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateText(path, e.target.value);
    setIsEditing(false);
  };

  if (!isAdmin) {
    return <Component className={className}>{displayLabel}</Component>;
  }

  return (
    <div className="relative group inline-block w-full">
      {isEditing ? (
        <select
          value={value}
          onChange={handleChange}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className={`
            ${className}
            outline-none border border-purple-500 bg-[#1a1a1a] text-white cursor-pointer
            transition-all duration-200 w-full
          `}
        >
          <option value="" disabled>Sélectionner...</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <Component
          onClick={() => setIsEditing(true)}
          className={`
            ${className}
            cursor-pointer hover:border hover:border-dashed hover:border-purple-500
            transition-all duration-200
          `}
        >
          {displayLabel}
        </Component>
      )}
      {!isEditing && (
        <div className="absolute -top-2 -right-2 bg-purple-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <Pencil size={12} className="text-white" />
        </div>
      )}
    </div>
  );
}

// --- EditableImage ---
export function EditableImage({
  path,
  defaultSrc,
  className = "",
  imgClassName = "",
}: {
  path: string;
  defaultSrc: string;
  className?: string;
  imgClassName?: string;
}) {
  const { isAdmin, siteData, updateImage, openMediathequeForSelection } = useSite();
  const { accessToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const src = siteData.images[path] || defaultSrc;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFile('images', file, accessToken, `${Date.now()}_${file.name}`);
      updateImage(path, url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAdmin) {
    return <img src={src} alt="" className={imgClassName} referrerPolicy="no-referrer" />;
  }

  return (
    <div className={`relative group ${className}`}>
      <img src={src} alt="" className={imgClassName} referrerPolicy="no-referrer" />
      
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
        <div className="flex flex-col gap-2 p-2 w-full max-w-[150px]">
          <button
            onClick={(e) => { e.preventDefault(); openMediathequeForSelection((url) => updateImage(path, url)); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 w-full truncate"
            title="Depuis la médiathèque"
          >
            <ImageIcon size={14} className="shrink-0" /> <span className="truncate">Médiathèque</span>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
            className="bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 w-full truncate"
            disabled={isUploading}
            title="Uploader une nouvelle image"
          >
            {isUploading ? "..." : <><Upload size={14} className="shrink-0" /> <span className="truncate">Uploader</span></>}
          </button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}

// --- EditableVideo ---
export function EditableVideo({
  path,
  defaultSrc,
  className = "",
  videoClassName = "",
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  loopDuration,
}: {
  path: string;
  defaultSrc: string;
  className?: string;
  videoClassName?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  loopDuration?: number;
}) {
  const { isAdmin, siteData, updateVideo, openMediathequeForSelection } = useSite();
  const { accessToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const src = siteData.videos[path] || defaultSrc;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFile('formations-videos', file, accessToken, `${Date.now()}_${file.name}`);
      updateVideo(path, url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (loopDuration && loop) {
      const video = e.currentTarget;
      if (video.currentTime >= loopDuration) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    }
  };

  if (!isAdmin) {
    return (
      <video 
        src={src} 
        className={videoClassName} 
        controls={controls} 
        autoPlay={autoPlay} 
        loop={loop && !loopDuration} 
        muted={muted} 
        playsInline 
        onTimeUpdate={handleTimeUpdate}
      />
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <video 
        src={src} 
        className={videoClassName} 
        controls={controls} 
        autoPlay={autoPlay} 
        loop={loop && !loopDuration} 
        muted={muted} 
        playsInline 
        onTimeUpdate={handleTimeUpdate}
      />
      
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => openMediathequeForSelection((url) => updateVideo(path, url))}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2"
          >
            <Video size={16} /> Changer la vidéo
          </button>
          <button
            onClick={() => {
              const url = prompt("Coller un lien YouTube ou autre :");
              if (url) updateVideo(path, url);
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2"
          >
            🔗 Coller un lien
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2"
            disabled={isUploading}
          >
            {isUploading ? "Upload en cours..." : "⬆️ Uploader vers formations-videos"}
          </button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="video/*"
        className="hidden"
      />
    </div>
  );
}

// --- EditableCard ---
export function EditableCard({
  children,
  onEdit,
  onDelete,
  className = "",
  isEditing = false,
  editForm = null,
}: {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
  isEditing?: boolean;
  editForm?: React.ReactNode;
}) {
  const { isAdmin } = useSite();

  if (!isAdmin) {
    return <div className={className}>{children}</div>;
  }

  if (isEditing && editForm) {
    return (
      <div className={`relative ${className} bg-[#1a1a1a] border-2 border-purple-500 rounded-[2rem] p-6 shadow-[0_0_30px_rgba(160,32,240,0.2)]`}>
        {editForm}
      </div>
    );
  }

  return (
    <div className={`relative group ${className} hover:ring-2 hover:ring-purple-500 transition-all rounded-[2rem]`}>
      {children}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// --- AddButton ---
export function AddButton({ onClick, text }: { onClick: () => void; text: string }) {
  const { isAdmin } = useSite();

  if (!isAdmin) return null;

  return (
    <button
      onClick={onClick}
      className="group relative w-full py-10 border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-3xl flex flex-col items-center justify-center gap-4 text-purple-400 hover:text-purple-200 transition-all duration-500 mt-8 overflow-hidden bg-purple-500/5 hover:bg-purple-500/10"
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      
      <div className="relative z-10 bg-gradient-to-br from-purple-500/20 to-purple-600/40 p-5 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-all duration-500 border border-purple-500/20 group-hover:border-purple-500/40">
        <Plus size={32} className="text-purple-400 group-hover:text-white transition-colors" />
      </div>
      
      <span className="relative z-10 font-display text-lg tracking-wide uppercase opacity-80 group-hover:opacity-100 transition-opacity">
        {text}
      </span>
      
      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-purple-500/20 group-hover:border-purple-500/50 transition-colors" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-purple-500/20 group-hover:border-purple-500/50 transition-colors" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-purple-500/20 group-hover:border-purple-500/50 transition-colors" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-purple-500/20 group-hover:border-purple-500/50 transition-colors" />
    </button>
  );
}
