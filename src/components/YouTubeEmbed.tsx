import React from 'react';

export function extractYoutubeId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

interface YouTubeEmbedProps {
  url: string;
  className?: string;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ url, className }) => {
  const id = extractYoutubeId(url);
  if (!id) return null;
  
  return (
    <div className={className} style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16/9',
      borderRadius: 12,
      overflow: 'hidden',
      background: 'var(--color-bg-surface)',
    }}>
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}
