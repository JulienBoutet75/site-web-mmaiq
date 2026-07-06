import React, { createContext, useContext, useState } from 'react';

type AdminMode = 'super_admin' | 'admin_view' | 'user';

interface AdminContextType {
  adminMode: AdminMode;
  setAdminMode: (mode: AdminMode) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminMode, setAdminMode] = useState<AdminMode>('super_admin');

  return (
    <AdminContext.Provider value={{ adminMode, setAdminMode }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
