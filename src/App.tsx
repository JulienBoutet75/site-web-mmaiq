/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { AdminProvider } from "./context/adminContext";
import { SiteProvider } from "./context/SiteContext";
import { AuthProvider } from "./context/AuthContext";
import { AdminToolbar } from "./components/admin/AdminToolbar";
import { MediathequeDrawer } from "./components/admin/MediathequeDrawer";

// La home est chargée immédiatement (chemin critique). Les autres pages sont
// découpées en chunks séparés pour alléger le bundle initial du visiteur —
// notamment l'admin (recharts/d3), jamais chargé pour le grand public.
const AppPage = lazy(() => import("./pages/AppPage").then(m => ({ default: m.AppPage })));
const Instructional = lazy(() => import("./pages/Instructional").then(m => ({ default: m.Instructional })));
const Course = lazy(() => import("./pages/Course").then(m => ({ default: m.Course })));
const Coach = lazy(() => import("./pages/Coach").then(m => ({ default: m.Coach })));
const Shop = lazy(() => import("./pages/Shop").then(m => ({ default: m.Shop })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then(m => ({ default: m.ProductDetail })));
const Blog = lazy(() => import("./pages/Blog").then(m => ({ default: m.Blog })));
const BlogPost = lazy(() => import("./pages/BlogPost").then(m => ({ default: m.BlogPost })));
const About = lazy(() => import("./pages/About").then(m => ({ default: m.About })));
const FAQ = lazy(() => import("./pages/FAQ").then(m => ({ default: m.FAQ })));
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const Pricing = lazy(() => import("./pages/Pricing").then(m => ({ default: m.Pricing })));
const Admin = lazy(() => import("./pages/Admin").then(m => ({ default: m.Admin })));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard").then(m => ({ default: m.CoachDashboard })));
const Connexion = lazy(() => import("./pages/Connexion").then(m => ({ default: m.Connexion })));
const Success = lazy(() => import("./pages/Success").then(m => ({ default: m.Success })));
const Cancel = lazy(() => import("./pages/Cancel").then(m => ({ default: m.Cancel })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-[var(--color-accent-primary)] animate-spin"></div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <AdminProvider>
          <Router>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/app" element={<AppPage />} />
                  <Route path="/instructional" element={<Instructional />} />
                  <Route path="/course/:slug" element={<Course />} />
                  <Route path="/coaches/:slug" element={<Coach />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/tarifs" element={<Pricing />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/coach" element={<CoachDashboard />} />
                  <Route path="/coach/dashboard" element={<CoachDashboard />} />
                  <Route path="/connexion" element={<Connexion />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/cancel" element={<Cancel />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
            <AdminToolbar />
            <MediathequeDrawer />
          </Router>
        </AdminProvider>
      </SiteProvider>
    </AuthProvider>
  );
}
