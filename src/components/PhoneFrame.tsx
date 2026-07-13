import React, { useRef } from 'react';

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
 * Tilt 3D léger au survol souris — inactif au tactile et si l'utilisateur
 * préfère réduire les animations.
 */
export function PhoneFrame({ src, poster, label, className = '', eager = false }: PhoneFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el || e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${(px * 10).toFixed(2)}deg) rotateX(${(-py * 10).toFixed(2)}deg)`;
  };

  const handleLeave = () => {
    if (frameRef.current) frameRef.current.style.transform = 'perspective(900px)';
  };

  return (
    <div
      className={`relative w-full max-w-[250px] sm:max-w-[300px] mx-auto ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <div className="absolute inset-0 bg-[var(--color-accent-primary)]/25 blur-[60px] rounded-full scale-90 pointer-events-none" aria-hidden="true" />
      <div
        ref={frameRef}
        className="relative rounded-[44px] border border-white/15 bg-[var(--color-bg-surface)] p-2.5 shadow-2xl transition-transform duration-200 ease-out will-change-transform"
      >
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
