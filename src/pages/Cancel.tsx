import React from "react";
import { Link } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { motion } from "motion/react";

export function Cancel() {
  return (
    <div className="min-h-screen bg-[#04050A] text-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0C0E18] border border-red-500/30 rounded-[2rem] p-10 text-center shadow-[0_0_50px_rgba(255,0,0,0.1)]"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <XCircle size={40} />
        </div>
        <h1 className="text-3xl font-display mb-4">Paiement annulé</h1>
        <p className="text-[#8892B0] mb-8 leading-relaxed">
          Le processus de paiement a été interrompu. Aucune somme n'a été débitée. 
          Si vous avez rencontré un problème, n'hésitez pas à nous contacter.
        </p>
        <div className="space-y-4">
          <Link to="/shop">
            <Button className="w-full py-4 rounded-xl bg-[#7B2FFF] hover:bg-[#8f4dff] flex items-center justify-center gap-2">
              Retour à la boutique
              <ArrowLeft size={18} />
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
