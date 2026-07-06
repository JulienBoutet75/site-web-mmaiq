import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { motion } from "motion/react";

export function Success() {
  return (
    <div className="min-h-screen bg-[#04050A] text-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0C0E18] border border-[#7B2FFF]/30 rounded-[2rem] p-10 text-center shadow-[0_0_50px_rgba(123,47,255,0.2)]"
      >
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-display mb-4">Paiement réussi !</h1>
        <p className="text-[#8892B0] mb-8 leading-relaxed">
          Merci pour votre achat. Votre commande a été traitée avec succès. 
          Vous recevrez un e-mail de confirmation sous peu.
        </p>
        <div className="space-y-4">
          <Link to="/instructional">
            <Button className="w-full py-4 rounded-xl bg-[#7B2FFF] hover:bg-[#8f4dff] flex items-center justify-center gap-2">
              Accéder à mes formations
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full py-4 rounded-xl border-white/10 hover:bg-white/5">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
