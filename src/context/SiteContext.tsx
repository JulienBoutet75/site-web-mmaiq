import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadSiteContent, saveSiteContent } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Define the structure of the site data
export interface SiteData {
  texts: Record<string, string>;
  images: Record<string, string>;
  videos: Record<string, string>;
  formations: any[];
  blogPosts: any[];
  coaches: any[];
  products: any[];
  faq: any[];
  navLinks: { name: string; path: string }[];
}

const defaultSiteData: SiteData = {
  texts: {
    "home.hero.left.title": "MMA IQ \n APPS",
    "home.hero.left.subtitle": "Application de performance",
    "home.hero.left.button": "Découvrir l'application",
    "home.hero.right.title": "MMA IQ \n ACADEMY",
    "home.hero.right.subtitle": "Coaching vidéo",
    "home.hero.right.button": "Découvrir les coachings",
    "home.why.title": "Pourquoi MMA IQ",
    "home.why.subtitle": "L'Écosystème",
    "home.why.desc": "Centralise et professionnalise ta progression MMA, du débutant au compétiteur. Aide coachs et managers à mieux piloter.",
    "app.hero.title": "La technologie qui prépare les champions.",
    "app.hero.subtitle": "2 000+ combattants actifs",
    "app.hero.desc": "MMA IQ centralise coaching digital, nutrition, analytics et gameplan tactique pour gagner.",
    "app.problem.title": "Le vrai problème",
    "app.problem.subtitle": "Pourquoi 90% des combattants stagnent.",
    "app.piliers.title": "10 systèmes. Un seul objectif.",
    "app.piliers.subtitle": "La suite logicielle la plus complète du marché.",
    "app.feature.title": "L'arme secrète : Gameplan Tactique en 30s",
    "app.feature.desc": "Analyse ton adversaire et génère un plan complet instantanément.",
    "app.pourqui.title": "Fait pour toi.",
    "app.pourqui.subtitle": "Que tu sois au début de ton parcours ou déjà pro.",
    "app.cta.title": "Upgrade your fight.",
    "app.cta.subtitle": "Télécharge gratuitement.",
  },
  images: {
    "home.hero.left.bg": "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/sign/images/22.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMDdhNGVkMS1lZTQ1LTQyYzItOTQ2YS0zYTZlOTZkOTliYjAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvMjIucG5nIiwiaWF0IjoxNzczNTAyMjEyLCJleHAiOjQ5MjcxMDIyMTJ9.Q0RwDHhhZNWda8AQxy6Ly3IjvwuU9WyJNReRZU7nJIE",
    "home.hero.right.bg_v2": "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/sign/images/Coach%20homepage%20rogna%202.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMDdhNGVkMS1lZTQ1LTQyYzItOTQ2YS0zYTZlOTZkOTliYjAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvQ29hY2ggaG9tZXBhZ2Ugcm9nbmEgMi5wbmciLCJpYXQiOjE3NzM1MDgxNjksImV4cCI6MzMzMDk1MDgxNjl9.OhlUEm8dLt28jNzlChjNQFK6jULrYcgzKrmeADMFuoI",
  },
  videos: {},
  formations: [
    {
      id: 1,
      title: "Striking Fundamentals",
      coach: "Johnny Frachey",
      level: "Débutant",
      duration: "6h",
      price: "79€",
      category: "Striking",
      desc: "Construis ta base pieds-poings : posture, déplacements, combos fondamentaux.",
      rating: 4.9,
    },
    {
      id: 2,
      title: "Grappling Systems",
      coach: "Johnny Frachey",
      level: "Amateur",
      duration: "8h",
      price: "99€",
      category: "Grappling",
      desc: "Systèmes de takedown, contrôle au sol et soumissions enchaînées.",
      rating: 4.8,
    },
    {
      id: 3,
      title: "MMA Gameplan Pro",
      coach: "Johnny Frachey",
      level: "Pro",
      duration: "10h",
      price: "149€",
      category: "MMA Gameplan",
      desc: "Construire un gameplan complet : analyse adverse, stratégie par round, ajustements.",
      rating: 5.0,
    },
    {
      id: 4,
      title: "Prépa Mentale Combat",
      coach: "Coach Mental",
      level: "Amateur",
      duration: "4h",
      price: "59€",
      category: "Prépa mentale",
      desc: "Gestion du stress, visualisation, routine pré-combat, mindset compétiteur.",
      rating: 4.7,
    },
    {
      id: 5,
      title: "Cut & Nutrition MMA",
      coach: "Nutritionniste Sport",
      level: "Amateur",
      duration: "3h",
      price: "49€",
      category: "Cut & Nutrition",
      desc: "Protocoles de coupe de poids, nutrition périodisée, hydratation combat.",
      rating: 4.6,
    },
    {
      id: 6,
      title: "Conditioning Camp 8 semaines",
      coach: "Prépa Physique",
      level: "Pro",
      duration: "12h",
      price: "129€",
      category: "Conditioning",
      desc: "Programme complet de prépa physique spécifique MMA sur 8 semaines.",
      rating: 4.9,
    },
  ],
  blogPosts: [],
  coaches: [
    {
      id: 1,
      name: "Johnny Frachey",
      specialties: ["Striking", "MMA Gameplan"],
      bio: "Ancien combattant pro, head coach MMA IQ. Expert en stratégie et striking adapté au MMA.",
      photo_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 2,
      name: "Marc Dubois",
      specialties: ["Grappling", "Luta Livre"],
      bio: "Ceinture noire de Luta Livre, spécialiste des soumissions et du contrôle au sol pour le MMA.",
      photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    }
  ],
  products: [],
  faq: [],
  navLinks: [
    { name: "Application de performance", path: "/app" },
    { name: "Coaching vidéo", path: "/instructional" },
    { name: "Shop", path: "/shop" },
    { name: "Blog", path: "/blog" },
    { name: "À propos", path: "/about" },
    { name: "FAQ", path: "/faq" },
    { name: "Contact", path: "/contact" },
  ],
};

interface SiteContextType {
  isAdmin: boolean;
  siteData: SiteData;
  updateText: (path: string, value: string) => void;
  updateImage: (path: string, value: string) => void;
  updateVideo: (path: string, value: string) => void;
  updateArray: (key: keyof SiteData, index: number, value: any) => void;
  addArrayItem: (key: keyof SiteData, value: any) => void;
  removeArrayItem: (key: keyof SiteData, index: number) => void;
  saveData: () => Promise<void>;
  revertData: () => Promise<void>;
  isMediathequeOpen: boolean;
  setIsMediathequeOpen: (value: boolean) => void;
  mediathequeSelectCallback: ((url: string) => void) | null;
  setMediathequeSelectCallback: (callback: ((url: string) => void) | null) => void;
  openMediathequeForSelection: (callback: (url: string) => void) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const { isAdmin, accessToken } = useAuth();
  const [siteData, setSiteData] = useState<SiteData>(defaultSiteData);
  const [isMediathequeOpen, setIsMediathequeOpen] = useState(false);
  const [mediathequeSelectCallback, setMediathequeSelectCallback] = useState<((url: string) => void) | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await loadSiteContent(accessToken);
      if (data) {
        // Merge with default data to ensure all keys exist
        setSiteData({ ...defaultSiteData, ...data });
      }
    } catch (error) {
      console.error("Failed to load site data:", error);
    }
  };

  const saveData = async () => {
    try {
      await saveSiteContent(siteData, accessToken);
    } catch (error) {
      console.error("Failed to save site data:", error);
      throw error;
    }
  };

  const revertData = async () => {
    await loadData();
  };

  const updateText = (path: string, value: string) => {
    setSiteData((prev) => ({
      ...prev,
      texts: { ...prev.texts, [path]: value },
    }));
  };

  const updateImage = (path: string, value: string) => {
    setSiteData((prev) => {
      const newData = {
        ...prev,
        images: { ...prev.images, [path]: value },
      };
      saveSiteContent(newData, accessToken).catch(console.error);
      return newData;
    });
  };

  const updateVideo = (path: string, value: string) => {
    setSiteData((prev) => {
      const newData = {
        ...prev,
        videos: { ...prev.videos, [path]: value },
      };
      saveSiteContent(newData, accessToken).catch(console.error);
      return newData;
    });
  };

  const updateArray = (key: keyof SiteData, index: number, value: any) => {
    setSiteData((prev) => {
      const arr = [...(prev[key] as any[])];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  };

  const addArrayItem = (key: keyof SiteData, value: any) => {
    setSiteData((prev) => ({
      ...prev,
      [key]: [...(prev[key] as any[]), value],
    }));
  };

  const removeArrayItem = (key: keyof SiteData, index: number) => {
    setSiteData((prev) => {
      const arr = [...(prev[key] as any[])];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
  };

  const openMediathequeForSelection = (callback: (url: string) => void) => {
    setMediathequeSelectCallback(() => callback);
    setIsMediathequeOpen(true);
  };

  return (
    <SiteContext.Provider
      value={{
        isAdmin,
        siteData,
        updateText,
        updateImage,
        updateVideo,
        updateArray,
        addArrayItem,
        removeArrayItem,
        saveData,
        revertData,
        isMediathequeOpen,
        setIsMediathequeOpen,
        mediathequeSelectCallback,
        setMediathequeSelectCallback,
        openMediathequeForSelection,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}
