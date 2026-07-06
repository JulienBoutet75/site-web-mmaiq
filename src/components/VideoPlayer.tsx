import React from 'react';
import { YouTubeEmbed } from './YouTubeEmbed';

const isYoutubeUrl = (url: string) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

interface VideoPlayerProps {
  url: string;
  className?: string;
  poster?: string;
}

export function VideoPlayer({ url, className, poster }: VideoPlayerProps) {
  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center text-white/20 gap-4 bg-black/40 ${className}`}>
        <p className="font-display text-xl">Vidéo non disponible</p>
      </div>
    );
  }

  if (isYoutubeUrl(url)) {
    return <YouTubeEmbed url={url} className={className} />;
  }

  return (
    <video 
      src={url} 
      controls 
      poster={poster}
      className={`w-full h-full object-cover ${className}`}
      playsInline
      referrerPolicy="no-referrer"
    />
  );
}
