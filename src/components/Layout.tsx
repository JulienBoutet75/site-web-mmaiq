import { useState, useEffect, useRef, ReactNode, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Pencil, ShieldCheck, ArrowRight } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useAuth } from "../context/AuthContext";
import { submitLead } from "../lib/supabase";
import { saveReferral } from "../lib/referral";
import { CONTACT_EMAIL } from "../data/site";

// Les entrées commerciales restent présentes même avec un ancien contenu CMS.
// L'administration conserve sa liste complète et ses indices d'origine.
const PUBLIC_NAV_LINKS = [
  { name: "Application", path: "/app" },
  { name: "Tarifs", path: "/tarifs" },
  { name: "Academy", path: "/instructional" },
  { name: "Pour les salles", path: "/partenaires" },
];
const RESOURCE_LINKS = [
  { name: "À propos", path: "/about" },
  { name: "FAQ", path: "/faq" },
  { name: "Contact", path: "/contact" },
];
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Layout({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const newsletterSuccessRef = useRef<HTMLParagraphElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const locationKeyRef = useRef(location.key);
  locationKeyRef.current = location.key;
  const navigate = useNavigate();
  const { siteData, isAdmin, updateArray } = useSite();
  const { user, profile, signOut, coachSession, setCoachSession } = useAuth();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const isNoLayoutPage = pathname.startsWith("/admin") || pathname.startsWith("/coach/") || pathname === "/coach" || pathname.startsWith("/connexion");

  const role = profile?.role;
  const accountLink = role === "admin" || role === "super_admin"
    ? { name: "Admin", path: "/admin" }
    : role === "coach" || (!user && coachSession)
      ? { name: "Espace coach", path: "/coach/dashboard" }
      : { name: "Mes formations", path: "/mes-formations" };
  const hasAccount = !!user || !!coachSession;
  const navLinks = isAdmin
    ? siteData.navLinks.map((link, sourceIndex) => ({ ...link, sourceIndex }))
    : PUBLIC_NAV_LINKS.map((link) => {
      const sourceIndex = siteData.navLinks.findIndex(item => item.path === link.path);
      const customName = siteData.navLinks[sourceIndex]?.name;
      // Raccourcir les anciens libellés tout en conservant les autres noms
      // personnalisés par l'éditeur. Les destinations essentielles restent présentes.
      const legacyName = (link.path === '/app' && customName === 'Application de performance')
        || (link.path === '/instructional' && customName === 'Coaching vidéo');
      return { ...link, name: customName && !legacyName ? customName : link.name, sourceIndex };
    });

  const isActive = (path: string) => pathname === path
    || (path === "/instructional" && (pathname.startsWith("/course/") || pathname.startsWith("/coaches/")))
    || (path === "/partenaires" && pathname.startsWith("/s/"));

  const handleSignOut = async () => {
    if (user) await signOut();
    else setCoachSession(null);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const handleEditNavLink = (sourceIndex: number) => {
    const original = siteData.navLinks[sourceIndex];
    if (!original) return;
    const newName = prompt("Nouveau nom pour le lien :", original.name);
    if (newName?.trim() && newName !== original.name) {
      updateArray("navLinks", sourceIndex, { ...original, name: newName.trim() });
    }
  };

  const handleNewsletter = async (e: FormEvent) => {
    e.preventDefault();
    if (newsletterStatus === "loading") return;
    setNewsletterStatus("loading");
    try {
      await submitLead({ type: "newsletter", email: newsletterEmail });
      setNewsletterStatus("success");
      setNewsletterEmail("");
    } catch (err) {
      console.error("Newsletter error:", err);
      setNewsletterStatus("error");
    }
  };

  useEffect(() => {
    if (newsletterStatus === "success") newsletterSuccessRef.current?.focus();
  }, [newsletterStatus]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Un hash est traité après le montage de sa destination, y compris une route
  // lazy et un second clic vers le même hash. /app/ et /app sont équivalents.
  useEffect(() => {
    setIsMobileMenuOpen(false);
    let frame = 0;
    let observer: MutationObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    frame = window.requestAnimationFrame(() => {
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

  useEffect(() => {
    if (!isMobileMenuOpen || isNoLayoutPage) return;
    const panel = menuPanelRef.current as HTMLDivElement | null;
    if (!panel) return;
    const previousFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement
      : menuToggleRef.current;
    const openedAtKey = locationKeyRef.current;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const body = document.body;
    const savedStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const paddingRight = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    Object.assign(body.style, {
      position: "fixed", top: `-${scrollY}px`, left: `-${scrollX}px`, width: "100%", overflow: "hidden",
      paddingRight: `${paddingRight + gutter}px`,
    });
    const focusFrame = window.requestAnimationFrame(() => {
      panel.querySelector<HTMLElement>("[data-menu-first]")?.focus({ preventScroll: true });
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileMenuOpen(false);
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    const handleResize = () => {
      if (desktopQuery.matches && !isAdmin) setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleResize);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleResize);
      Object.assign(body.style, savedStyles);
      if (locationKeyRef.current === openedAtKey) {
        window.scrollTo({ top: scrollY, left: scrollX, behavior: "instant" });
        if (previousFocus?.isConnected && previousFocus.getClientRects().length > 0) {
          previousFocus.focus({ preventScroll: true });
        }
      }
    };
  }, [isMobileMenuOpen, isNoLayoutPage, isAdmin]);

  if (isNoLayoutPage) {
    return <main className="min-h-screen bg-[var(--color-bg-base)]">{children}</main>;
  }

  const desktopLinkClass = "font-ui text-sm font-semibold whitespace-nowrap transition-colors hover:text-white";
  const mobileLinkClass = "flex min-h-12 items-center justify-between gap-4 rounded-xl px-4 py-3 font-ui text-lg font-semibold transition-colors hover:bg-white/5";

  return (
    <div className="flex flex-col min-h-screen w-full">
      <header
        inert={isMobileMenuOpen}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled
          ? "bg-[var(--color-bg-base)]/90 backdrop-blur-xl border-b border-white/5 py-2 md:py-4"
          : "bg-[var(--color-bg-base)]/80 backdrop-blur-md py-3 md:py-5"}`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between gap-6">
          <Link to="/" aria-label="MMA IQ — Accueil" className="flex shrink-0 items-center gap-2">
            <img src="/brand/logo.webp" alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0" />
            <img src="/brand/wordmark.webp" alt="MMA IQ" className="h-3 md:h-[18px] object-contain shrink-0" />
          </Link>

          <nav aria-label="Navigation principale" className={`${isAdmin ? "hidden" : "hidden xl:flex"} items-center gap-6 shrink-0`}>
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} aria-current={isActive(link.path) ? "page" : undefined}
                className={`${desktopLinkClass} ${isActive(link.path) ? "text-white" : "text-[var(--color-text-sec)]"}`}>
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-5 pl-6 border-l border-white/10">
              <Link to={hasAccount ? accountLink.path : "/connexion"}
                className={`${desktopLinkClass} text-[var(--color-text-sec)]`}>
                {hasAccount ? accountLink.name : "Se connecter"}
              </Link>
              {hasAccount && <button type="button" onClick={handleSignOut} className={`${desktopLinkClass} text-[var(--color-text-sec)]`}>Déconnexion</button>}
              <Link to="/app#download" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--color-accent-primary)] px-5 py-3 font-ui text-sm font-bold text-white transition-colors hover:bg-[var(--color-violet-600)]">
                Être prévenu <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </nav>

          <button ref={menuToggleRef} type="button"
            className={`${isAdmin ? "" : "xl:hidden"} flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/5`}
            onClick={() => setIsMobileMenuOpen(true)} aria-label="Ouvrir le menu" aria-expanded={isMobileMenuOpen} aria-controls="mobile-menu" aria-haspopup="dialog">
            <Menu size={26} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div id="mobile-menu" ref={menuPanelRef} role="dialog" aria-modal={isMobileMenuOpen || undefined} aria-labelledby="mobile-menu-title" inert={!isMobileMenuOpen}
        className={`fixed inset-0 z-[110] bg-[var(--color-bg-base)] overflow-y-auto overscroll-contain transition-opacity duration-200 ${isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"}`}>
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-[var(--color-bg-base)] py-4">
            <span id="mobile-menu-title" className="font-ui font-semibold text-white">Menu MMA IQ</span>
            <button type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fermer le menu" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/5">
              <X size={26} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Navigation mobile" className="space-y-1">
            <Link data-menu-first to="/" onClick={() => setIsMobileMenuOpen(false)} aria-current={pathname === "/" ? "page" : undefined} className={`${mobileLinkClass} text-white/80`}>Accueil</Link>
            {navLinks.map((link) => (
              <div key={`${link.path}-${link.sourceIndex}`} className="flex items-center gap-2">
                <Link to={link.path} onClick={() => setIsMobileMenuOpen(false)} aria-current={isActive(link.path) ? "page" : undefined}
                  className={`${mobileLinkClass} min-w-0 flex-1 ${isActive(link.path) ? "bg-[var(--color-accent-primary)]/15 text-[var(--color-violet-300)]" : "text-white/80"}`}>
                  {link.name} <ArrowRight className="w-4 h-4 shrink-0 text-[var(--color-violet-300)]" aria-hidden="true" />
                </Link>
                {isAdmin && <button type="button" onClick={() => handleEditNavLink(link.sourceIndex)} aria-label={`Modifier le lien ${link.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--color-violet-300)] hover:bg-white/10"><Pencil size={16} aria-hidden="true" /></button>}
              </div>
            ))}
          </nav>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
            <Link to="/app#download" onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent-primary)] px-6 py-3 font-ui font-bold text-white transition-colors hover:bg-[var(--color-violet-600)]">
              Être prévenu du lancement <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link to={hasAccount ? accountLink.path : "/connexion"} onClick={() => setIsMobileMenuOpen(false)} className={`${mobileLinkClass} text-white/80`}>
              {hasAccount ? accountLink.name : "Se connecter"}
            </Link>
            {hasAccount && <button type="button" onClick={handleSignOut} className={`${mobileLinkClass} w-full text-white/70`}>Déconnexion</button>}
            {isAdmin && <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={`${mobileLinkClass} text-[var(--color-violet-300)]`}><span className="flex items-center gap-3"><ShieldCheck size={18} aria-hidden="true" />Administration</span></Link>}
          </div>
        </div>
      </div>

      <main inert={isMobileMenuOpen} className="flex-grow">{children}</main>

      <footer inert={isMobileMenuOpen} className="bg-[var(--color-bg-base)] border-t border-white/10 pt-12 md:pt-20 pb-8 md:pb-10 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <Link to="/" aria-label="MMA IQ — Accueil" className="flex shrink-0 items-center gap-2 mb-4 md:mb-6">
                <img src="/brand/logo.webp" alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0" />
                <img src="/brand/wordmark.webp" alt="MMA IQ" className="h-3 md:h-[18px] object-contain shrink-0" />
              </Link>
              <p className="text-[var(--color-text-sec)] font-ui text-sm leading-relaxed max-w-xs">
                Une application pour structurer ta pratique du MMA et une Academy pour approfondir ta technique. Bientôt disponibles.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 lg:col-span-2 text-center md:text-left">
              <div>
                <h2 className="font-display text-lg mb-4 md:mb-6 text-white/90">MMA IQ</h2>
                <ul className="flex flex-col gap-3 md:gap-4 font-ui text-sm text-[var(--color-text-sec)]">
                  {PUBLIC_NAV_LINKS.map((link) => <li key={link.path}><Link to={link.path} className="inline-flex min-h-6 items-center hover:text-white transition-colors">{link.name === "Academy" ? "Academy · Formations vidéo" : link.name}</Link></li>)}
                </ul>
              </div>
              <div>
                <h2 className="font-display text-lg mb-4 md:mb-6 text-white/90">Ressources</h2>
                <ul className="flex flex-col gap-3 md:gap-4 font-ui text-sm text-[var(--color-text-sec)]">
                  {RESOURCE_LINKS.map((link) => <li key={link.path}><Link to={link.path} className="inline-flex min-h-6 items-center hover:text-white transition-colors">{link.name}</Link></li>)}
                  <li><a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-6 items-center break-all hover:text-white transition-colors">{CONTACT_EMAIL}</a></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h2 className="font-display text-lg mb-4 md:mb-6 text-white/90">Newsletter</h2>
              <p className="text-[var(--color-text-sec)] font-ui text-sm mb-4 leading-relaxed max-w-xs">Formations, actualités et conseils pour progresser.</p>
              {newsletterStatus === "success" ? (
                <p role="status" ref={newsletterSuccessRef} tabIndex={-1} className="text-[var(--color-success)] font-ui text-sm font-semibold focus:outline-none">✓ Inscription confirmée. À très vite !</p>
              ) : (
                <form className="flex flex-col gap-2 w-full max-w-xs" onSubmit={handleNewsletter}>
                  <label htmlFor="newsletter-email" className="sr-only">Ton email pour la newsletter</label>
                  <input id="newsletter-email" name="email" type="email" autoComplete="email" required value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Ton email"
                    className="min-h-11 bg-white/5 border border-white/10 rounded-lg px-4 py-3 w-full font-ui text-sm text-white focus:outline-none focus:border-[var(--color-accent-purple)] transition-colors placeholder:text-white/55" />
                  <button type="submit" disabled={newsletterStatus === "loading"} className="min-h-11 bg-white/10 text-white font-ui font-semibold px-4 py-3 rounded-lg hover:bg-white/15 transition-colors text-sm disabled:opacity-60">{newsletterStatus === "loading" ? "Inscription…" : "M’inscrire à la newsletter"}</button>
                  {newsletterStatus === "error" && <p role="alert" className="text-[var(--color-accent-red)] font-ui text-sm">L'inscription a échoué. Réessaie dans un instant.</p>}
                </form>
              )}
              <p className="text-[var(--color-text-sec)] font-ui text-xs mt-3 leading-relaxed max-w-xs">Jamais partagé. Désinscription à tout moment.{" "}<Link to="/confidentialite" className="underline hover:text-white transition-colors">Confidentialité</Link></p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 md:pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[var(--color-text-sec)] font-ui text-xs md:text-sm">© 2026 <span className="font-days-one tracking-normal">MMA IQ</span>. Tous droits réservés.</p>
            <nav aria-label="Liens légaux" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-ui text-xs text-[var(--color-text-sec)]">
              <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link to="/cgv" className="hover:text-white transition-colors">CGV</Link>
            </nav>
            <Link to="/connexion" className="text-[var(--color-text-sec)] hover:text-white font-ui text-xs transition-colors">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
