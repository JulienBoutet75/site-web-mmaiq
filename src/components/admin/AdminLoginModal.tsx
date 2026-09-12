import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Compatibilité avec l'ancien événement : tous les accès passent désormais
// par l'authentification et les contrôles de rôle de l'espace administrateur.
export function AdminLoginModal() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleOpen = () => navigate('/connexion?redirect=/admin');
    window.addEventListener('open-admin-login', handleOpen);
    return () => window.removeEventListener('open-admin-login', handleOpen);
  }, [navigate]);
  return null;
}
