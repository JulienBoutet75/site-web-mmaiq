import React from 'react';

interface PhoneFrameProps {
  /** chemin public du mp4 (boucle muette) */
  src: string;
  /** image poster affichée avant lecture */
  poster: string;
  /** description accessible du contenu */
  label: string;
  className?: string;
  /** charge la vidéo dès le rendu (hero) au lieu d'attendre */
  eager?: boolean;
}

/**
 * Cadre téléphone en CSS autour d'une vraie capture d'écran de l'app
 * (vidéos 480x980, barre de statut déjà rognée à l'encodage).
 */
export function PhoneFrame({ src, poster, label, className = '', eager = false }: PhoneFrameProps) {
  return (
    <div className={`relative w-full max-w-[250px] sm:max-w-[300px] mx-auto ${className}`}>
      <div className="absolute inset-0 bg-[#7B2FFF]/25 blur-[60px] rounded-full scale-90 pointer-events-none" aria-hidden="true" />
      <div className="relative rounded-[44px] border border-white/15 bg-[#0C0E18] p-2.5 shadow-2xl">
        {/* Dynamic island */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-20 h-[18px] bg-black rounded-full z-10" aria-hidden="true" />
        <video
          src={src}
          poster={poster}
          aria-label={label}
          autoPlay
          muted
          loop
          playsInline
          preload={eager ? 'auto' : 'metadata'}
          className="w-full rounded-[34px] aspect-[480/980] object-cover bg-[#111123]"
        />
      </div>
    </div>
  );
}
