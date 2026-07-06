/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { AppPage } from "./pages/AppPage";
import { Instructional } from "./pages/Instructional";
import { Course } from "./pages/Course";
import { Coach } from "./pages/Coach";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Blog } from "./pages/Blog";
import { BlogPost } from "./pages/BlogPost";
import { About } from "./pages/About";
import { FAQ } from "./pages/FAQ";
import { Contact } from "./pages/Contact";
import { Admin } from "./pages/Admin";
import { CoachDashboard } from "./pages/CoachDashboard";
import { AdminProvider } from "./context/adminContext";
import { SiteProvider } from "./context/SiteContext";
import { AuthProvider } from "./context/AuthContext";
import { AdminToolbar } from "./components/admin/AdminToolbar";
import { MediathequeDrawer } from "./components/admin/MediathequeDrawer";
import { Connexion } from "./pages/Connexion";
import { Success } from "./pages/Success";
import { Cancel } from "./pages/Cancel";

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <AdminProvider>
          <Router>
            <Layout>
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
                <Route path="/admin" element={<Admin />} />
                <Route path="/coach" element={<CoachDashboard />} />
                <Route path="/coach/dashboard" element={<CoachDashboard />} />
                <Route path="/connexion" element={<Connexion />} />
                <Route path="/success" element={<Success />} />
                <Route path="/cancel" element={<Cancel />} />
              </Routes>
            </Layout>
            <AdminToolbar />
            <MediathequeDrawer />
          </Router>
        </AdminProvider>
      </SiteProvider>
    </AuthProvider>
  );
}
