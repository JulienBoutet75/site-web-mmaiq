interface PhoneFrameProps {
  /** Chemin public de la démonstration vidéo. */
  src: string;
  /** image poster affichée avant lecture */
  poster: string;
  /** description accessible du contenu */
  label: string;
  className?: string;
  /** Précharge les métadonnées de la démonstration du premier écran. */
  eager?: boolean;
}

/**
 * Cadre téléphone en CSS autour d'une vraie capture d'écran de l'app
 * (vidéos 768x1568, barre de statut déjà rognée à l'encodage).
 * La démonstration tourne automatiquement, sans interaction nécessaire.
 */
export function PhoneFrame({ src, poster, label, className = '', eager = false }: PhoneFrameProps) {
  return (
    <div className={`relative mx-auto w-full max-w-[250px] sm:max-w-[300px] ${className}`}>
      <div className="absolute inset-0 bg-[var(--color-accent-primary)]/25 blur-[60px] rounded-full scale-90 pointer-events-none" aria-hidden="true" />
      <div className="relative rounded-[44px] border border-white/15 bg-[var(--color-bg-surface)] p-2.5 shadow-2xl">
        <video
          poster={poster}
          aria-label={label}
          autoPlay
          muted
          loop
          playsInline
          preload={eager ? 'metadata' : 'none'}
          className="w-full rounded-[34px] aspect-[768/1568] object-cover bg-[#111123]"
        >
          {/* VP9 d'abord (~35 % plus léger à qualité égale), MP4 en repli. */}
          <source src={src.replace(/\.mp4$/, '.webm')} type="video/webm" />
          <source src={src} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
