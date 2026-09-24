import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Croix fine 44 × 44 (composant Figma « Icône fermer »). */
export function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path d="M15 15L29 29M29 15L15 29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Boîte de dialogue modale V3 : fond flouté, piège de focus, Échap pour fermer,
 * défilement de la page bloqué et focus restauré à la fermeture.
 * Le panneau reçoit ses dimensions et son fond via `panelClassName`.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  label,
  panelClassName = "",
  dismissible = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** id du titre visible du dialogue. */
  labelledBy?: string;
  /** Nom accessible si aucun titre visible. */
  label?: string;
  panelClassName?: string;
  /**
   * Fermeture par Échap et clic sur le fond. À désactiver pour les formulaires
   * longs ou pendant un envoi : seuls leurs boutons ferment alors la fenêtre.
   */
  dismissible?: boolean;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pressedOnBackdrop = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    const frame = window.requestAnimationFrame(() => {
      const target = panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
      target.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (dismissibleRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="v3 v3-dialog-backdrop"
      // Fermeture seulement si l’appui ET le relâchement ont lieu sur le fond,
      // hors barre de défilement (un défilement ne ferme jamais la fenêtre).
      onMouseDown={(event) => {
        const backdrop = event.currentTarget;
        pressedOnBackdrop.current = event.target === backdrop && event.clientX < backdrop.clientWidth && event.clientY < backdrop.clientHeight;
      }}
      onClick={(event) => {
        const shouldClose = dismissible && pressedOnBackdrop.current && event.target === event.currentTarget;
        pressedOnBackdrop.current = false;
        if (shouldClose) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        tabIndex={-1}
        className={`relative my-auto w-full focus:outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function useDialogTitleId(prefix: string) {
  return `${prefix}-${useId().replace(/:/g, "")}`;
}
