import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { saveReferral } from "../lib/referral";
import { useV3UI } from "../v3/V3UIContext";
import { CloseIcon } from "../v3/Dialog";

// Navigation V3 (Figma « MMA IQ V2 / Navigation / Desktop » 2093:2 et « Mobile » 2093:19).
const MAIN_LINKS = [
  { name: "L’application", path: "/application" },
  { name: "Academy", path: "/academy" },
  { name: "Équipement", path: "/equipement" },
  { name: "Tarifs", path: "/tarifs" },
] as const;

// Pied de page (Figma 2093:30 desktop, 2093:46 mobile).
const FOOTER_LINKS = [
  { name: "Academy", path: "/academy" },
  { name: "Équipement", path: "/equipement" },
  { name: "Pourquoi IQ", path: "/pourquoi-iq" },
  { name: "Aide", path: "/aide" },
  { name: "Contact", path: "/contact" },
] as const;
const LEGAL_LINKS = [
  { name: "Mentions légales", path: "/mentions-legales" },
  { name: "Confidentialité", path: "/confidentialite" },
  { name: "CGV", path: "/cgv" },
] as const;

// Parcours « Pour qui ? » : le lien reste actif sur les pages de profil (et les pages de salle).
const ROLE_PAGES = ["/pratiquant", "/combattant", "/coach", "/partenaires"];

function Brand() {
  return (
    <Link to="/" aria-label="MMA IQ — Accueil" className="flex shrink-0 items-center gap-2 lg:w-[200px] lg:gap-3">
      <img src="/v3/logo.webp" alt="" width={183} height={144} className="size-[30px] object-contain lg:size-[34px]" />
      <span className="whitespace-nowrap text-[20px] leading-8 text-v3-paper lg:text-[22px] lg:text-white" style={{ fontFamily: '"Days One", sans-serif' }}>
        MMA IQ
      </span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { openStores, openRoles } = useV3UI();
  const { user, profile, signOut, coachSession, setCoachSession, isAdmin } = useAuth();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const isNoLayoutPage = pathname.startsWith("/admin");

  const role = profile?.role;
  const accountLink = isAdmin
    ? { name: "Admin", path: "/admin" }
    : role === "coach" || (!user && coachSession)
      ? { name: "Espace coach", path: "/coach/dashboard" }
      : { name: "Mes formations", path: "/mes-formations" };
  const hasAccount = !!user || !!coachSession;
  const rolesActive = ROLE_PAGES.includes(pathname) || pathname.startsWith("/s/");

  const handleSignOut = async () => {
    if (user) await signOut();
    else setCoachSession(null);
    setMenuOpen(false);
    navigate("/");
  };

  // Un hash est traité après le montage de sa destination (routes lazy comprises).
  useEffect(() => {
    setMenuOpen(false);
    let observer: MutationObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const frame = window.requestAnimationFrame(() => {
      if (!location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        return;
      }
      let id: string;
      try { id = decodeURIComponent(location.hash.slice(1)); }
      catch { return; }
      const scrollToTarget = () => {
        const target = document.getElementById(id);
        if (!target) return false;
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
          block: "start",
        });
        observer?.disconnect();
        if (timeout) clearTimeout(timeout);
        return true;
      };
      if (!scrollToTarget()) {
        observer = new MutationObserver(scrollToTarget);
        observer.observe(document.body, { childList: true, subtree: true });
        timeout = setTimeout(() => observer?.disconnect(), 5000);
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [location.key, location.pathname, location.hash]);

  // Le code partenaire suit la navigation sans modifier les liens commerciaux.
  useEffect(() => {
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref) saveReferral(ref);
  }, [location.search]);

  // Menu mobile plein écran : focus piégé, Échap, défilement bloqué.
  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuRef.current;
    if (!panel) return;
    const toggle = menuToggleRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => panel.querySelector<HTMLElement>("[data-menu-first]")?.focus({ preventScroll: true }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
      document.body.style.overflow = overflow;
      if (toggle?.isConnected && toggle.getClientRects().length > 0) toggle.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  if (isNoLayoutPage) {
    return <main className="min-h-screen bg-[var(--color-bg-base)]">{children}</main>;
  }

  const desktopLink = ({ isActive }: { isActive: boolean }) =>
    `v3-label whitespace-nowrap transition-colors hover:text-white ${isActive ? "text-white" : "text-v3-muted"}`;
  const mobileItem = "block w-full text-left text-[26px] font-semibold leading-8 text-white transition-colors hover:text-v3-lavender";

  return (
    <div className="v3 flex min-h-screen w-full flex-col bg-v3-fond">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-[12px] focus:bg-white focus:px-4 focus:py-3 focus:text-v3-navy">
        Aller au contenu
      </a>

      <header inert={menuOpen} className="sticky top-0 z-[100] w-full bg-v3-nav">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-6 py-2 lg:h-[104px] lg:gap-8 lg:px-10 lg:py-6 xl:px-20">
          <Brand />

          <nav aria-label="Navigation principale" className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            <NavLink to={MAIN_LINKS[0].path} className={desktopLink}>{MAIN_LINKS[0].name}</NavLink>
            <button
              type="button"
              onClick={openRoles}
              aria-haspopup="dialog"
              className={`v3-label whitespace-nowrap transition-colors hover:text-white ${rolesActive ? "text-white" : "text-v3-muted"}`}
            >
              Pour qui ?
            </button>
            {MAIN_LINKS.slice(1).map((link) => (
              <NavLink key={link.path} to={link.path} className={desktopLink}>{link.name}</NavLink>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-6 lg:flex">
            {hasAccount && (
              <>
                <Link to={accountLink.path} className="v3-label whitespace-nowrap text-v3-muted transition-colors hover:text-white">
                  {accountLink.name}
                </Link>
                <button type="button" onClick={handleSignOut} className="v3-label whitespace-nowrap text-v3-muted transition-colors hover:text-white">
                  Déconnexion
                </button>
              </>
            )}
            <button
              type="button"
              onClick={openStores}
              aria-haspopup="dialog"
              className="inline-flex min-h-14 items-center justify-center whitespace-nowrap rounded-[12px] border border-v3-brand bg-v3-brand px-6 py-[15px] text-[16px] font-semibold leading-6 text-white transition-colors hover:bg-v3-brand-hover"
            >
              Télécharger l’app
            </button>
          </div>

          <button
            ref={menuToggleRef}
            type="button"
            className="-mr-2 flex size-11 shrink-0 flex-col items-center justify-center gap-1.5 text-white lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
          >
            <span className="h-[1.5px] w-5 rounded-full bg-current" aria-hidden="true" />
            <span className="h-[1.5px] w-5 rounded-full bg-current" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Figma « Menu mobile · Navigation » 2093:6155 */}
      <div
        id="menu-mobile"
        ref={menuRef}
        role="dialog"
        aria-modal={menuOpen || undefined}
        aria-label="Menu MMA IQ"
        inert={!menuOpen}
        className={`fixed inset-0 z-[150] overflow-y-auto overscroll-contain bg-v3-nav transition-opacity duration-200 lg:hidden ${menuOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
      >
        <div className="flex min-h-full flex-col gap-3 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex h-11 items-center justify-end">
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" className="-mr-3 text-white transition-colors hover:text-v3-lavender">
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Navigation mobile" className="flex flex-col gap-3">
            <Link data-menu-first to="/" onClick={() => setMenuOpen(false)} className={mobileItem}>Explorer MMA IQ</Link>
            <Link to="/application" onClick={() => setMenuOpen(false)} className={mobileItem}>L’application</Link>
            <button type="button" onClick={() => { setMenuOpen(false); openRoles(); }} aria-haspopup="dialog" className={mobileItem}>Pour qui ?</button>
            <Link to="/academy" onClick={() => setMenuOpen(false)} className={mobileItem}>Academy</Link>
            <Link to="/equipement" onClick={() => setMenuOpen(false)} className={mobileItem}>Équipement</Link>
            <Link to="/tarifs" onClick={() => setMenuOpen(false)} className={mobileItem}>Tarifs</Link>
            <Link to="/aide" onClick={() => setMenuOpen(false)} className={mobileItem}>Aide &amp; contact</Link>
            <Link to="/mon-abonnement" onClick={() => setMenuOpen(false)} className={mobileItem}>Mon abonnement</Link>
            {hasAccount ? (
              <>
                <Link to={accountLink.path} onClick={() => setMenuOpen(false)} className={mobileItem}>{accountLink.name}</Link>
                <button type="button" onClick={handleSignOut} className={`${mobileItem} text-v3-muted`}>Déconnexion</button>
              </>
            ) : (
              <Link to="/connexion" onClick={() => setMenuOpen(false)} className={mobileItem}>Se connecter</Link>
            )}
            {isAdmin && accountLink.path !== "/admin" && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className={`${mobileItem} flex items-center gap-3 text-v3-lavender`}>
                <ShieldCheck className="size-6" aria-hidden="true" /> Administration
              </Link>
            )}
          </nav>
        </div>
      </div>

      <main id="contenu" tabIndex={-1} inert={menuOpen} className="flex-grow focus:outline-none">{children}</main>

      <footer inert={menuOpen} className="v3-gutter w-full bg-v3-nav py-10">
        <div className="v3-container flex flex-col gap-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <Link to="/" className="text-[26px] font-semibold leading-8 text-v3-paper">MMA IQ</Link>
            <nav aria-label="Pied de page" className="v3-small grid grid-cols-3 gap-3 text-v3-muted sm:max-w-[342px] lg:flex lg:max-w-none lg:gap-6">
              {/* Ordre mobile Figma : Academy, Équipement, Contact / Pourquoi IQ, Aide, Se connecter */}
              {[FOOTER_LINKS[0], FOOTER_LINKS[1], FOOTER_LINKS[4], FOOTER_LINKS[2], FOOTER_LINKS[3]].map((link, index) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center transition-colors hover:text-white ${["lg:order-1", "lg:order-2", "lg:order-5", "lg:order-3", "lg:order-4"][index]}`}
                >
                  {link.name}
                </Link>
              ))}
              <Link to={hasAccount ? accountLink.path : "/connexion"} className="inline-flex items-center transition-colors hover:text-white lg:order-6">
                {hasAccount ? accountLink.name : "Se connecter"}
              </Link>
            </nav>
          </div>
          <div className="v3-small flex flex-col text-v3-muted lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <p>© 2026 MMA IQ</p>
            <nav aria-label="Informations légales" className="flex flex-wrap gap-3 lg:gap-6">
              <Link to="/mon-abonnement" className="inline-flex items-center whitespace-nowrap transition-colors hover:text-white">Mon abonnement</Link>
              {LEGAL_LINKS.map((link) => (
                <Link key={link.path} to={link.path} className="inline-flex items-center whitespace-nowrap transition-colors hover:text-white">{link.name}</Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
