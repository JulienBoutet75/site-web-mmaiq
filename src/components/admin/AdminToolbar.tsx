import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/adminContext';
import { FolderOpen, Save, Undo2, LogOut, Shield, Eye, ShieldCheck } from 'lucide-react';

export function AdminToolbar() {
  const { isAdmin, signOut } = useAuth();
  const { saveData, revertData, setIsMediathequeOpen } = useSite();
  const { adminMode, setAdminMode } = useAdmin();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isAdmin) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveData();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = async () => {
    await revertData();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] h-[56px] bg-[#0a0a16]/80 backdrop-blur-[12px] border-t-2 border-[var(--color-accent-primary)] px-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(123,47,255,0.1)]">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
        </div>
        <span className="text-purple-400 font-bold tracking-wider text-sm">MODE ÉDITION</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/admin"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-accent-primary)] to-[#6d13a6] hover:from-[var(--color-violet-400)] hover:to-[#7d23b6] text-white text-sm rounded-full font-bold transition-all shadow-[0_0_15px_rgba(123,47,255,0.4)] hover:shadow-[0_0_25px_rgba(123,47,255,0.6)] hover:-translate-y-0.5"
        >
          <ShieldCheck size={18} />
          Mode Super Admin
        </Link>

        <button
          onClick={() => setIsMediathequeOpen(true)}
          className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-purple-500/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <FolderOpen size={16} />
          Médiathèque
        </button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            saved ? 'text-green-400 bg-green-400/10' : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
          }`}
        >
          <Save size={16} />
          {isSaving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
        </button>

        <button
          onClick={handleRevert}
          className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-purple-500/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Undo2 size={16} />
          Annuler
        </button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        <button
          onClick={signOut}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
