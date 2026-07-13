import React from 'react';

/**
 * Fond d'ambiance organique : halos violets dérivant lentement + grain subtil.
 * Remplace l'ancienne pluie de particules canvas (boucle JS + repaint permanent)
 * par du CSS pur — styles dans index.css (.ambient-*).
 */
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
      <div className="ambient-grain" />
    </div>
  );
}
