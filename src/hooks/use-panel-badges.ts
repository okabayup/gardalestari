
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getPendingVerificationCount } from '@/app/actions/members';
import { useAuth } from './use-auth';

interface PanelBadgesContextType {
  badges: {
    pendingMembers: number;
  };
  refreshBadges: () => void;
}

const PanelBadgesContext = createContext<PanelBadgesContextType | undefined>(undefined);

export const PanelBadgesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState({ pendingMembers: 0 });

  const fetchBadges = async () => {
    if (!user) return;
    try {
      const pendingCount = await getPendingVerificationCount();
      setBadges({ pendingMembers: pendingCount });
    } catch (error) {
      console.error("Failed to fetch panel badges:", error);
    }
  };

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000); // Poll every minute
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <PanelBadgesContext.Provider value={{ badges, refreshBadges: fetchBadges }}>
      {children}
    </PanelBadgesContext.Provider>
  );
};

export const usePanelBadges = () => {
  const context = useContext(PanelBadgesContext);
  if (context === undefined) {
    throw new Error('usePanelBadges must be used within a PanelBadgesProvider');
  }
  return context;
};
