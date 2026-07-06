import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ShoppingBag, Eye, X, Filter, ChevronRight } from "lucide-react";
import { fetchData } from "../lib/supabase";

export function Shop() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Tout");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await fetchData("products", "*", "&available=eq.true&order=sort_order");
        setProducts(data || []);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = ["Tout", "Vêtements", "Protections", "Accessoires"];
  
  const filteredProducts = category === "Tout" 
    ? products 
    : products.filter(p => p.category === category);

  return (
    <div className="bg-[#04050A] text-white pt-32 pb-24 selection:bg-[#7B2FFF] selection:text-white min-h-screen">
      {/* Hero */}
      <section className="px-6 max-w-7xl mx-auto text-center mb-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(123,47,255,0.08)_0%,transparent_50%)] pointer-events-none blur-3xl"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10"
        >
          <Badge color="purple" className="mb-8 bg-white/5 border-white/10 text-white/80 shadow-[0_0_30px_rgba(123,47,255,0.2)]">
            SHOP OFFICIEL
          </Badge>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-8 max-w-4xl mx-auto leading-[1.1] tracking-tighter drop-shadow-2xl">
            Équipement{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7B2FFF] to-[#B28DFF] font-days-one tracking-normal">
              MMA IQ
            </span>
          </h1>
          <p className="font-body text-lg md:text-xl text-[#8892B0] max-w-3xl mx-auto mb-12 leading-relaxed">
            Collection exclusive Bar Tack x <span className="font-days-one tracking-normal">MMA IQ</span>. Performance, style, identité.
          </p>
        </motion.div>
      </section>

      {/* Filters */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                category === cat 
                  ? "bg-[#7B2FFF] border-[#7B2FFF] text-white shadow-[0_0_20px_rgba(123,47,255,0.3)]" 
                  : "bg-white/5 border-white/10 text-[#8892B0] hover:border-white/20 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7B2FFF]"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/10">
            <p className="text-[#8892B0] text-lg">Aucun produit trouvé dans cette catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                <div className="h-full flex flex-col group bg-[#0C0E18] border border-white/10 hover:border-[#7B2FFF]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(123,47,255,0.2)] rounded-[2rem] overflow-hidden backdrop-blur-sm">
                  <div className="aspect-square bg-[#04050A] relative overflow-hidden flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-30">
                        <ShoppingBag className="w-12 h-12 text-white/40" />
                      </div>
                    )}
                    
                    {product.stock === 0 && (
                      <div className="absolute top-4 left-4 z-30">
                        <Badge color="red" className="bg-red-500 text-white border-none px-3 py-1 text-[10px] font-bold">RUPTURE</Badge>
                      </div>
                    )}

                    {/* Quick Add Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-20 backdrop-blur-sm">
                      <Link to={`/product/${product.slug}`}>
                        <Button variant="primary" className="translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-[0_0_30px_rgba(123,47,255,0.4)] rounded-full px-6 py-3 flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Voir le produit
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow relative">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#7B2FFF] bg-[#7B2FFF]/10 px-3 py-1.5 rounded-full border border-[#7B2FFF]/20">
                        {product.collab || <>Bar Tack x <span className="font-days-one tracking-normal">MMA IQ</span></>}
                      </span>
                      <div className="flex gap-1">
                        {product.sizes?.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-[10px] font-medium text-[#8892B0] border border-white/10 px-2 py-1 rounded bg-white/5">
                            {s}
                          </span>
                        ))}
                        {product.sizes?.length > 3 && <span className="text-[10px] text-[#8892B0]">...</span>}
                      </div>
                    </div>
                    
                    <h3 className="font-display text-2xl mb-4 text-white group-hover:text-[#7B2FFF] transition-colors">
                      {product.name}
                    </h3>
                    
                    <p className="font-body text-[#8892B0] text-sm mb-8 flex-grow leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5">
                      <span className="font-display text-2xl text-white">
                        {(product.price_cents / 100).toFixed(2)} €
                      </span>
                      <Button 
                        onClick={() => setShowModal(true)}
                        disabled={product.stock === 0}
                        variant="outline" 
                        className="px-6 py-3 rounded-full text-sm hover:bg-[#7B2FFF] hover:text-white hover:border-[#7B2FFF] transition-colors flex items-center gap-2 border-white/10 disabled:opacity-50"
                      >
                        <ShoppingBag className="w-4 h-4" /> Ajouter
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Placeholder Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#0C0E18] border border-[#7B2FFF]/30 rounded-[2rem] p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(123,47,255,0.2)]"
            >
              <div className="w-20 h-20 bg-[#7B2FFF]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#7B2FFF]">
                <ShoppingBag size={40} />
              </div>
              <h3 className="text-2xl font-display mb-4">Paiement bientôt disponible</h3>
              <p className="text-[#8892B0] mb-8 leading-relaxed">
                Nous finalisons actuellement notre système de paiement sécurisé. 
                Revenez très bientôt pour commander vos articles <span className="font-days-one tracking-normal">MMA IQ</span> !
              </p>
              <Button 
                onClick={() => setShowModal(false)}
                className="w-full py-4 rounded-xl bg-[#7B2FFF] hover:bg-[#8f4dff]"
              >
                Compris !
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
