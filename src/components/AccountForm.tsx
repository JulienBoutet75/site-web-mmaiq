/**
 * Éléments partagés des pages « Compte » V3 : connexion, inscription, mot de passe, contact.
 * Composant Figma « Champ » (Simple Design System) : libellé 14/20 Medium encre,
 * champ blanc 56 px, bordure #D8DDE8, rayon 12, texte 16/24.
 */
import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cx } from "../v3/ui";

/** Titre de carte « Bon retour. » : 36/40 Medium −1,08 px (mobile) → 48/54 SemiBold −1 px (desktop). */
export const ACCOUNT_TITLE =
  "text-[36px] font-medium leading-10 tracking-[-1.08px] text-v3-navy lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

/** Titre 32/38 (mobile) → 40/46 SemiBold (desktop), style Figma « UI title » (inscription, mot de passe). */
export const RECOVERY_TITLE = "text-[32px] font-semibold leading-[38px] lg:text-[40px] lg:leading-[46px]";

/**
 * Page courte : la bande remplit la hauteur restante de la fenêtre entre la navigation
 * (72 / 104 px) et le pied de page (236 / 164 px), pour éviter un vide sombre sous le contenu.
 */
export const FILL_VIEWPORT = "min-h-[calc(100svh-308px)] lg:min-h-[calc(100svh-268px)]";

/** Bande « Récupération du compte » : colonne de 576 px centrée, 48/72 px de marge verticale. */
export const RECOVERY_SECTION = `v3-gutter w-full py-12 lg:py-[72px] ${FILL_VIEWPORT}`;
export const RECOVERY_COLUMN = "mx-auto flex w-full max-w-[576px] flex-col items-start gap-6 lg:gap-10";

/** Lien texte 14/20 Medium gris ardoise (« Mot de passe oublié ? », « Tu es coach ? … »). */
export const ACCOUNT_LINK =
  "rounded-[4px] underline-offset-4 hover:text-v3-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand";

type FieldProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "id" | "className">;

function describedBy(...ids: Array<string | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

/** Champ texte avec libellé. */
export function TextField({ id, label, hint, className, "aria-describedby": extra, ...input }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cx("flex w-full flex-col gap-2", className)}>
      <label htmlFor={id} className="v3-label text-v3-navy">{label}</label>
      <input id={id} aria-describedby={describedBy(hintId, extra)} className="v3-input" {...input} />
      {hint && <p id={hintId} className="v3-small text-v3-ink-muted">{hint}</p>}
    </div>
  );
}

/** Champ mot de passe avec bouton « Afficher / Masquer ». */
export function PasswordField({ id, label, hint, className, "aria-describedby": extra, ...input }: Omit<FieldProps, "type">) {
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cx("flex w-full flex-col gap-2", className)}>
      <label htmlFor={id} className="v3-label text-v3-navy">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-describedby={describedBy(hintId, extra)}
          className="v3-input pr-14"
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? `Masquer : ${label.toLowerCase()}` : `Afficher : ${label.toLowerCase()}`}
          aria-controls={id}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-[10px] text-v3-ink-muted transition-colors hover:text-v3-navy focus-visible:outline-2 focus-visible:outline-v3-brand"
        >
          {visible ? <EyeOff aria-hidden="true" strokeWidth={1.7} className="size-5" /> : <Eye aria-hidden="true" strokeWidth={1.7} className="size-5" />}
        </button>
      </div>
      {hint && <p id={hintId} className="v3-small text-v3-ink-muted">{hint}</p>}
    </div>
  );
}

/** Message d’erreur (role="alert") ou d’information (role="status"), focalisable pour les lecteurs d’écran. */
export const FormAlert = forwardRef<HTMLDivElement, { tone?: "error" | "info"; id?: string; className?: string; children: ReactNode }>(
  function FormAlert({ tone = "error", id, className, children }, ref) {
    return (
      <div
        ref={ref}
        id={id}
        tabIndex={-1}
        role={tone === "error" ? "alert" : "status"}
        className={cx(
          "flex w-full items-start gap-3 rounded-[12px] border px-4 py-3 text-[14px] leading-5 focus:outline-none!",
          tone === "error" ? "border-[#c0392b]/30 bg-[#c0392b]/[0.06] text-[#9b2c20]" : "border-v3-brand/25 bg-v3-brand/[0.06] text-v3-navy",
          className,
        )}
      >
        <AlertCircle aria-hidden="true" strokeWidth={1.7} className="mt-px size-4 shrink-0" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  },
);

/** N’accepte qu’un chemin interne (« /… ») comme destination après connexion. */
export function safeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
