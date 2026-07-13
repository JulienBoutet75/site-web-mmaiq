import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface CropModalProps {
  image: string;
  onClose: () => void;
  onCrop: (croppedImage: Blob) => void;
  aspect?: number;
}

export function CropModal({ image, onClose, onCrop, aspect = 16/9 }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    
    const imageElement = new Image();
    imageElement.src = image;
    await imageElement.decode();

    const canvas = document.createElement('canvas');
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    ctx.drawImage(
      imageElement,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    canvas.toBlob((blob) => {
      if (blob) onCrop(blob);
    }, 'image/jpeg');
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-surface)] rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-white/10">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-white font-bold">Recadrer l'image</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X /></button>
        </div>
        <div className="relative flex-1 w-full h-full min-h-[400px]">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-white/50 hover:text-white font-bold transition-colors">Annuler</button>
          <button onClick={handleCrop} className="px-4 py-2 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/80 transition-colors text-white rounded-lg flex items-center gap-2 font-bold"><Check size={16} /> Valider</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
