import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-white flex flex-col items-center justify-center text-center px-6 pt-24">
      <div className="font-display text-7xl md:text-9xl text-white/10 mb-4">404</div>
      <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tight mb-4">
        Cette page n'existe pas.
      </h1>
      <p className="font-body text-[var(--color-text-secondary)] text-base md:text-lg mb-10 max-w-md">
        Le lien est peut-être cassé, ou la page a été déplacée.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-accent-primary)] hover:opacity-90 text-white rounded-full font-ui font-bold transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
    </div>
  );
}
