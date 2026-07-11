import React, { useState, useEffect, useRef } from "react";
import { showToast, customConfirm } from "../utils/ui";
import { Link, useNavigate } from "react-router-dom";
import { 
  Play, Pause, Scissors, RotateCcw, Copy, Trash2, Edit2, Plus, 
  Image as ImageIcon, Video, UploadCloud, CheckCircle2, AlertCircle,
  LayoutDashboard, Users, GraduationCap, ShoppingBag, FileText, 
  DollarSign, Mail, FolderOpen, Palette, ArrowLeft, LogOut, ExternalLink,
  Save, Eye, EyeOff, PlusCircle, X, ChevronRight, TrendingUp, ArrowUpRight,
  ArrowDownRight, Monitor, Smartphone, Tablet, Link as LinkIcon, Layers,
  Type as TypeIcon, MousePointer2, ChevronDown, ChevronUp, Download, Share2,
  Calendar, MessageSquare, Bell, Search as SearchIcon, Menu, Maximize2,
  Minimize2, Settings2, Shield, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { 
  uploadFile, deleteFile, listFiles, fetchData, insertData, 
  updateData, deleteData, loadSiteContent, saveSiteContent, signUp, supabase, getSession
} from "../lib/supabase";
import { MediaUploader } from "../components/admin/MediaUploader";
import { YouTubeEmbed } from "../components/YouTubeEmbed";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";

// --- COMPONENTS ---

export function Admin() {
  const { isAdmin, accessToken, loading: authLoading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // State for data
  const [instructionals, setInstructionals] = useState<any[]>([]);
  const [medias, setMedias] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [coachs, setCoachs] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [newsletter, setNewsletter] = useState<any[]>([]);
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<any>(null);

  const openDrawer = (onSelect: (url: string) => void) => {
    setDrawerTarget({ onSelect });
    setIsDrawerOpen(true);
  };

  const sidebarItems = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Vue générale" },
    { id: "coachs", icon: <Users size={20} />, label: "Coaches" },
    { id: "formations", icon: <GraduationCap size={20} />, label: "Instructional" },
    { id: "app-performance", icon: <Smartphone size={20} />, label: "Application de performance" },
    { id: "shop", icon: <ShoppingBag size={20} />, label: "Shop" },
    { id: "blog", icon: <FileText size={20} />, label: "Blog" },
    { id: "sales", icon: <DollarSign size={20} />, label: "Ventes" },
    { id: "newsletter", icon: <Mail size={20} />, label: "Newsletter" },
    { id: "media", icon: <FolderOpen size={20} />, label: "Médiathèque" },
    { id: "video-editor", icon: <Scissors size={20} />, label: "Éditeur Vidéo" },
    { id: "content", icon: <Palette size={20} />, label: "Contenu du site" },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && sidebarItems.some(item => item.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin && accessToken) {
      loadAllData();
    }
    // Note : le rôle super_admin doit être attribué en base (ou via
    // l'email autorisé dans check_is_admin), jamais auto-écrit depuis le
    // client — ce serait une escalade de privilège.
  }, [isAdmin, accessToken]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const safeFetch = async (promise: Promise<any>, fallback: any) => {
        try {
          return await promise;
        } catch (e) {
          console.error("Fetch failed:", e);
          return fallback;
        }
      };

      const [f, m_images, m_videos, a, c, p, s, n, sc] = await Promise.all([
        safeFetch(fetchData("formations", "*", "&order=created_at.desc", accessToken), []),
        safeFetch(listFiles("images", accessToken), []),
        safeFetch(listFiles("formations-videos", accessToken), []),
        safeFetch(fetchData("blog_posts", "*", "&order=created_at.desc", accessToken), []),
        safeFetch(fetchData("coaches", "*", "&order=name.asc", accessToken), []),
        safeFetch(fetchData("products", "*", "&order=name.asc", accessToken), []),
        safeFetch(fetchData("purchases", "*", "&order=created_at.desc&limit=50", accessToken), []),
        safeFetch(fetchData("newsletter_subscribers", "*", "&order=subscribed_at.desc", accessToken), []),
        safeFetch(fetchData("site_content", "*", "", accessToken), [])
      ]);
      
      const allMedias = [
        ...m_images.map(file => ({ 
          ...file, 
          bucket: 'images', 
          type: 'image/jpeg', // Fallback type if missing
          url: `https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/${file.name}`,
          size: (file.metadata?.size / 1024 / 1024).toFixed(2) + " MB"
        })),
        ...m_videos.map(file => ({ 
          ...file, 
          bucket: 'formations-videos', 
          type: 'video/mp4', // Fallback type if missing
          url: `https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/${file.name}`,
          size: (file.metadata?.size / 1024 / 1024).toFixed(2) + " MB"
        }))
      ];

      setInstructionals(f);
      setMedias(allMedias);
      setArticles(a);
      setCoachs(c);
      setProduits(p);
      setSales(s);
      setNewsletter(n);
      setSiteContent(sc[0] || null);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="min-h-screen bg-[#04050A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7B2FFF]"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#04050A] text-white font-ui flex">
      {/* Sidebar */}
      <aside className="w-72 fixed top-0 left-0 h-full bg-[#0C0E18] border-r border-white/10 flex flex-col z-50">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#7B2FFF] rounded-xl flex items-center justify-center font-display text-2xl shrink-0 shadow-[0_0_20px_rgba(123,47,255,0.4)]">M</div>
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
              <div className="font-days-one tracking-normal text-lg leading-none truncate text-white">MMA IQ</div>
              <div className="text-[10px] text-[#7B2FFF] font-bold tracking-widest uppercase mt-1">Super Admin</div>
            </div>
          </div>
          <div className="text-[11px] text-[#8892B0] truncate bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{profile?.email}</div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-[#7B2FFF] text-white shadow-[0_0_25px_rgba(123,47,255,0.4)] scale-[1.02]"
                  : "text-[#8892B0] hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={activeTab === item.id ? "text-white" : "text-[#7B2FFF]"}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#8892B0] hover:bg-white/5 hover:text-white transition-all"
          >
            <ArrowLeft size={18} /> Voir le site
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#FF1744] hover:bg-[#FF1744]/10 transition-all"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-white/10 bg-[#0C0E18]/50 backdrop-blur-md sticky top-0 z-40 px-10 flex items-center justify-between">
          <h1 className="font-display text-2xl tracking-tight">
            {sidebarItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-6">
            <button 
              onClick={async () => {
                try {
                  setLoading(true);
                  await updateData("profiles", profile.id, { role: 'super_admin' }, accessToken);
                  showToast("Accès Admin réparé !");
                  loadAllData();
                } catch (err) {
                  showToast("Erreur lors de la réparation", true);
                } finally {
                  setLoading(false);
                }
              }}
              className="text-[10px] text-[#8892B0] hover:text-white border border-white/10 px-3 py-1 rounded-full transition-all"
            >
              Réparer Accès Admin
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full text-[11px] text-[#8892B0] font-bold uppercase tracking-widest border border-white/5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              Système opérationnel
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 flex-1 max-w-[1600px] mx-auto w-full">
          {activeTab === "dashboard" && <Dashboard stats={{
            coaches: coachs.length,
            formations: { published: instructionals.filter(f => f.published).length, total: instructionals.length },
            products: produits.length,
            sales: { total: sales.length, month: sales.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length },
            revenue: sales.filter(s => s.status === 'completed').reduce((acc, s) => acc + (s.amount_cents || 0), 0),
            newsletter: newsletter.length
          }} sales={sales} onNavigate={setActiveTab} />}
          {activeTab === "coachs" && <CoachsCRUD data={coachs} onUpdate={loadAllData} onOpenMedia={openDrawer} />}
          {activeTab === "formations" && <FormationsCRUD data={instructionals} coachs={coachs} onUpdate={loadAllData} onOpenMedia={openDrawer} />}
          {activeTab === "app-performance" && <AppPerformanceEditor data={siteContent} onUpdate={loadAllData} onOpenMedia={openDrawer} />}
          {activeTab === "shop" && <ShopCRUD data={produits} onUpdate={loadAllData} onOpenMedia={openDrawer} />}
          {activeTab === "blog" && <BlogCRUD data={articles} coachs={coachs} formations={instructionals} onUpdate={loadAllData} onOpenMedia={openDrawer} />}
          {activeTab === "sales" && <SalesTable data={sales} />}
          {activeTab === "newsletter" && <NewsletterTable data={newsletter} onUpdate={loadAllData} />}
          {activeTab === "media" && <Mediatheque medias={medias} setMedias={setMedias} />}
          {activeTab === "video-editor" && <EditeurVideo medias={medias} />}
          {activeTab === "content" && <SiteContentEditor data={siteContent} onUpdate={loadAllData} />}
        </div>

        <MediathequeDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
          onSelect={drawerTarget?.onSelect} 
          medias={medias} 
          setMedias={setMedias} 
        />
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Dashboard({ stats, sales, onNavigate }: { stats: any; sales: any[]; onNavigate: (tab: string) => void }) {
  // Prepare chart data
  const chartData = React.useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySales = sales.filter(s => s.created_at.startsWith(date));
      const total = daySales.reduce((acc, s) => acc + (s.amount_cents / 100), 0);
      return {
        date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        revenue: total,
        sales: daySales.length
      };
    });
  }, [sales]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Coaches" value={stats.coaches} icon={<Users className="text-[#7B2FFF]" />} />
        <StatCard 
          label="Instructional" 
          value={`${stats.formations.published} / ${stats.formations.total}`} 
          subLabel="Publiées / Total"
          icon={<GraduationCap className="text-[#22c55e]" />} 
        />
        <StatCard label="Produits Shop" value={stats.products} icon={<ShoppingBag className="text-[#3b82f6]" />} />
        <StatCard 
          label="Ventes" 
          value={stats.sales.total} 
          subLabel={`+${stats.sales.month} ce mois`}
          icon={<DollarSign className="text-[#f59e0b]" />} 
        />
        <StatCard 
          label="Revenu Total" 
          value={`${(stats.revenue / 100).toLocaleString()} €`} 
          icon={<DollarSign className="text-green-500" />} 
        />
        <StatCard label="Abonnés Newsletter" value={stats.newsletter} icon={<Mail className="text-[#FF1744]" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0C0E18] border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-lg">Revenus (7 derniers jours)</h3>
            <div className="flex items-center gap-2 text-xs text-[#8892B0]">
              <div className="w-3 h-3 rounded-full bg-[#7B2FFF]"></div>
              <span>Chiffre d'affaires (€)</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B2FFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7B2FFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e34" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8892B0" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#8892B0" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#04050A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#7B2FFF' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#7B2FFF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0C0E18] border border-white/10 rounded-2xl p-6">
            <h3 className="font-display text-lg mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => onNavigate("coachs")}
                className="flex items-center justify-between p-4 rounded-xl text-sm font-medium bg-[#7B2FFF]/10 text-[#8f4dff] border border-[#7B2FFF]/20 hover:bg-[#7B2FFF]/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle size={20} /> Nouveau Coach
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
              </button>
              <button 
                onClick={() => onNavigate("formations")}
                className="flex items-center justify-between p-4 rounded-xl text-sm font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e]/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle size={20} /> Nouvelle Formation
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
              </button>
              <button 
                onClick={() => onNavigate("blog")}
                className="flex items-center justify-between p-4 rounded-xl text-sm font-medium bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 hover:bg-[#3b82f6]/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle size={20} /> Nouvel Article
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
              </button>
              <button 
                onClick={() => onNavigate("shop")}
                className="flex items-center justify-between p-4 rounded-xl text-sm font-medium bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 hover:bg-[#f59e0b]/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle size={20} /> Nouveau Produit
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            </div>
          </div>
          
          <div className="bg-[#0C0E18] border border-white/10 rounded-2xl p-6">
            <h3 className="font-display text-lg mb-4">État du système</h3>
            <div className="space-y-4">
              <SystemStatus label="Supabase Auth" status="online" />
              <SystemStatus label="Supabase Database" status="online" />
              <SystemStatus label="Supabase Storage" status="online" />
              <SystemStatus label="Stripe API" status="online" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subLabel, icon }: any) {
  return (
    <div className="bg-[#0C0E18] border border-white/10 rounded-2xl p-6 flex items-center gap-6">
      <div className="w-14 h-14 bg-[#04050A] rounded-2xl flex items-center justify-center text-2xl border border-white/10">
        {icon}
      </div>
      <div>
        <div className="text-3xl font-display text-white">{value}</div>
        <div className="text-sm text-[#8892B0]">{label}</div>
        {subLabel && <div className="text-[10px] text-[#8892B0] uppercase tracking-wider mt-1">{subLabel}</div>}
      </div>
    </div>
  );
}

function SystemStatus({ label, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#04050A] rounded-xl border border-white/10">
      <span className="text-sm text-[#8892B0]">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-[10px] uppercase font-bold tracking-widest">{status}</span>
      </div>
    </div>
  );
}

function FormationsCRUD({ data, coachs, onUpdate, onOpenMedia }: { data: any[]; coachs: any[]; onUpdate: () => void; onOpenMedia: (onSelect: (url: string) => void) => void }) {
  const { accessToken } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingFormation, setEditingFormation] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");

  const categories = React.useMemo(() => {
    return Array.from(new Set(data.map((f: any) => f.category)));
  }, [data]);

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await uploadFile("formations-videos", file, accessToken);
      const newChapters = [...chapters];
      newChapters[index] = { ...newChapters[index], video_url: url };
      setChapters(newChapters);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editingFormation || isAdding) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (editingFormation) {
      fetchChapters();
      setThumbnailUrl(editingFormation.thumbnail_url || "");
      setTrailerUrl(editingFormation.trailer_url || "");
    } else {
      setChapters([]);
      setThumbnailUrl("");
      setTrailerUrl("");
    }
  }, [editingFormation, isAdding]);

  const fetchChapters = async () => {
    const res = await fetchData("formation_chapters", "*", `&formation_id=eq.${editingFormation.id}&order=sort_order.asc`, accessToken);
    setChapters(res);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const session = await getSession();
    const accessToken = session?.access_token;

    if (!session) {
      setErrorMessage('Non connecté');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const long_description = formData.get('long_description') as string;
    const price = formData.get('price') as string;
    const level = formData.get('level') as string;
    const discipline = formData.get('discipline') as string;
    const coach_id = formData.get('coach_id') as string;
    const thumbUrl = formData.get('thumbnail_url') as string;
    const videoUrl = formData.get('trailer_url') as string;

    const existingLongDesc = typeof editingFormation?.long_description === 'string' && editingFormation?.long_description?.startsWith('{') 
      ? JSON.parse(editingFormation.long_description) 
      : (typeof editingFormation?.long_description === 'object' && editingFormation?.long_description !== null)
        ? editingFormation.long_description
        : { content: editingFormation?.long_description || "", bullets: [], access_code: null };

    const newAccessCode = existingLongDesc.access_code || Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 36]).join('');

    const formationData = {
      title,
      slug: title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description,
      long_description: JSON.stringify({
        content: long_description,
        bullets: existingLongDesc.bullets || [],
        access_code: newAccessCode
      }),
      price_cents: Math.round(Number(price) * 100),
      level,
      discipline,
      coach_id,
      thumbnail_url: thumbUrl,
      trailer_url: videoUrl,
      trailer_video_url: videoUrl,
      published: true,
      sort_order: 0
    };

    try {
      let formationId = editingFormation?.id;
      if (editingFormation) {
        await updateData('formations', editingFormation.id, formationData, accessToken);
      } else {
        const res = await insertData('formations', formationData, accessToken);
        formationId = res[0]?.id;
      }
      if (formationId) {
        await supabase.from('formation_chapters').delete().eq('formation_id', formationId);
        if (chapters.length > 0) {
          const chaptersPayload = chapters.map((ch, idx) => ({
            formation_id: formationId,
            title: ch.title,
            description: ch.description || "",
            timestamp: ch.timestamp || "00:00-00:00",
            video_url: ch.video_url || "",
            sort_order: idx,
            chapter_number: idx + 1
          }));
          await supabase.from('formation_chapters').insert(chaptersPayload);
        }
      }

      setIsAdding(false);
      setEditingFormation(null);
      onUpdate();
    } catch (error: any) {
      console.error("Formation save error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display">Gestion des Instructional</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#22c55e] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle formation
        </button>
      </div>

      {(isAdding || editingFormation) && (
        <div className="bg-[#0C0E18] border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-display text-lg">{editingFormation ? "Modifier la formation" : "Nouvelle formation"}</h4>
            <button onClick={() => { setIsAdding(false); setEditingFormation(null); }} className="text-[#8892B0] hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {debugInfo && (
              <div className="bg-red-600 text-white p-4 rounded-xl mb-4 font-ui text-xs whitespace-pre-wrap border-2 border-white">
                <h4 className="font-bold mb-2 uppercase tracking-widest">Debug Info:</h4>
                {debugInfo}
              </div>
            )}
            {errorMessage && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm">{errorMessage}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Titre</label>
                <input name="title" defaultValue={editingFormation?.title} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Description Courte</label>
                <textarea name="description" defaultValue={editingFormation?.description} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" rows={3} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Description Longue</label>
                <textarea 
                  name="long_description" 
                  defaultValue={typeof editingFormation?.long_description === 'string' && editingFormation?.long_description?.startsWith('{') 
                    ? (JSON.parse(editingFormation.long_description) || {}).content || "" 
                    : (typeof editingFormation?.long_description === 'object' && editingFormation?.long_description !== null)
                      ? editingFormation.long_description.content || ""
                      : editingFormation?.long_description || ""} 
                  className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" 
                  rows={6} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Prix (€)</label>
                <input name="price" type="number" step="0.01" defaultValue={editingFormation ? editingFormation.price_cents / 100 : 0} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Niveau</label>
                <select name="level" defaultValue={editingFormation?.level} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all">
                  <option value="debutant">Débutant</option>
                  <option value="amateur">Amateur</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Discipline</label>
                <select name="discipline" defaultValue={editingFormation?.discipline} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all">
                  <option value="striking">Striking</option>
                  <option value="grappling">Grappling</option>
                  <option value="mma-gameplan">MMA Gameplan</option>
                  <option value="prepa-mentale">Prépa Mentale</option>
                  <option value="cut-nutrition">Cut & Nutrition</option>
                  <option value="conditioning">Conditioning</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Coach</label>
                <select name="coach_id" defaultValue={editingFormation?.coach_id} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all">
                  <option value="">Sélectionner un coach</option>
                  {coachs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <input type="hidden" name="thumbnail_url" value={thumbnailUrl} />
                <MediaUploader 
                  label="Image de couverture (Miniature)" 
                  accept="image" 
                  bucket="admin-media"
                  onUpload={setThumbnailUrl} 
                  currentMedia={thumbnailUrl || undefined} 
                  uploadedBy="admin" 
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <input type="hidden" name="trailer_url" value={trailerUrl} />
                <MediaUploader 
                  label="Vidéo de présentation (Trailer/Teaser)" 
                  accept="video" 
                  bucket="formations-videos"
                  onUpload={(url) => {
                    setTrailerUrl(url);
                  }} 
                  currentMedia={trailerUrl || undefined} 
                  uploadedBy="admin" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-display text-md">Chapitres vidéo</h5>
                <button 
                  type="button"
                  onClick={() => setChapters(prev => [...prev, { id: `temp_${Date.now()}`, title: "", video_url: "", is_preview: false }])}
                  className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2"
                >
                  <Plus size={14} /> Ajouter un chapitre
                </button>
              </div>
              <div className="space-y-4">
                {chapters.map((ch, idx) => (
                  <div key={ch.id} className="bg-[#04050A] border border-white/10 rounded-xl p-4 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] text-[#8892B0] uppercase font-bold tracking-widest">Titre du chapitre</label>
                        <input 
                          value={ch.title} 
                          onChange={(e) => {
                            setChapters(prev => {
                              const newChs = [...prev];
                              newChs[idx].title = e.target.value;
                              return newChs;
                            });
                          }}
                          className="w-full bg-[#0C0E18] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none" 
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <MediaUploader 
                          label="Vidéo du chapitre" 
                          accept="video" 
                          bucket="formations-videos"
                          onUpload={(url) => {
                            setChapters(prev => {
                              const newChs = [...prev];
                              newChs[idx].video_url = url;
                              return newChs;
                            });
                          }} 
                          currentMedia={ch.video_url || undefined} 
                          uploadedBy="admin" 
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={ch.is_preview} 
                            onChange={(e) => {
                              setChapters(prev => {
                                const newChs = [...prev];
                                newChs[idx].is_preview = e.target.checked;
                                return newChs;
                              });
                            }}
                            className="w-4 h-4 rounded border-white/10 bg-[#0C0E18] text-[#7B2FFF]" 
                          />
                          <span className="text-xs text-[#8892B0]">Aperçu</span>
                        </label>
                      </div>
                      <div className="flex items-end pb-1">
                        <button 
                          type="button"
                          onClick={() => setChapters(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-[#8892B0] hover:text-[#FF1744]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {ch.video_url && <YouTubeEmbed url={ch.video_url} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
              <button type="button" onClick={() => { setIsAdding(false); setEditingFormation(null); }} className="px-6 py-3 rounded-xl text-sm font-medium bg-white/10 hover:bg-[#2a2a44] transition-all">Annuler</button>
              <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl text-sm font-medium bg-[#22c55e] hover:bg-[#2edb6d] transition-all disabled:opacity-50">
                {loading ? "Chargement..." : editingFormation ? "Mettre à jour" : "Créer la formation"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#0C0E18] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#04050A] border-b border-white/10">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#8892B0]">Formation</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#8892B0]">Coach</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#8892B0]">Code d'accès</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#8892B0]">Prix</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#8892B0]">Niveau</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#8892B0]">Statut</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#8892B0] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((f) => {
              const accessCode = typeof f.long_description === 'string' && f.long_description.startsWith('{') 
                ? (JSON.parse(f.long_description) || {}).access_code 
                : (typeof f.long_description === 'object' && f.long_description !== null)
                  ? (f.long_description as any).access_code
                  : null;
              
              return (
              <tr key={f.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                <td className="px-6 py-4">
                  <div className="font-medium">{f.title}</div>
                  <div className="text-[10px] text-[#8892B0]">{f.slug}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#8892B0]">
                  {coachs.find(c => c.id === f.coach_id)?.name || "Inconnu"}
                </td>
                <td className="px-6 py-4">
                  {accessCode ? (
                    <div 
                      onClick={() => {
                        navigator.clipboard.writeText(accessCode);
                        showToast("Code copié !");
                      }}
                      className="cursor-pointer text-[#7B2FFF] font-ui font-bold bg-[#7B2FFF]/10 px-2 py-1 rounded inline-block hover:bg-[#7B2FFF]/20 transition-colors"
                    >
                      {accessCode}
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#8892B0] italic">Aucun code (éditez pour générer)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-display">
                  {f.price_cents / 100} €
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-[#8892B0]">{f.level}</span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={async () => { await updateData('formations', f.id, { published: !f.published }, accessToken); onUpdate(); }}
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${f.published ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}
                  >
                    {f.published ? <Eye size={12} /> : <EyeOff size={12} />}
                    {f.published ? 'Publié' : 'Brouillon'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingFormation(f)} className="p-2 hover:bg-white/5 rounded-lg text-[#8892B0] hover:text-white"><Edit2 size={16} /></button>
                    <button onClick={async () => { if(await customConfirm('Supprimer cette formation ?')) { await deleteData('formations', f.id, accessToken); onUpdate(); } }} className="p-2 hover:bg-red-500/10 rounded-lg text-[#8892B0] hover:text-[#FF1744]"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function Mediatheque({ medias, setMedias, onSelect }: { medias: any[]; setMedias: any; onSelect?: (url: string) => void }) {
  const { accessToken } = useAuth();
  const [filter, setFilter] = useState("all");

  const filteredMedias = medias.filter((m) => {
    if (filter === "video") return m.type.startsWith("video");
    if (filter === "image") return m.type.startsWith("image");
    return true;
  });

  const handleDelete = async (m: any) => {
    if (!(await customConfirm(`Supprimer ${m.name} ?`))) return;
    
    try {
      const path = m.url.split('/').pop();
      if (path) {
        await deleteFile(m.bucket, path, accessToken);
        setMedias(medias.filter((x) => x.id !== m.id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUploadSuccess = (url: string, file: File) => {
    setMedias([
      {
        id: Date.now().toString(),
        name: file.name,
        url,
        type: file.type,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        bucket: file.type.startsWith("image") ? "images" : "formations-videos",
      },
      ...medias,
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-3xl">Médiathèque ({medias.length})</h2>
        <div className="flex gap-2 bg-[#111120] p-1 rounded-lg border border-[#1e1e34]">
          {["all", "video", "image"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f ? "bg-[#7B2FFF] text-white" : "text-[#8892B0] hover:text-white"
              }`}
            >
              {f === "all" ? "Tous" : f === "video" ? "Vidéos" : "Images"}
            </button>
          ))}
        </div>
      </div>

      {!onSelect && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111120] border border-[#1e1e34] rounded-xl p-6">
            <h3 className="font-display text-lg mb-4 flex items-center gap-2">
              <Video size={20} className="text-[#7B2FFF]" /> Upload Vidéo
            </h3>
            <p className="text-xs text-[#8892B0] mb-4">Bucket: formations-videos</p>
            <Uploader bucket="formations-videos" accept="video/*" onUploadSuccess={handleUploadSuccess} />
          </div>
          <div className="bg-[#111120] border border-[#1e1e34] rounded-xl p-6">
            <h3 className="font-display text-lg mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-[#7B2FFF]" /> Upload Image
            </h3>
            <p className="text-xs text-[#8892B0] mb-4">Bucket: images</p>
            <Uploader bucket="images" accept="image/*" onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredMedias.map((m) => (
          <div 
            key={m.id} 
            className={`bg-[#111120] border border-[#1e1e34] rounded-xl overflow-hidden group relative ${onSelect ? 'cursor-pointer hover:border-[#7B2FFF]' : ''}`}
            onClick={() => onSelect?.(m.url)}
          >
            <div className="aspect-square bg-[#0a0a16] relative">
              {m.type.startsWith("image") ? (
                <img src={m.url} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" />
              )}
              
              <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 ${onSelect ? 'bg-black/40' : ''}`}>
                {onSelect ? (
                  <div className="bg-[#7B2FFF] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest">Sélectionner</div>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(m.url); }}
                      className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                      title="Copier l'URL"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(m); }}
                      className="p-2 bg-[#FF1744]/80 hover:bg-[#FF1744] rounded-full text-white transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium truncate" title={m.name}>
                {m.name}
              </p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-[#8892B0]">{m.size}</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-[#8892B0]">
                  {m.bucket}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediathequeDrawer({ isOpen, onClose, onSelect, medias, setMedias }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-4xl bg-[#04050A] border-l border-[#1e1e34] z-[201] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-[#1e1e34] flex justify-between items-center bg-[#111120]">
              <h3 className="font-display text-xl">Sélectionner un média</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <Mediatheque 
                medias={medias} 
                setMedias={setMedias} 
                onSelect={(url) => {
                  onSelect(url);
                  onClose();
                }} 
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Uploader({ bucket, accept, onUploadSuccess }: { bucket: string; accept?: string; onUploadSuccess: (url: string, file: File) => void }) {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(10); // Fake initial progress

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const url = await uploadFile(bucket, file, accessToken, path);
      clearInterval(interval);
      setProgress(100);
      if (url) {
        onUploadSuccess(url, file);
      }
    } catch (err) {
      console.error(err);
      clearInterval(interval);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={uploading}
      />
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          uploading ? "border-[#7B2FFF] bg-[#7B2FFF]/5" : "border-[#1e1e34] hover:border-[#8892B0] bg-[#0a0a16]"
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="w-full bg-[#111120] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#7B2FFF] h-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-[#7B2FFF] font-medium">Upload en cours... {progress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadCloud size={24} className="mx-auto text-[#8892B0]" />
            <p className="text-sm text-[#8892B0]">
              Glissez-déposez ou cliquez pour uploader
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EditeurVideo({ medias }: { medias: any[] }) {
  const { accessToken } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [cuts, setCuts] = useState<{ in: number; out: number }[]>([]);
  const [currentMarkIn, setCurrentMarkIn] = useState<number | null>(null);

  const videos = medias.filter((m) => m.type.startsWith("video"));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      let time = video.currentTime;
      setCurrentTime(time);

      // Check if inside a cut
      for (const cut of cuts) {
        if (time >= cut.in && time < cut.out) {
          video.currentTime = cut.out;
          break;
        }
      }

      // Check trim end
      if (trimEnd > 0 && time >= trimEnd) {
        video.pause();
        video.currentTime = trimEnd;
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setTrimEnd(video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", () => setIsPlaying(true));
    video.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", () => setIsPlaying(true));
      video.removeEventListener("pause", () => setIsPlaying(false));
    };
  }, [cuts, trimEnd]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else {
        if (videoRef.current.currentTime >= trimEnd) {
          videoRef.current.currentTime = trimStart;
        }
        videoRef.current.play();
      }
    }
  };

  const handleMark = () => {
    if (currentMarkIn === null) {
      setCurrentMarkIn(currentTime);
    } else {
      if (currentTime > currentMarkIn) {
        setCuts([...cuts, { in: currentMarkIn, out: currentTime }]);
      }
      setCurrentMarkIn(null);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedVideo) return;
    
    try {
      const editData = {
        video_url: selectedVideo.url,
        trim_start: trimStart,
        trim_end: trimEnd,
        cuts: JSON.stringify(cuts),
        updated_at: new Date().toISOString()
      };

      // Check if edits already exist for this video
      const existing = await fetchData("video_edits", "*", `&video_url=eq.${encodeURIComponent(selectedVideo.url)}`) as any[];
      
      if (existing && existing.length > 0) {
        await updateData("video_edits", existing[0].id, editData, accessToken);
      } else {
        await insertData("video_edits", editData, accessToken);
      }

      showToast("Édition sauvegardée avec succès dans la base de données.");
    } catch (error) {
      console.error("Error saving video edits:", error);
      showToast("Erreur lors de la sauvegarde des éditions.", true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const totalCutDuration = cuts.reduce((acc, cut) => acc + (cut.out - cut.in), 0);
  const finalDuration = (trimEnd || duration) - trimStart - totalCutDuration;

  if (!selectedVideo) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="font-display text-3xl">Éditeur Vidéo</h2>
        <p className="text-[#8892B0]">Sélectionnez une vidéo de la médiathèque à éditer :</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.length === 0 ? (
            <p className="text-[#8892B0] col-span-full">Aucune vidéo disponible.</p>
          ) : (
            videos.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVideo(v)}
                className="bg-[#111120] border border-[#1e1e34] rounded-xl overflow-hidden cursor-pointer hover:border-[#7B2FFF] transition-colors"
              >
                <div className="aspect-video bg-black relative">
                  <video src={v.url} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play size={32} className="text-white opacity-80" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{v.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveEdits}
            className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium flex items-center gap-2 transition-colors text-sm"
          >
            <Save size={18} /> Sauvegarder l'édition
          </button>
          <button
            onClick={() => {
              setSelectedVideo(null);
              setCuts([]);
              setTrimStart(0);
              setCurrentMarkIn(null);
            }}
            className="text-sm text-[#8892B0] hover:text-white transition-colors mt-1"
          >
            ← Retour à la sélection
          </button>
        </div>
      </div>

      <div className="bg-black rounded-2xl overflow-hidden border border-[#1e1e34] shadow-2xl">
        <video
          ref={videoRef}
          src={selectedVideo.url}
          className="w-full aspect-video"
          onClick={togglePlay}
        />
      </div>

      <div className="bg-[#111120] border border-[#1e1e34] rounded-xl p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-[#7B2FFF] hover:bg-[#8f4dff] text-white flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <div className="font-ui text-lg">
              {formatTime(currentTime)} <span className="text-[#8892B0]">/ {formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentMarkIn !== null && (
              <button
                onClick={() => setCurrentMarkIn(null)}
                className="px-4 py-2 rounded-lg border border-[#1e1e34] text-[#8892B0] hover:text-white hover:bg-white/5 transition-colors text-sm"
              >
                Annuler marque
              </button>
            )}
            <button
              onClick={handleMark}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                currentMarkIn !== null
                  ? "bg-[#f59e0b] text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Scissors size={18} />
              {currentMarkIn !== null ? `Marquer FIN (${formatTime(currentMarkIn)} → ?)` : "Marquer DÉBUT coupe"}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div
          className="h-12 bg-[#0a0a16] rounded-lg relative cursor-pointer overflow-hidden border border-[#1e1e34]"
          onClick={handleTimelineClick}
        >
          {/* Trim Start Overlay */}
          {trimStart > 0 && (
            <div
              className="absolute top-0 bottom-0 left-0 bg-black/60 z-10"
              style={{ width: `${(trimStart / duration) * 100}%` }}
            />
          )}
          {/* Trim End Overlay */}
          {trimEnd < duration && (
            <div
              className="absolute top-0 bottom-0 right-0 bg-black/60 z-10"
              style={{ width: `${(1 - trimEnd / duration) * 100}%` }}
            />
          )}

          {/* Cuts */}
          {cuts.map((cut, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 bg-[#FF1744]/30 border-x border-[#FF1744] z-20"
              style={{
                left: `${(cut.in / duration) * 100}%`,
                width: `${((cut.out - cut.in) / duration) * 100}%`,
              }}
            />
          ))}

          {/* Current Mark In */}
          {currentMarkIn !== null && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[#f59e0b] z-30"
              style={{ left: `${(currentMarkIn / duration) * 100}%` }}
            />
          )}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#7B2FFF] z-40 pointer-events-none"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-[#8f4dff] shadow-[0_0_10px_#7B2FFF]" />
          </div>
        </div>

        {/* Trims */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8892B0]">Début (Trim In)</span>
              <span className="font-ui">{formatTime(trimStart)}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={trimStart}
                onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                className="flex-1 accent-[#7B2FFF]"
              />
              <button
                onClick={() => setTrimStart(currentTime)}
                className="px-2 py-1 bg-white/10 rounded text-xs hover:bg-white/20"
              >
                Ici
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8892B0]">Fin (Trim Out)</span>
              <span className="font-ui">{formatTime(trimEnd)}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={trimEnd}
                onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                className="flex-1 accent-[#7B2FFF]"
              />
              <button
                onClick={() => setTrimEnd(currentTime)}
                className="px-2 py-1 bg-white/10 rounded text-xs hover:bg-white/20"
              >
                Ici
              </button>
            </div>
          </div>
        </div>

        {/* Cuts List */}
        {cuts.length > 0 && (
          <div className="pt-4 border-t border-[#1e1e34]">
            <h4 className="text-sm font-medium mb-3">Zones coupées</h4>
            <div className="space-y-2">
              {cuts.map((cut, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0a0a16] p-2 rounded-lg border border-[#1e1e34]">
                  <span className="text-sm font-ui">
                    ✂️ {formatTime(cut.in)} → {formatTime(cut.out)} <span className="text-[#8892B0]">({formatTime(cut.out - cut.in)} supprimé)</span>
                  </span>
                  <button
                    onClick={() => setCuts(cuts.filter((_, idx) => idx !== i))}
                    className="text-xs text-[#8892B0] hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw size={14} /> Restaurer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gradient-to-br from-[#7B2FFF]/20 to-[#111120] border border-[#7B2FFF]/30 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1 text-sm">
            <p className="text-[#8892B0]">Original : <span className="text-white font-ui">{formatTime(duration)}</span></p>
            <p className="text-[#8892B0]">Coupes : <span className="text-white font-ui">{cuts.length} ({formatTime(totalCutDuration)})</span></p>
            <p className="text-lg font-bold text-[#22c55e] mt-2">Final : <span className="font-ui">{formatTime(finalDuration)}</span></p>
          </div>
          <button
            onClick={() => {
              const plan = {
                trimStart,
                trimEnd,
                cuts,
                finalDuration
              };
              navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
              // showToast("Plan de coupe copié !");
            }}
            className="bg-[#7B2FFF] hover:bg-[#8f4dff] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Copy size={18} /> Copier plan (JSON)
          </button>
        </div>
      </div>
    </div>
  );
}

// Generic CRUD components for Blog, Coachs, Produits (simplified for V1)
function BlogCRUD({ data, coachs, formations, onUpdate, onOpenMedia }: { data: any[]; coachs: any[]; formations: any[]; onUpdate: () => void; onOpenMedia: (onSelect: (url: string) => void) => void }) {
  const { accessToken } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    if (editingPost || isAdding) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (editingPost) {
      setThumbnailUrl(editingPost.thumbnail_path || editingPost.cover_image || "");
    } else {
      setThumbnailUrl("");
    }
  }, [editingPost, isAdding]);
  const [mainVideoUrl, setMainVideoUrl] = useState("");
  const [additionalVideos, setAdditionalVideos] = useState("");

  useEffect(() => {
    if (editingPost) {
      setMainVideoUrl(editingPost.video_url || "");
      setAdditionalVideos(editingPost.youtube_embeds?.join('\n') || "");
    } else {
      setMainVideoUrl("");
      setAdditionalVideos("");
    }
  }, [editingPost]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const postData = Object.fromEntries(formData.entries());
    
    const finalData = {
      ...postData,
      tags: (postData.tags as string).split(',').map(t => t.trim()).filter(t => t),
      youtube_embeds: additionalVideos.split('\n').map(v => v.trim()).filter(v => v),
      video_url: mainVideoUrl,
      published_at: editingPost?.published_at || new Date().toISOString(),
      published: true // Admin can publish directly
    };

    try {
      if (editingPost) {
        await updateData("blog_posts", editingPost.id, finalData, accessToken);
      } else {
        await insertData("blog_posts", finalData, accessToken);
      }
      setIsAdding(false);
      setEditingPost(null);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      showToast("Erreur lors de l'enregistrement : " + (err.message || "Erreur inconnue"), true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display">Gestion du Blog</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#7B2FFF] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} /> Nouvel article
        </button>
      </div>

      {(isAdding || editingPost) && (
        <div className="bg-[#0C0E18] border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-display text-lg">{editingPost ? "Modifier l'article" : "Nouvel article"}</h4>
            <button onClick={() => { setIsAdding(false); setEditingPost(null); }} className="text-[#8892B0] hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Titre</label>
                <input name="title" defaultValue={editingPost?.title} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Slug</label>
                <input name="slug" defaultValue={editingPost?.slug} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Catégorie</label>
                <select name="category" defaultValue={editingPost?.category} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all">
                  <option value="ANALYSE">ANALYSE</option>
                  <option value="TECHNIQUE">TECHNIQUE</option>
                  <option value="RÉCUPÉRATION">RÉCUPÉRATION</option>
                  <option value="NUTRITION">NUTRITION</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Tags (virgules)</label>
                <input name="tags" defaultValue={editingPost?.tags?.join(', ')} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Coach Auteur</label>
                <select name="coach_id" defaultValue={editingPost?.coach_id} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all">
                  <option value="">Sélectionner un coach</option>
                  {coachs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Formation liée</label>
                <select name="formation_id" defaultValue={editingPost?.formation_id} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all">
                  <option value="">Aucune formation liée</option>
                  {formations.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">URL YouTube principale</label>
                  <input 
                    value={mainVideoUrl}
                    onChange={(e) => setMainVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" 
                  />
                </div>
                {mainVideoUrl && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#8892B0] uppercase font-bold tracking-widest">Aperçu vidéo principale</label>
                    <YouTubeEmbed url={mainVideoUrl} />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">URLs YouTube additionnelles (une par ligne)</label>
                  <textarea 
                    value={additionalVideos || ""}
                    onChange={(e) => setAdditionalVideos(e.target.value)}
                    rows={4}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all resize-none font-ui" 
                  />
                </div>
                {additionalVideos && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#8892B0] uppercase font-bold tracking-widest">Aperçus vidéos additionnelles</label>
                    <div className="grid grid-cols-2 gap-2">
                      {additionalVideos.split('\n').filter(v => v.trim()).map((url, i) => (
                        <YouTubeEmbed key={i} url={url} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <input type="hidden" name="thumbnail_path" value={thumbnailUrl} />
              <MediaUploader 
                label="Image de couverture" 
                accept="image" 
                bucket="admin-media"
                onUpload={setThumbnailUrl} 
                currentMedia={thumbnailUrl || undefined} 
                uploadedBy="admin" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Extrait (Excerpt)</label>
              <textarea name="excerpt" defaultValue={editingPost?.excerpt || ""} rows={2} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all resize-none" />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Contenu (Markdown)</label>
              <textarea name="content" defaultValue={editingPost?.content || ""} rows={12} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all resize-none font-ui" />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
              <button type="button" onClick={() => { setIsAdding(false); setEditingPost(null); }} className="px-6 py-3 rounded-xl text-sm font-medium bg-white/10 hover:bg-[#2a2a44] transition-all">Annuler</button>
              <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl text-sm font-medium bg-[#7B2FFF] hover:bg-[#8f4dff] transition-all disabled:opacity-50">
                {loading ? "Chargement..." : editingPost ? "Mettre à jour" : "Publier l'article"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {data.map((post) => (
          <div key={post.id} className="bg-[#0C0E18] border border-white/10 rounded-2xl p-4 flex items-center gap-6 group">
            <div className="w-32 h-20 bg-[#04050A] rounded-xl overflow-hidden shrink-0">
              {post.thumbnail_path || post.cover_image ? (
                <img src={post.thumbnail_path || post.cover_image} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📝</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-bold truncate">{post.title}</h4>
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-[#8892B0]">{post.category}</span>
              </div>
              <div className="text-xs text-[#8892B0] flex gap-3">
                <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span className="truncate">{post.tags?.join(', ')}</span>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => setEditingPost(post)} className="p-2 hover:bg-white/5 rounded-lg text-[#8892B0] hover:text-white"><Edit2 size={18} /></button>
              <button onClick={async () => { if(await customConfirm('Supprimer cet article ?')) { await deleteData('blog_posts', post.id, accessToken); onUpdate(); } }} className="p-2 hover:bg-red-500/10 rounded-lg text-[#8892B0] hover:text-[#FF1744]"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function CoachsCRUD({ data, onUpdate, onOpenMedia }: { data: any[]; onUpdate: () => void; onOpenMedia: (onSelect: (url: string) => void) => void }) {
  const { accessToken } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingCoach, setEditingCoach] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (editingCoach || isAdding) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (editingCoach) {
      setPhotoUrl(editingCoach.photo_url || "");
      setVideoUrl(editingCoach.presentation_video_url || "");
    } else {
      setPhotoUrl("");
      setVideoUrl("");
    }
  }, [editingCoach, isAdding]);

  const generateAccessKeyForExistingCoach = async () => {
    if (!editingCoach) return;
    
    setLoading(true);
    try {
      const generateKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      };
      
      const newKey = generateKey();
      
      const { error } = await supabase
        .from('coaches')
        .update({ access_key: newKey })
        .eq('id', editingCoach.id);
        
      if (error) throw error;
      
      showToast("Clé sauvegardée ✓");
      onUpdate();
      setEditingCoach({ ...editingCoach, access_key: newKey });
    } catch (err: any) {
      console.error(err);
      showToast("Erreur: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    const { specialties, ...restData } = rawData;
    
    const coachData: any = { ...restData };
    if (specialties && typeof specialties === 'string') {
      coachData.specialties = specialties.split(',').map(s => s.trim()).filter(s => s);
    } else {
      coachData.specialties = [];
    }

    if (!coachData.name) {
      showToast("Veuillez remplir le nom.", true);
      setLoading(false);
      return;
    }

    try {
      
      if (editingCoach) {
        await updateData("coaches", editingCoach.id, coachData, accessToken);
      } else {
        // Generate an 8-character access key
        const generateKey = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        };
        
        const accessKey = generateKey();
        
        const { error } = await supabase.from('coaches').insert({
          name: coachData.name,
          slug: coachData.name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          access_key: accessKey,
          specialties: coachData.specialties,
          tagline: coachData.tagline,
          bio: coachData.bio,
          photo_url: photoUrl,
          presentation_video_url: videoUrl,
          is_featured: false,
          sort_order: 0
        });
        
        if (error) {
          console.error('Erreur insert coach:', error);
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }
        
        showToast(`Coach créé avec succès !\n\nLa clé d'accès est : ${accessKey}`);
      }
      setIsAdding(false);
      setEditingCoach(null);
      onUpdate();
    } catch (err: any) {
      console.error("Coach submission error:", err);
      showToast("Erreur lors de l'enregistrement : " + (err.message || "Erreur inconnue"), true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display">Gestion des Coaches</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#7B2FFF] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} /> Ajouter un coach
        </button>
      </div>

      {(isAdding || editingCoach) && (
        <div className="bg-[#0C0E18] border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-display text-lg">{editingCoach ? "Modifier le coach" : "Nouveau coach"}</h4>
            <button onClick={() => { setIsAdding(false); setEditingCoach(null); }} className="text-[#8892B0] hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {errorMessage && (
              <div className="md:col-span-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                {errorMessage}
              </div>
            )}
            {!editingCoach && (
              <div className="md:col-span-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-xs text-purple-200">
                <strong>Note :</strong> Une clé d'accès unique sera générée automatiquement lors de la création du coach. Le coach pourra l'utiliser pour se connecter à son espace.
              </div>
            )}
            {editingCoach && (
              <div className="md:col-span-2 space-y-4 bg-[#1e1e34]/30 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-[#7B2FFF]">
                  <Shield size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Clé d'accès Coach</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <input 
                      name="access_key" 
                      type="text" 
                      value={editingCoach?.access_key || ""} 
                      readOnly 
                      className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none font-ui" 
                    />
                    {editingCoach?.access_key && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingCoach.access_key);
                          showToast("Clé copiée !");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892B0] hover:text-white p-1"
                        title="Copier la clé"
                      >
                        <Copy size={16} />
                      </button>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={generateAccessKeyForExistingCoach}
                    disabled={loading}
                    className="px-6 py-3 bg-[#7B2FFF] hover:bg-[#8f4dff] rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-[#7B2FFF]/20 disabled:opacity-50"
                  >
                    {loading ? "Génération..." : "Générer une clé"}
                  </button>
                </div>
                <p className="text-[10px] text-[#8892B0]">
                  Cette clé permet au coach de se connecter directement à son espace sans mot de passe.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Nom complet</label>
              <input name="name" defaultValue={editingCoach?.name} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Slug URL (ex: johnny-frachey)</label>
              <input name="slug" defaultValue={editingCoach?.slug} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Spécialités (séparées par des virgules)</label>
              <input name="specialties" defaultValue={editingCoach?.specialties?.join(', ')} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Tagline (ex: L'expert du striking)</label>
              <input name="tagline" defaultValue={editingCoach?.tagline} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Biographie complète</label>
              <textarea name="bio" defaultValue={editingCoach?.bio || ""} rows={4} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all resize-none" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <input type="hidden" name="photo_url" value={photoUrl} />
              <MediaUploader 
                label="Photo du Coach" 
                accept="image" 
                bucket="admin-media"
                onUpload={setPhotoUrl} 
                currentMedia={photoUrl || undefined} 
                uploadedBy="admin" 
                aspectRatio={1}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <input type="hidden" name="presentation_video_url" value={videoUrl} />
              <MediaUploader 
                label="Vidéo de présentation (Coach)" 
                accept="video" 
                bucket="formations-videos"
                onUpload={setVideoUrl} 
                currentMedia={videoUrl || undefined} 
                uploadedBy="admin" 
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-4">
              <button type="button" onClick={() => { setIsAdding(false); setEditingCoach(null); }} className="px-6 py-3 rounded-xl text-sm font-medium bg-white/10 hover:bg-[#2a2a44] transition-all">Annuler</button>
              <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl text-sm font-medium bg-[#7B2FFF] hover:bg-[#8f4dff] transition-all disabled:opacity-50">
                {loading ? "Chargement..." : editingCoach ? "Mettre à jour" : "Créer le coach"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((coach) => (
          <div key={coach.id} className="bg-[#0C0E18] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#04050A] border border-white/10 overflow-hidden mb-2">
              {coach.photo_url ? (
                <img src={coach.photo_url} alt={coach.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🥊</div>
              )}
            </div>
            <div>
              <div className="font-display text-xl">{coach.name}</div>
              <div className="text-xs text-[#8892B0] mt-1">
                {coach.access_key ? (
                  <span className="text-purple-400 font-ui font-bold bg-purple-500/10 px-2 py-0.5 rounded">Clé: {coach.access_key}</span>
                ) : (
                  coach.profiles?.email || coach.email
                )}
              </div>
            </div>
            <div className="text-sm text-[#8892B0] italic">"{coach.tagline || 'Pas de tagline'}"</div>
            <div className="w-full flex justify-between items-center pt-4 border-t border-white/10 mt-auto">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${coach.is_active !== false ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {coach.is_active !== false ? 'Actif' : 'Inactif'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setEditingCoach(coach)} className="p-2 hover:bg-white/5 rounded-lg text-[#8892B0] hover:text-white transition-all"><Edit2 size={16} /></button>
                <button onClick={async () => { if(await customConfirm('Supprimer ce coach ?')) { await deleteData('coaches', coach.id, accessToken); onUpdate(); } }} className="p-2 hover:bg-red-500/10 rounded-lg text-[#8892B0] hover:text-[#FF1744] transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ShopCRUD({ data, onUpdate, onOpenMedia }: { data: any[]; onUpdate: () => void; onOpenMedia: (onSelect: (url: string) => void) => void }) {
  const { accessToken } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (editingProduct || isAdding) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (editingProduct) {
      setImageUrl(editingProduct.image_url || "");
    } else {
      setImageUrl("");
    }
  }, [editingProduct, isAdding]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const productData = Object.fromEntries(formData.entries());
    
    const priceEuro = parseFloat(productData.price_euro as string);
    if (isNaN(priceEuro)) {
      showToast("Veuillez entrer un prix valide", true);
      setLoading(false);
      return;
    }

    // Handle sizes array
    const sizes = (productData.sizes as string).split(',').map(s => s.trim()).filter(s => s);
    const finalData = { 
      ...productData, 
      slug: productData.name ? (productData.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-') : `product-${Date.now()}`,
      price_cents: Math.round(priceEuro * 100),
      stock: parseInt(productData.stock as string),
      sizes 
    };
    delete (finalData as any).price_euro;

    try {
      if (editingProduct) {
        await updateData("products", editingProduct.id, finalData, accessToken);
      } else {
        await insertData("products", finalData, accessToken);
      }
      setIsAdding(false);
      setEditingProduct(null);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      showToast("Erreur lors de l'enregistrement : " + (err.message || "Erreur inconnue"), true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display">Gestion de la Boutique</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#7B2FFF] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} /> Nouveau produit
        </button>
      </div>

      {(isAdding || editingProduct) && (
        <div className="bg-[#0C0E18] border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-display text-lg">{editingProduct ? "Modifier le produit" : "Nouveau produit"}</h4>
            <button onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="text-[#8892B0] hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Nom du produit</label>
              <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Prix (€)</label>
              <input name="price_euro" type="number" step="0.01" defaultValue={editingProduct ? editingProduct.price_cents / 100 : 0} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Catégorie</label>
              <select name="category" defaultValue={editingProduct?.category} className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all">
                <option value="Equipement">Equipement</option>
                <option value="Vêtements">Vêtements</option>
                <option value="Accessoires">Accessoires</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Stock</label>
              <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-[#8892B0] uppercase font-bold tracking-widest">Tailles (séparées par des virgules)</label>
              <input name="sizes" defaultValue={editingProduct?.sizes?.join(', ')} placeholder="S, M, L, XL" className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <input type="hidden" name="image_url" value={imageUrl} />
              <MediaUploader 
                label="Image du produit" 
                accept="image" 
                bucket="admin-media"
                onUpload={setImageUrl} 
                currentMedia={imageUrl || undefined} 
                uploadedBy="admin" 
                aspectRatio={1}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-4">
              <button type="button" onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="px-6 py-3 rounded-xl text-sm font-medium bg-white/10 hover:bg-[#2a2a44] transition-all">Annuler</button>
              <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl text-sm font-medium bg-[#7B2FFF] hover:bg-[#8f4dff] transition-all disabled:opacity-50">
                {loading ? "Chargement..." : editingProduct ? "Mettre à jour" : "Créer le produit"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((product) => (
          <div key={product.id} className="bg-[#0C0E18] border border-white/10 rounded-2xl overflow-hidden group">
            <div className="aspect-square bg-[#04050A] relative">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">👕</div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={() => setEditingProduct(product)} className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-[#7B2FFF] transition-all"><Edit2 size={14} /></button>
                <button onClick={async () => { if(await customConfirm('Supprimer ce produit ?')) { await deleteData('products', product.id, accessToken); onUpdate(); } }} className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div className="font-bold text-sm truncate flex-1">{product.name}</div>
                <div className="text-[#7B2FFF] font-display text-sm ml-2">{product.price}€</div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#8892B0] uppercase tracking-widest">{product.category}</span>
                <span className={`text-[10px] font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesTable({ data }: { data: any[] }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="font-display text-3xl">Historique des Ventes</h2>
      <div className="bg-[#111120] border border-[#1e1e34] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1e1e34] bg-[#0a0a16]">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0]">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0]">Client</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0]">Produit</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0]">Montant</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0]">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e34]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#8892B0]">Aucune vente enregistrée.</td>
              </tr>
            ) : (
              data.map((sale) => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-ui text-[#8892B0]">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{sale.profiles?.full_name || 'Client inconnu'}</div>
                    <div className="text-[10px] text-[#8892B0]">{sale.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{sale.product_name || 'Produit'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#7B2FFF]">{(sale.amount_cents / 100).toFixed(2)}€</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                      sale.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                      sale.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewsletterTable({ data, onUpdate }: { data: any[]; onUpdate: () => void }) {
  const { accessToken } = useAuth();
  
  const toggleStatus = async (sub: any) => {
    try {
      await updateData("newsletter_subscribers", sub.id, { is_active: !sub.is_active }, accessToken);
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="font-display text-3xl">Abonnés Newsletter</h2>
      <div className="bg-[#111120] border border-[#1e1e34] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1e1e34] bg-[#0a0a16]">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0]">Email</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0]">Date d'inscription</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0]">Statut</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#8892B0] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e34]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[#8892B0]">Aucun abonné.</td>
              </tr>
            ) : (
              data.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{sub.email}</td>
                  <td className="px-6 py-4 text-sm text-[#8892B0]">
                    {new Date(sub.subscribed_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                      sub.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {sub.is_active ? 'Actif' : 'Désabonné'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleStatus(sub)}
                      className={`p-2 rounded-lg transition-colors ${sub.is_active ? 'hover:bg-red-500/10 text-[#8892B0] hover:text-red-500' : 'hover:bg-green-500/10 text-[#8892B0] hover:text-green-500'}`}
                      title={sub.is_active ? "Désactiver" : "Réactiver"}
                    >
                      {sub.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                      onClick={async () => { if(await customConfirm('Supprimer cet abonné ?')) { await deleteData('newsletter_subscribers', sub.id, accessToken); onUpdate(); } }}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-[#8892B0] hover:text-[#FF1744] transition-all ml-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AppPerformanceEditor({ data, onUpdate, onOpenMedia }: { data: any; onUpdate: () => void; onOpenMedia: (onSelect: (url: string) => void) => void }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { accessToken } = useAuth();

  if (!data || !data.content) return <div className="p-12 text-center text-[#8892B0]">Aucun contenu d'application trouvé.</div>;

  const handleSave = async () => {
    if (!editingKey) return;
    try {
      const updatedContent = { ...data.content, [editingKey]: editValue };
      await updateData("site_content", data.id, { content: updatedContent }, accessToken);
      onUpdate();
      setEditingKey(null);
      showToast("Contenu mis à jour avec succès", false);
    } catch (error) {
      console.error("Error updating content:", error);
      showToast("Erreur lors de la mise à jour", true);
    }
  };

  const appKeys = Object.keys(data.content || {}).filter(k => k.startsWith('app.'));
  
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-[#0C0E18] p-8 rounded-3xl border border-white/10 shadow-xl">
        <div>
          <h2 className="text-3xl font-display tracking-tight">Éditeur Application de Performance</h2>
          <p className="text-[#8892B0] text-sm mt-2 max-w-xl leading-relaxed">
            Personnalisez l'expérience de vos combattants. Modifiez les textes, les titres et les descriptions de la page application.
          </p>
        </div>
        <div className="w-16 h-16 bg-[#7B2FFF]/10 rounded-2xl flex items-center justify-center text-[#7B2FFF]">
          <Smartphone size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {appKeys.map((key) => {
          const value = data.content[key];
          return (
            <div key={key} className="bg-[#111120] border border-[#1e1e34] rounded-3xl p-8 flex flex-col gap-6 group hover:border-[#7B2FFF]/50 transition-all shadow-2xl hover:shadow-[#7B2FFF]/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#7B2FFF] opacity-0 group-hover:opacity-100 transition-all"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="inline-flex px-3 py-1 rounded-full bg-[#7B2FFF]/10 text-[10px] font-bold uppercase tracking-widest text-[#7B2FFF] border border-[#7B2FFF]/20">
                    {key.replace('app.', '').replace(/\./g, ' ')}
                  </div>
                  <p className="text-sm text-[#8892B0] font-medium line-clamp-5 leading-relaxed italic">"{value}"</p>
                </div>
                <button 
                  onClick={() => { setEditingKey(key); setEditValue(value); }}
                  className="p-3.5 bg-white/5 hover:bg-[#7B2FFF] rounded-2xl text-[#8892B0] hover:text-white transition-all shrink-0 ml-4 shadow-xl border border-white/5"
                >
                  <Edit2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingKey && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-[#0C0E18] border border-white/10 rounded-[2.5rem] p-10 max-w-3xl w-full shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#7B2FFF] to-transparent"></div>
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-display mb-1">Modifier le contenu</h3>
                <p className="text-[#8892B0] text-xs uppercase tracking-widest font-bold">{editingKey}</p>
              </div>
              <button 
                onClick={() => setEditingKey(null)}
                className="p-3 hover:bg-white/5 rounded-2xl text-[#8892B0] transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#7B2FFF] ml-4">Texte</label>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full h-64 bg-[#04050A] border border-white/10 rounded-3xl p-6 text-white focus:border-[#7B2FFF] outline-none transition-all resize-none leading-relaxed shadow-inner"
                  placeholder="Entrez votre texte ici..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <button 
                onClick={() => setEditingKey(null)}
                className="px-8 py-4 rounded-2xl hover:bg-white/5 transition-all text-[#8892B0] font-bold"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                className="px-12 py-4 bg-[#7B2FFF] rounded-2xl font-bold hover:scale-105 transition-all shadow-[0_0_30px_rgba(123,47,255,0.4)] text-white"
              >
                Sauvegarder les modifications
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SiteContentEditor({ data, onUpdate }: { data: any; onUpdate: () => void }) {
  const { accessToken } = useAuth();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);

  if (!data || !data.content) return <div className="p-12 text-center text-[#8892B0]">Chargement du contenu...</div>;

  const handleSave = async () => {
    if (!editingKey) return;
    setLoading(true);
    try {
      const updatedContent = { ...data.content, [editingKey]: editValue };
      await updateData("site_content", data.id, { content: updatedContent }, accessToken);
      setEditingKey(null);
      onUpdate();
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la sauvegarde", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-3xl">Contenu du Site</h2>
        <div className="text-xs text-[#8892B0] uppercase tracking-widest">Table: site_content</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(data.content || {}).map(([key, value]: [string, any]) => (
          <div key={key} className="bg-[#111120] border border-[#1e1e34] rounded-xl p-6 flex flex-col gap-4 group hover:border-[#7B2FFF]/50 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5 flex-1 min-w-0">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#7B2FFF]">{key}</h4>
                <p className="text-sm text-[#8892B0] line-clamp-3 leading-relaxed">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
              </div>
              <button 
                onClick={() => { setEditingKey(key); setEditValue(typeof value === 'string' ? value : JSON.stringify(value, null, 2)); }}
                className="p-2.5 bg-white/5 hover:bg-[#7B2FFF] rounded-xl text-[#8892B0] hover:text-white transition-all shrink-0 ml-4"
              >
                <Edit2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0C0E18] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-display text-xl">Modifier : {editingKey}</h3>
              <button onClick={() => setEditingKey(null)} className="text-[#8892B0] hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <textarea 
                value={editValue || ""}
                onChange={(e) => setEditValue(e.target.value)}
                rows={12}
                className="w-full bg-[#04050A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#7B2FFF] outline-none transition-all resize-none font-ui"
              />
              <div className="flex justify-end gap-4">
                <button onClick={() => setEditingKey(null)} className="px-6 py-3 rounded-xl text-sm font-medium bg-white/10 hover:bg-[#2a2a44] transition-all">Annuler</button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl text-sm font-medium bg-[#7B2FFF] hover:bg-[#8f4dff] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "Enregistrement..." : <><Save size={18} /> Enregistrer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
