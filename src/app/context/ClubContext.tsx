import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContext } from './AuthContext';

interface Club {
  _id: string;
  name?: string;
  address: string;
  phone?: string;
}

interface ClubContextType {
  selectedClub: string;
  setSelectedClub: (id: string) => void;
  clubs: Club[];
  setClubs: (clubs: Club[]) => void;
  selectedClubName: string;
  canSwitchClub: boolean;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: ReactNode }) {
  const [selectedClub, setSelectedClub] = useState('all');
  const [clubs, setClubs] = useState<Club[]>([]);
  const auth = useContext(AuthContext);

  const user = auth ? auth.user : null;

  useEffect(() => {
    if (user && user.isStaff && !user.isAdmin && user.locationId) {
      setSelectedClub(user.locationId);
    }
  }, [user]);

  const canSwitchClub = !user || !user.isStaff || user.isAdmin;

  const selectedClubName = selectedClub === 'all'
    ? 'Tất cả câu lạc bộ'
    : clubs.find(c => c._id === selectedClub)?.address || 'Đã chọn';

  return (
    <ClubContext.Provider value={{ selectedClub, setSelectedClub, clubs, setClubs, selectedClubName, canSwitchClub }}>
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (context === undefined) throw new Error('useClub must be used within a ClubProvider');
  return context;
}