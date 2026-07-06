import React, { useState } from 'react';
import { useSite } from '../../context/SiteContext';
import { motion, AnimatePresence } from 'motion/react';

export function AdminLoginModal() {
  const { isAdmin, setIsAdmin } = useSite();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Expose open method globally or via context?
  // Actually, the prompt says "Au clic sur 'Admin' -> modal centré".
  // We can just render this modal conditionally based on a local state,
  // but we need a way to trigger it from the footer.
  // Let's add an event listener for a custom event.
  
  React.useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-admin-login', handleOpen);
    return () => window.removeEventListener('open-admin-login', handleOpen);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'mmaiq2026YannJohnny') {
      setIsAdmin(true);
      setIsOpen(false);
      setPassword('');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  if (!isOpen || isAdmin) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, x: error ? [-10, 10, -10, 10, 0] : 0 }}
          transition={{ duration: error ? 0.4 : 0.2 }}
          className="relative w-full max-w-[400px] bg-[#111120] border border-[#1e1e34] rounded-[20px] p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 className="font-days-one text-[22px] text-white mb-2">MMA IQ Admin</h2>
            <p className="font-bai-jamjuree text-[14px] text-gray-400">Espace réservé · Entrez le code d'accès</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Code d'accès..."
                className={`w-full bg-black/50 border ${error ? 'border-red-500' : 'border-[#1e1e34] focus:border-purple-500'} rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors`}
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-2">Code incorrect</p>}
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20"
            >
              Accéder
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
