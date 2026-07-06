import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, ShoppingBag, Check, ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { fetchData } from "../lib/supabase";
import { createCheckoutSession } from "../services/stripeService";

export function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await fetchData("products", "*", `&slug=eq.${slug}`);
        if (data && data.length > 0) {
          setProduct(data[0]);
          if (data[0].sizes && data[0].sizes.length > 0) {
            setSelectedSize(data[0].sizes[0]);
          }
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04050A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7B2FFF]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#04050A] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-display mb-4">Produit introuvable</h2>
        <Link to="/shop">
          <Button variant="outline">Retour à la boutique</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    try {
      await createCheckoutSession([
        {
          name: product.name,
          price: product.price_cents / 100,
          image: product.images?.[0],
          description: `${product.description} - Taille: ${selectedSize}`,
          quantity: quantity,
        }
      ], {
        product_id: product.id,
        size: selectedSize,
      });
    } catch (error) {
      setShowModal(true); // Fallback to modal if Stripe fails (e.g. not configured)
    }
  };

  return (
    <div className="bg-[#04050A] text-white pt-32 pb-24 min-h-screen">
      <div className="px-6 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-[#8892B0] mb-8">
          <Link to="/shop" className="hover:text-white transition-colors">Boutique</Link>
          <ChevronRight size={14} />
          <span className="text-white truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Gallery */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-square bg-[#0C0E18] rounded-[2rem] overflow-hidden border border-white/10 relative group"
            >
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-30">
                  <ShoppingBag className="w-16 h-16 text-white/40" />
                </div>
              )}
              
              {product.stock === 0 && (
                <div className="absolute top-6 left-6">
                  <Badge color="red" className="bg-red-500 text-white border-none px-4 py-2 text-sm font-bold">RUPTURE</Badge>
                </div>
              )}
            </motion.div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === idx ? "border-[#7B2FFF]" : "border-white/10 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#7B2FFF] bg-[#7B2FFF]/10 px-3 py-1 rounded-full border border-[#7B2FFF]/20">
                  {product.collab || <><span className="font-days-one tracking-normal">MMA IQ</span> Official</>}
                </span>
                {product.category && (
                  <span className="text-xs font-bold uppercase tracking-widest text-[#8892B0] bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {product.category}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-4 leading-tight">{product.name}</h1>
              <div className="text-3xl font-display text-[#7B2FFF]">
                {(product.price_cents / 100).toFixed(2)} €
              </div>
            </div>

            <div className="space-y-8 mb-10">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-[#8892B0] leading-relaxed">
                  {product.description}
                </p>
                {product.long_description && (
                  <p className="text-[#8892B0] mt-4">
                    {product.long_description}
                  </p>
                )}
              </div>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold uppercase tracking-widest text-[#8892B0]">Taille</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[50px] h-[50px] flex items-center justify-center rounded-xl font-bold transition-all border ${
                          selectedSize === size 
                            ? "bg-[#7B2FFF] border-[#7B2FFF] text-white shadow-[0_0_20px_rgba(123,47,255,0.4)]" 
                            : "bg-[#0C0E18] border-white/10 text-[#8892B0] hover:border-[#7B2FFF]/50"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-[#8892B0]">Quantité</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-[#0C0E18] border border-white/10 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white/5 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 h-12 flex items-center justify-center font-bold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white/5 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-sm">
                    {product.stock > 0 ? (
                      <span className={product.stock < 5 ? "text-orange-500 font-bold" : "text-green-500"}>
                        {product.stock < 5 ? `Plus que ${product.stock} en stock !` : "En stock"}
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold">Rupture de stock</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <Button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full py-6 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 bg-[#7B2FFF] hover:bg-[#8f4dff] shadow-[0_10px_30px_-10px_rgba(123,47,255,0.5)] disabled:opacity-50 disabled:hover:bg-[#7B2FFF]"
              >
                <ShoppingBag size={20} />
                {product.stock === 0 ? "Rupture de stock" : "Ajouter au panier"}
              </Button>
              
              <div className="flex items-center justify-center gap-3 pt-8 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#7B2FFF]">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-xs uppercase tracking-widest text-[#8892B0] font-bold">Paiement sécurisé via Stripe</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

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
