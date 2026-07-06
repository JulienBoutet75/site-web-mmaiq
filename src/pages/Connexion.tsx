import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, resetPassword, getProfile, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export function Connexion() {
  const [loginMode, setLoginMode] = useState<'admin' | 'coach'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { setAuthState } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (loginMode === 'coach') {
        if (!accessKey.trim()) {
          throw new Error("Veuillez entrer votre clé d'accès");
        }
        
        const { data, error } = await supabase
          .from('coaches')
          .select('id, profile_id, name, slug')
          .eq('access_key', accessKey.trim().toUpperCase())
          .single();
          
        if (error || !data) {
          throw new Error("Clé invalide ou inexistante");
        }
        
        // Store coach info in localStorage as requested
        const coachSession = { 
          coachId: data.id, 
          profileId: data.profile_id, 
          name: data.name, 
          slug: data.slug, 
          role: 'coach' 
        };
        localStorage.setItem('coach_session', JSON.stringify(coachSession));
        
        setAuthState({
          user: null,
          profile: null,
          accessToken: null,
          coachSession,
          loading: false,
        });
        
        // Redirect to /coach/dashboard as requested
        navigate('/coach/dashboard');
        return;
      }

      let loginEmail = email;
      let loginPassword = password;

      const data = await signIn(loginEmail, loginPassword);
      if (data.session?.access_token && data.user) {
        localStorage.setItem('sb_access_token', data.session.access_token);
        const profile = await getProfile(data.user.id, data.session.access_token);
        
        setAuthState({
          user: data.user,
          profile: profile,
          accessToken: data.session.access_token,
          coachSession: null,
          loading: false,
        });

        // Redirect based on role
        if (profile?.role === 'super_admin' || (import.meta.env.VITE_ADMIN_EMAIL && data.user.email === import.meta.env.VITE_ADMIN_EMAIL)) {
          navigate('/admin');
        } else if (profile?.role === 'coach' || loginMode === 'coach') {
          navigate('/coach');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      if (loginMode === 'coach') {
        setError("Clé d'accès invalide");
      } else {
        setError(err.message || "Email ou mot de passe incorrect");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await resetPassword(email);
      setSuccess("Un lien de réinitialisation a été envoyé à votre adresse email.");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi du lien");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04050A] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0C0E18] border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="relative text-center mb-8">
          <Link to="/" className="absolute left-0 top-0 text-[#8892B0] hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link to="/" className="inline-block mb-4">
            <h1 className="font-display text-2xl text-white tracking-tighter">
              <span className="font-days-one tracking-normal">MMA IQ</span> <span className="text-[#7B2FFF]">ACADEMY</span>
            </h1>
          </Link>
          <p className="text-[#8892B0] font-ui">
            {isResetMode ? "Réinitialiser votre mot de passe" : "Connectez-vous à votre espace"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[#FF1744] text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm text-center">
            {success}
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex bg-[#0C0E18] border border-white/10 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setLoginMode('admin')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginMode === 'admin' ? 'bg-[#7B2FFF] text-white' : 'text-[#8892B0] hover:text-white'}`}
              >
                Administration
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('coach')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginMode === 'coach' ? 'bg-[#7B2FFF] text-white' : 'text-[#8892B0] hover:text-white'}`}
              >
                Accès Coach
              </button>
            </div>

            {loginMode === 'admin' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#8892B0] mb-2 ml-1">Email</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0C0E18] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7B2FFF] transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8892B0] mb-2 ml-1">Mot de passe</label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0C0E18] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7B2FFF] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <div className="text-right">
                  <button 
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-sm text-[#7B2FFF] hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#8892B0] mb-2 ml-1">Clé d'accès Coach</label>
                <input 
                  type="text"
                  required
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                  className="w-full bg-[#0C0E18] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7B2FFF] transition-colors font-ui tracking-widest uppercase"
                  placeholder="EX: A7B9X2Y4"
                />
                <p className="text-xs text-[#8892B0] mt-2 ml-1">
                  Entrez la clé d'accès fournie par l'administrateur.
                </p>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#7B2FFF] hover:bg-[#8f4dff] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(123,47,255,0.3)] mt-4"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8892B0] mb-2 ml-1">Email</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0C0E18] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7B2FFF] transition-colors"
                placeholder="votre@email.com"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#7B2FFF] hover:bg-[#8f4dff] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(123,47,255,0.3)]"
            >
              {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
            </button>
            <button 
              type="button"
              onClick={() => setIsResetMode(false)}
              className="w-full text-sm text-[#8892B0] hover:text-white transition-colors"
            >
              ← Retour à la connexion
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
