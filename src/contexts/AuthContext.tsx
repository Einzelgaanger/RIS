import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  canViewPricing: (type: 'individual' | 'release' | 'margin' | 'total') => boolean;
  canManageResources: () => boolean;
  canCreateOpportunities: () => boolean;
  canViewAnalytics: () => boolean;
  canUploadProposals: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials for POC
const credentials: Record<string, { password: string; userId: string }> = {
  'admin@gvts.com': { password: 'admin123', userId: 'admin-1' },
  'manager@riby.com': { password: 'manager123', userId: 'manager-1' },
  'professional@vgg.com': { password: 'pro123', userId: 'pro-1' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const cred = credentials[email.toLowerCase()];
    
    if (cred && cred.password === password) {
      const foundUser = mockUsers.find(u => u.id === cred.userId);
      if (foundUser) {
        setUser(foundUser);
        return true;
      }
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  // Pricing visibility based on role
  const canViewPricing = useCallback((type: 'individual' | 'release' | 'margin' | 'total'): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'gvts_admin':
        return true; // Can see everything
      case 'vgg_manager':
        return type === 'individual' || type === 'release'; // Can see individual and release fees
      case 'professional':
        return type === 'individual'; // Can only see individual rate
      default:
        return false;
    }
  }, [user]);

  const canManageResources = useCallback((): boolean => {
    return user?.role === 'gvts_admin';
  }, [user]);

  const canCreateOpportunities = useCallback((): boolean => {
    return user?.role === 'gvts_admin';
  }, [user]);

  const canViewAnalytics = useCallback((): boolean => {
    return user?.role === 'gvts_admin' || user?.role === 'vgg_manager';
  }, [user]);

  const canUploadProposals = useCallback((): boolean => {
    return user?.role === 'gvts_admin';
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        canViewPricing,
        canManageResources,
        canCreateOpportunities,
        canViewAnalytics,
        canUploadProposals,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
