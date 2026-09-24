/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { AdminProvider } from "./context/adminContext";
import { SiteProvider } from "./context/SiteContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MmaIqAccountProvider } from "./context/MmaIqAccountContext";
import { V3UIProvider } from "./v3/V3UIContext";
import { AdminToolbar } from "./components/admin/AdminToolbar";
import { MediathequeDrawer } from "./components/admin/MediathequeDrawer";

// La home est chargée immédiatement (chemin critique). Les autres pages sont
// découpées en chunks séparés pour alléger le bundle initial du visiteur —
// notamment l'admin (recharts/d3), jamais chargé pour le grand public.
const page = <T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T) =>
  lazy(() => loader().then((module) => ({ default: module[name] as React.ComponentType })));

// Découvrir MMA IQ
const Application = page(() => import("./pages/Application"), "Application");
const PourquoiIQ = page(() => import("./pages/PourquoiIQ"), "PourquoiIQ");
// Profils
const Pratiquant = page(() => import("./pages/Pratiquant"), "Pratiquant");
const Combattant = page(() => import("./pages/Combattant"), "Combattant");
const CoachLanding = page(() => import("./pages/CoachLanding"), "CoachLanding");
const Partenaires = page(() => import("./pages/Partenaires"), "Partenaires");
const Salle = page(() => import("./pages/Salle"), "Salle");
// Offres & paiement
const Pricing = page(() => import("./pages/Pricing"), "Pricing");
const OffreClub = page(() => import("./pages/OffreClub"), "OffreClub");
const Credits = page(() => import("./pages/Credits"), "Credits");
const EssaiVip = page(() => import("./pages/EssaiVip"), "EssaiVip");
const Paiement = page(() => import("./pages/Paiement"), "Paiement");
const Success = page(() => import("./pages/Success"), "Success");
const MonAbonnement = page(() => import("./pages/MonAbonnement"), "MonAbonnement");
const Cancel = page(() => import("./pages/Cancel"), "Cancel");
// Academy
const Instructional = page(() => import("./pages/Instructional"), "Instructional");
const Course = page(() => import("./pages/Course"), "Course");
const MesFormations = page(() => import("./pages/MesFormations"), "MesFormations");
const LectureFormation = page(() => import("./pages/LectureFormation"), "LectureFormation");
const Coach = page(() => import("./pages/Coach"), "Coach");
// Équipement
const Equipement = page(() => import("./pages/Equipement"), "Equipement");
const EquipementCollection = page(() => import("./pages/EquipementCollection"), "EquipementCollection");
const DemandeEquipement = page(() => import("./pages/DemandeEquipement"), "DemandeEquipement");
// Espaces professionnels
const EspaceClub = page(() => import("./pages/EspaceClub"), "EspaceClub");
const CoachDashboard = page(() => import("./pages/CoachDashboard"), "CoachDashboard");
const AccesCoach = page(() => import("./pages/AccesCoach"), "AccesCoach");
// Compte, aide & contact
const Connexion = page(() => import("./pages/Connexion"), "Connexion");
const Inscription = page(() => import("./pages/Inscription"), "Inscription");
const MotDePasseOublie = page(() => import("./pages/MotDePasseOublie"), "MotDePasseOublie");
const ResetPassword = page(() => import("./pages/ResetPassword"), "ResetPassword");
const Aide = page(() => import("./pages/Aide"), "Aide");
const Contact = page(() => import("./pages/Contact"), "Contact");
// Informations légales
const MentionsLegales = page(() => import("./pages/legal/MentionsLegales"), "MentionsLegales");
const Confidentialite = page(() => import("./pages/legal/Confidentialite"), "Confidentialite");
const CGV = page(() => import("./pages/legal/CGV"), "CGV");
// Hors maquette V3
const Blog = page(() => import("./pages/Blog"), "Blog");
const BlogPost = page(() => import("./pages/BlogPost"), "BlogPost");
const Admin = page(() => import("./pages/Admin"), "Admin");
const NotFound = page(() => import("./pages/NotFound"), "NotFound");

function PageLoader() {
  return (
    <div className="flex min-h-[60svh] items-center justify-center bg-v3-fond">
      <div className="size-10 animate-spin rounded-full border-2 border-white/10 border-t-v3-brand" />
    </div>
  );
}

function PasswordRecoveryRedirect() {
  const { passwordRecoveryPending, consumePasswordRecovery, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !passwordRecoveryPending) return;
    // Consommé aussi sur la bonne page : quitter le formulaire ne doit pas
    // réactiver la redirection. Aucun jeton n'est recopié dans la nouvelle URL.
    consumePasswordRecovery();
    if (pathname !== '/connexion/nouveau-mot-de-passe') {
      navigate('/connexion/nouveau-mot-de-passe', { replace: true });
    }
  }, [loading, passwordRecoveryPending, consumePasswordRecovery, pathname, navigate]);

  return null;
}

/** Redirection permanente d'une ancienne URL, en conservant la query string et le hash. */
function Moved({ to }: { to: string }) {
  const { search, hash } = useLocation();
  const params = useParams();
  const target = to.replace(/:(\w+)/g, (_, key: string) => encodeURIComponent(params[key] ?? ""));
  return <Navigate to={`${target}${search}${hash}`} replace />;
}

export default function App() {
  return (
    // reducedMotion="user" : toutes les animations motion/react respectent
    // prefers-reduced-motion sans réglage composant par composant.
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <MmaIqAccountProvider>
          <SiteProvider>
            <AdminProvider>
              <Router>
                <V3UIProvider>
                  <PasswordRecoveryRedirect />
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />

                        {/* 01 · Découvrir MMA IQ */}
                        <Route path="/application" element={<Application />} />
                        <Route path="/pourquoi-iq" element={<PourquoiIQ />} />

                        {/* 02 · Choisir son profil */}
                        <Route path="/pratiquant" element={<Pratiquant />} />
                        <Route path="/combattant" element={<Combattant />} />
                        <Route path="/coach" element={<CoachLanding />} />
                        <Route path="/partenaires" element={<Partenaires />} />
                        <Route path="/s/:slug" element={<Salle />} />

                        {/* 03 · Offres & abonnements — 08 · Paiement — 12 · Confirmations */}
                        <Route path="/tarifs" element={<Pricing />} />
                        <Route path="/tarifs/club" element={<OffreClub />} />
                        <Route path="/credits" element={<Credits />} />
                        <Route path="/essai-vip" element={<EssaiVip />} />
                        <Route path="/paiement/:plan" element={<Paiement />} />
                        <Route path="/success" element={<Success />} />
                        <Route path="/mon-abonnement" element={<MonAbonnement />} />
                        <Route path="/cancel" element={<Cancel />} />

                        {/* 04 · Academy & apprentissage — 11 · Formation en cours & terminée */}
                        <Route path="/academy" element={<Instructional />} />
                        <Route path="/academy/:slug" element={<Course />} />
                        <Route path="/mes-formations" element={<MesFormations />} />
                        <Route path="/mes-formations/:slug" element={<LectureFormation />} />
                        <Route path="/coaches/:slug" element={<Coach />} />

                        {/* 05 · Équipement */}
                        <Route path="/equipement" element={<Equipement />} />
                        <Route path="/equipement/demande" element={<DemandeEquipement />} />
                        <Route path="/equipement/:slug" element={<EquipementCollection />} />

                        {/* 06 · Espaces professionnels — 10 · Accès coach */}
                        <Route path="/espace-club" element={<EspaceClub />} />
                        <Route path="/coach/dashboard" element={<CoachDashboard />} />
                        <Route path="/acces-coach" element={<AccesCoach />} />

                        {/* 07 · Compte, aide & contact — 10 · Récupération du compte */}
                        <Route path="/connexion" element={<Connexion />} />
                        <Route path="/inscription" element={<Inscription />} />
                        <Route path="/connexion/mot-de-passe-oublie" element={<MotDePasseOublie />} />
                        <Route path="/connexion/nouveau-mot-de-passe" element={<ResetPassword />} />
                        <Route path="/aide" element={<Aide />} />
                        <Route path="/contact" element={<Contact />} />

                        {/* 09 · Informations légales */}
                        <Route path="/mentions-legales" element={<MentionsLegales />} />
                        <Route path="/confidentialite" element={<Confidentialite />} />
                        <Route path="/cgv" element={<CGV />} />

                        {/* Hors maquette */}
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />
                        <Route path="/admin" element={<Admin />} />

                        {/* Anciennes adresses */}
                        <Route path="/app" element={<Moved to="/application" />} />
                        <Route path="/about" element={<Moved to="/pourquoi-iq" />} />
                        <Route path="/faq" element={<Moved to="/aide" />} />
                        <Route path="/partenaire" element={<Moved to="/partenaires" />} />
                        <Route path="/instructional" element={<Moved to="/academy" />} />
                        <Route path="/course/:slug" element={<Moved to="/academy/:slug" />} />
                        <Route path="/shop" element={<Moved to="/equipement" />} />
                        <Route path="/product/:slug" element={<Moved to="/equipement" />} />
                        <Route path="/conditions" element={<Moved to="/cgv" />} />

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                  <AdminToolbar />
                  <MediathequeDrawer />
                </V3UIProvider>
              </Router>
            </AdminProvider>
          </SiteProvider>
        </MmaIqAccountProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
