import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Dumbbell, Swords, Users, type LucideIcon } from "lucide-react";
import { STORE_URLS, type StorePlatform } from "../config/stores";
import { CloseIcon, Dialog, useDialogTitleId } from "./Dialog";

interface V3UIContextValue {
  /** Choix iOS / Android (« Installer MMA IQ »). */
  openStores: () => void;
  /** Ouvre directement une fiche store (ou le message d’attente si l’URL manque). */
  openStore: (platform: StorePlatform) => void;
  /** Sélecteur de parcours « Pour qui ? ». */
  openRoles: () => void;
}

const V3UIContext = createContext<V3UIContextValue | undefined>(undefined);

type Overlay = null | "stores" | "roles" | { store: StorePlatform };

export const ROLE_PATHS = [
  { title: "Je pratique", body: "Construis tes bases et suis tes progrès.", to: "/pratiquant", Icon: Dumbbell },
  { title: "Je combats", body: "Prépare tes échéances et affine ta stratégie.", to: "/combattant", Icon: Swords },
  { title: "Je suis coach", body: "Accompagne tes athlètes et structure leur suivi.", to: "/coach", Icon: Users },
  { title: "Je gère une salle", body: "Découvre les outils et le partenariat pour ton club.", to: "/partenaires", Icon: Building2 },
] satisfies Array<{ title: string; body: string; to: string; Icon: LucideIcon }>;

export function V3UIProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const close = useCallback(() => setOverlay(null), []);

  const openStore = useCallback((platform: StorePlatform) => {
    const url = STORE_URLS[platform];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      setOverlay(null);
    } else {
      setOverlay({ store: platform });
    }
  }, []);

  const value = useMemo<V3UIContextValue>(() => ({
    openStores: () => setOverlay("stores"),
    openStore,
    openRoles: () => setOverlay("roles"),
  }), [openStore]);

  return (
    <V3UIContext.Provider value={value}>
      {children}
      <StoresDialog open={overlay === "stores"} onClose={close} onChoose={openStore} />
      <StoreComingDialog platform={typeof overlay === "object" && overlay ? overlay.store : null} onClose={close} />
      <RolesDialog open={overlay === "roles"} onClose={close} />
    </V3UIContext.Provider>
  );
}

export function useV3UI() {
  const context = useContext(V3UIContext);
  if (!context) throw new Error("useV3UI doit être utilisé dans V3UIProvider");
  return context;
}

const PANEL_SURFACE = "bg-v3-surface text-white";
const BUTTON_PRIMARY = "inline-flex min-h-14 w-full items-center justify-center rounded-[12px] border border-v3-brand bg-v3-brand px-6 py-[15px] text-[16px] font-semibold leading-6 text-white transition-colors hover:bg-v3-brand-hover";
const BUTTON_OUTLINE = "inline-flex min-h-14 items-center justify-center rounded-[12px] border border-white/60 px-6 py-[15px] text-[16px] font-semibold leading-6 text-white transition-colors hover:bg-white/10";

/** Figma « V3 · Choix de plateforme » (2109:6684 / 2109:6711). */
function StoresDialog({ open, onClose, onChoose }: { open: boolean; onClose: () => void; onChoose: (platform: StorePlatform) => void }) {
  const titleId = useDialogTitleId("stores-title");
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName={`max-w-[560px] rounded-[16px] p-6 sm:p-10 ${PANEL_SURFACE}`}>
      <div className="flex flex-col gap-6">
        <h2 id={titleId} className="text-[32px] font-semibold leading-[38px] sm:text-[40px] sm:leading-[46px]">Installer MMA IQ</h2>
        <p className="v3-body text-v3-muted">Choisis ton téléphone.</p>
        <button type="button" className={BUTTON_PRIMARY} onClick={() => onChoose("ios")} data-autofocus>App Store</button>
        <button type="button" className={BUTTON_PRIMARY} onClick={() => onChoose("android")}>Google Play</button>
        <div>
          <button type="button" className={BUTTON_OUTLINE} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </Dialog>
  );
}

/** Figma « Téléchargement · iOS / Android » : affiché tant que l’URL officielle n’est pas renseignée. */
function StoreComingDialog({ platform, onClose }: { platform: StorePlatform | null; onClose: () => void }) {
  const titleId = useDialogTitleId("store-coming-title");
  const device = platform === "android" ? "ton Android" : "ton iPhone";
  const store = platform === "android" ? "Google Play" : "l’App Store";
  return (
    <Dialog open={platform !== null} onClose={onClose} labelledBy={titleId} panelClassName={`max-w-[560px] rounded-[16px] p-6 sm:p-10 ${PANEL_SURFACE}`}>
      <div className="flex flex-col items-start gap-6">
        <h2 id={titleId} className="v3-heading text-white">MMA IQ<br />sur {device}.</h2>
        <p className="v3-body text-v3-muted">L’application est disponible sur iOS et Android. Le lien direct vers {store} arrive très bientôt sur cette page.</p>
        <button type="button" className={`${BUTTON_PRIMARY} w-auto`} onClick={onClose} data-autofocus>Fermer</button>
      </div>
    </Dialog>
  );
}

/** Figma « Menu profils · Navigation » (2093:6174 desktop, 2159:7102 mobile). */
function RolesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useDialogTitleId("roles-title");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      panelClassName={`max-w-[720px] rounded-[24px] border border-[#4d405f] p-5 md:p-8 ${PANEL_SURFACE}`}
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] leading-5 tracking-[1.1px] text-v3-lavender">MMA IQ POUR TOI</p>
              <h2 id={titleId} className="text-[24px] font-semibold leading-[30px] md:text-[32px] md:leading-10">Trouve ton parcours.</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Fermer" className="-mr-2 -mt-1 shrink-0 rounded-full text-white transition-colors hover:text-v3-lavender">
              <CloseIcon />
            </button>
          </div>
          <p className="text-[14px] leading-[22px] text-v3-muted md:text-[15px] md:leading-6">Choisis ton profil pour découvrir les outils qui te correspondent.</p>
        </div>
        <ul className="grid gap-2 md:grid-cols-2 md:gap-4">
          {ROLE_PATHS.map(({ title, body, to, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={onClose}
                className="group relative flex h-full rounded-[16px] border border-[#4d405f] bg-v3-nav px-4 py-3 transition-colors hover:border-v3-lavender/70 md:min-h-[176px] md:flex-col md:gap-4 md:p-6"
              >
                <Icon className="size-8 shrink-0 text-v3-lavender" strokeWidth={1.7} aria-hidden="true" />
                <span className="ml-3 flex min-w-0 flex-1 flex-col gap-1 pr-6 md:ml-0 md:gap-2 md:pr-0">
                  <span className="text-[17px] font-semibold leading-6 tracking-[-0.34px] text-white md:text-[20px] md:leading-7 md:tracking-[-0.4px]">{title}</span>
                  <span className="text-[14px] leading-[21px] text-v3-muted">{body}</span>
                </span>
                <ArrowUpRight className="absolute right-[15px] top-[17px] size-[18px] text-v3-lavender transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 md:right-6 md:top-[23px]" strokeWidth={1.7} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-[13px] leading-5 text-v3-muted">Tu peux explorer plusieurs parcours.</p>
      </div>
    </Dialog>
  );
}
