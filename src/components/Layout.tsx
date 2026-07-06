import { useState, useEffect, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Pencil, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useSite } from "../context/SiteContext";

export function Layout({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { siteData, isAdmin, updateArray } = useSite();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navLinks = siteData.navLinks;

  const handleEditNavLink = (index: number) => {
    const newName = prompt("Nouveau nom pour le lien :", navLinks[index].name);
    if (newName && newName !== navLinks[index].name) {
      updateArray("navLinks", index, { ...navLinks[index], name: newName });
    }
  };

  const isNoLayoutPage = location.pathname.startsWith('/admin') || 
                        location.pathname.startsWith('/coach/') || 
                        location.pathname === '/coach' ||
                        location.pathname.startsWith('/connexion');

  if (isNoLayoutPage) {
    return <main className="min-h-screen bg-[#0a0a0a]">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          isScrolled
            ? "bg-[#141414]/70 backdrop-blur-xl border-b border-white/5 py-2 md:py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-transparent py-3 md:py-6"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/sign/images/Logo%20a%20utiliser%202.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMDdhNGVkMS1lZTQ1LTQyYzItOTQ2YS0zYTZlOTZkOTliYjAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvTG9nbyBhIHV0aWxpc2VyIDIucG5nIiwiaWF0IjoxNzczNTAzMTcwLCJleHAiOjMzMzA5NTAzMTcwfQ.libjWsTPSMqdt8facRAR3rSjOqBWiqJfd2_F1zm-xQ8" alt="MMA IQ Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0" referrerPolicy="no-referrer" />
            <img src="https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/sign/images/mma%20iq%20ecriture%202.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMDdhNGVkMS1lZTQ1LTQyYzItOTQ2YS0zYTZlOTZkOTliYjAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvbW1hIGlxIGVjcml0dXJlIDIucG5nIiwiaWF0IjoxNzczNTAzMjAwLCJleHAiOjMzMzA5NTAzMjAwfQ.Rv6YtOoaKm2CWCP-WxX5Q2c2RUa_cqNaMl2Dpt8aFeE" alt="MMA IQ" className="h-3 md:h-[18px] object-contain" referrerPolicy="no-referrer" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link, index) => (
              <div key={link.name} className="relative group/nav">
                <Link
                  to={link.path}
                  className={`font-ui text-sm font-semibold tracking-wide transition-all duration-300 hover:text-white hover:-translate-y-0.5 ${
                    location.pathname === link.path
                      ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      : "text-[var(--color-text-sec)]"
                  }`}
                >
                  {link.name}
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => handleEditNavLink(index)}
                    className="absolute -top-4 -right-4 bg-purple-600 p-1 rounded-full opacity-0 group-hover/nav:opacity-100 transition-opacity"
                  >
                    <Pencil size={10} className="text-white" />
                  </button>
                )}
              </div>
            ))}
            
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <button className="text-[var(--color-text-sec)] hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                <Search size={20} />
              </button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <Link 
                  to="/" 
                  className="group relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a0a1a] text-white font-ui font-bold text-[10px] tracking-[0.25em] border border-white/10 hover:border-[#a020f0]/50 transition-all duration-700 hover:shadow-[0_0_30px_rgba(160,32,240,0.4)] overflow-hidden"
                >
                  {/* Animated Border Beam */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0%,transparent_40%,#a020f0_50%,transparent_60%,transparent_100%)] animate-[spin_3s_linear_infinite]" />
                  </div>
                  
                  {/* Inner Content Background to mask the beam */}
                  <div className="absolute inset-[1px] rounded-full bg-[#0a0a1a] z-0" />
                  
                  {/* Glassy overlay */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  
                  {/* Subtle Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out z-20" />
                  
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a020f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-30 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_5px_rgba(160,32,240,0.5)]"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span className="relative z-30">ACCUEIL</span>
                </Link>
              </motion.div>
              {isAdmin && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    to="/admin" 
                    className="group relative flex items-center gap-2 px-5 py-2 rounded-full bg-[#a020f0] text-white font-ui font-bold text-[10px] uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(160,32,240,0.3)] hover:shadow-[0_0_30px_rgba(160,32,240,0.6)] transition-all duration-500 hover:-translate-y-0.5 border border-white/20 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                    <ShieldCheck size={14} className="relative z-10 group-hover:rotate-12 transition-transform" />
                    <span className="relative z-10">MODE SUPER ADMIN</span>
                  </Link>
                </motion.div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white hover:text-[var(--color-accent-purple)] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-[#0a0a0a]/98 backdrop-blur-2xl z-[50] flex flex-col pt-28 px-8 transition-all duration-500 ease-out ${
          isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
        } lg:hidden overflow-hidden`}
      >
        {/* Subtle background glow and vertical lightnings */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent-red)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-accent-primary)]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-70">
          <svg className="absolute left-[10%] top-0 w-32 h-full text-[var(--color-accent-red)]" preserveAspectRatio="none" viewBox="0 0 100 1000" style={{ animation: 'lightning-flash-vertical 5s infinite 0.5s' }}>
            <path d="M50,0 L20,150 L60,200 L10,450 L70,500 L30,750 L80,800 L40,1000" fill="none" stroke="currentColor" strokeWidth="3" filter="drop-shadow(0 0 15px currentColor)" />
          </svg>
          <svg className="absolute right-[10%] top-0 w-32 h-full text-[var(--color-accent-red)]" preserveAspectRatio="none" viewBox="0 0 100 1000" style={{ animation: 'lightning-flash-vertical 7s infinite 2.5s' }}>
            <path d="M50,0 L80,200 L30,250 L90,550 L40,600 L70,850 L20,900 L60,1000" fill="none" stroke="currentColor" strokeWidth="2.5" filter="drop-shadow(0 0 12px currentColor)" />
          </svg>
          <svg className="absolute left-[45%] top-0 w-40 h-full text-[var(--color-accent-red)]" preserveAspectRatio="none" viewBox="0 0 100 1000" style={{ animation: 'lightning-flash-vertical 6s infinite 4s' }}>
            <path d="M50,0 L30,180 L70,220 L20,480 L80,520 L40,780 L90,820 L50,1000" fill="none" stroke="currentColor" strokeWidth="2" filter="drop-shadow(0 0 10px currentColor)" />
          </svg>
        </div>

        <nav className="flex flex-col gap-4 relative z-10">
          <Link
            to="/"
            className="relative font-display text-2xl md:text-3xl border-b border-white/10 pb-4 transition-all duration-300 flex items-center justify-between group uppercase tracking-wider active:scale-95 active:text-[var(--color-accent-red)]"
            style={{
              transform: isMobileMenuOpen ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
              opacity: isMobileMenuOpen ? 1 : 0,
              transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          >
            {/* Continuous sleek red line on the border */}
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] overflow-hidden">
              <div 
                className="w-full h-full bg-gradient-to-r from-transparent via-[var(--color-accent-red)] to-transparent -translate-x-full opacity-70" 
                style={{ animation: 'line-sweep 3s infinite ease-in-out' }} 
              />
            </div>
            
            <span className="relative z-10 flex-1 pr-4 whitespace-normal text-left leading-tight">Accueil</span>
            <span className="relative z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all duration-300 group-active:bg-[var(--color-accent-red)] group-active:scale-110 shadow-[0_0_15px_rgba(255,23,68,0.3)] animate-[pulse_2s_infinite] shrink-0">
              <span className="text-sm font-bold text-[var(--color-accent-red)] group-active:text-white">→</span>
            </span>
          </Link>
          {navLinks.map((link, index) => (
            <div key={link.name} className="relative group/nav-mobile">
              <Link
                to={link.path}
                className={`relative font-display text-2xl md:text-3xl border-b border-white/10 pb-4 transition-all duration-300 flex items-center justify-between group uppercase tracking-wider active:scale-95 active:text-[var(--color-accent-red)] ${
                  location.pathname === link.path ? "text-[var(--color-accent-red)]" : "text-white/80"
                }`}
                style={{
                  transitionDelay: isMobileMenuOpen ? `${(index + 1) * 50}ms` : '0ms',
                  transform: isMobileMenuOpen ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
              >
                {/* Continuous sleek red line on the border, staggered */}
                <div className="absolute bottom-[-1px] left-0 w-full h-[2px] overflow-hidden">
                  <div 
                    className="w-full h-full bg-gradient-to-r from-transparent via-[var(--color-accent-red)] to-transparent -translate-x-full opacity-70" 
                    style={{ animation: `line-sweep 3s infinite ${(index + 1) * 0.2}s ease-in-out` }} 
                  />
                </div>
                
                <span className="relative z-10 flex-1 pr-4 whitespace-normal text-left leading-tight">{link.name}</span>
                <span className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-110 shadow-[0_0_15px_rgba(255,23,68,0.3)] animate-[pulse_2s_infinite] shrink-0 ${
                  location.pathname === link.path ? "bg-[var(--color-accent-red)] text-white" : "bg-white/5 group-active:bg-[var(--color-accent-red)]"
                }`}>
                  <span className={`text-sm font-bold ${location.pathname === link.path ? "text-white" : "text-[var(--color-accent-red)] group-active:text-white"}`}>→</span>
                </span>
              </Link>
              {isAdmin && (
                <button
                  onClick={() => handleEditNavLink(index)}
                  className="absolute top-1 right-12 bg-purple-600 p-2 rounded-full opacity-100 z-20 shadow-lg"
                >
                  <Pencil size={14} className="text-white" />
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      <main className="flex-grow">{children}</main>

      <footer className="bg-[#141414] border-t border-white/10 pt-12 md:pt-20 pb-8 md:pb-10 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_center,rgba(160,32,240,0.05)_0%,transparent_60%)] pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
            <div className="lg:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
              <Link to="/" className="flex items-center gap-2 group mb-4 md:mb-6 inline-flex">
                <img src="https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/sign/images/Logo%20a%20utiliser%202.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMDdhNGVkMS1lZTQ1LTQyYzItOTQ2YS0zYTZlOTZkOTliYjAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvTG9nbyBhIHV0aWxpc2VyIDIucG5nIiwiaWF0IjoxNzczNTAzMTcwLCJleHAiOjMzMzA5NTAzMTcwfQ.libjWsTPSMqdt8facRAR3rSjOqBWiqJfd2_F1zm-xQ8" alt="MMA IQ Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0" referrerPolicy="no-referrer" />
                <img src="https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/sign/images/mma%20iq%20ecriture%202.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMDdhNGVkMS1lZTQ1LTQyYzItOTQ2YS0zYTZlOTZkOTliYjAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvbW1hIGlxIGVjcml0dXJlIDIucG5nIiwiaWF0IjoxNzczNTAzMjAwLCJleHAiOjMzMzA5NTAzMjAwfQ.Rv6YtOoaKm2CWCP-WxX5Q2c2RUa_cqNaMl2Dpt8aFeE" alt="MMA IQ" className="h-3 md:h-[18px] object-contain" referrerPolicy="no-referrer" />
              </Link>
              <p className="text-[var(--color-text-sec)] font-ui text-xs md:text-sm leading-relaxed max-w-xs mb-4">
                La plateforme de performance MMA. Application de performance + coaching vidéo +
                équipement. Upgrade your fight.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 lg:col-span-2 text-center md:text-left">
              <div>
                <h4 className="font-display text-base md:text-lg mb-4 md:mb-6 text-white/90">PLATEFORME</h4>
                <ul className="flex flex-col gap-3 md:gap-4 font-ui text-xs md:text-sm text-[var(--color-text-sec)]">
                  <li>
                    <Link
                      to="/app"
                      className="hover:text-[var(--color-accent-purple)] transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-[var(--color-accent-purple)] opacity-0 -ml-3 transition-all hidden md:block"></span>
                      Application
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/instructional"
                      className="hover:text-[var(--color-accent-red)] transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-[var(--color-accent-red)] opacity-0 -ml-3 transition-all hidden md:block"></span>
                      Coaching vidéo
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/shop"
                      className="hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-white opacity-0 -ml-3 transition-all hidden md:block"></span>
                      Shop
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/blog"
                      className="hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-white opacity-0 -ml-3 transition-all hidden md:block"></span>
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-display text-base md:text-lg mb-4 md:mb-6 text-white/90">RESSOURCES</h4>
                <ul className="flex flex-col gap-3 md:gap-4 font-ui text-xs md:text-sm text-[var(--color-text-sec)]">
                  <li>
                    <Link
                      to="/blog"
                      className="hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-white opacity-0 -ml-3 transition-all hidden md:block"></span>
                      Interviews
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      className="hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-white opacity-0 -ml-3 transition-all hidden md:block"></span>
                      À propos
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faq"
                      className="hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-white opacity-0 -ml-3 transition-all hidden md:block"></span>
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-white opacity-0 -ml-3 transition-all hidden md:block"></span>
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/connexion"
                      className="hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-[var(--color-accent-purple)] opacity-0 -ml-3 transition-all hidden md:block"></span>
                      Admin
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="font-display text-base md:text-lg mb-4 md:mb-6 text-white/90">NEWSLETTER</h4>
              <p className="text-[var(--color-text-sec)] font-ui text-xs md:text-sm mb-4 leading-relaxed max-w-xs">
                Instructional, actus, méthode. Pas de spam, que du concret.
              </p>
              <form className="flex gap-2 w-full max-w-xs" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Email"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 md:px-4 w-full font-ui text-xs md:text-sm text-white focus:outline-none focus:border-[var(--color-accent-purple)] focus:bg-white/10 transition-all placeholder:text-white/30"
                />
                <button className="bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)] text-white font-ui font-bold px-3 py-2 md:px-4 rounded-lg hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(160,32,240,0.3)] text-sm shrink-0">
                  OK
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 md:pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[var(--color-text-sec)] font-ui text-xs md:text-sm">
              © 2026 <span className="font-days-one tracking-normal">MMA IQ</span> — Perf Lab System. Tous droits réservés.
            </p>
            <div className="flex gap-6 md:gap-4">
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                <span className="sr-only">YouTube</span>
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
