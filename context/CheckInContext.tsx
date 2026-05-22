import React, { createContext, useContext, useState, ReactNode } from 'react';

const MAX_CHECKINS = 3;

interface CheckInContextType {
  checkedInVenues: string[];
  checkInCount: number;
  isCheckedIn: (venueId: string) => boolean;
  toggleCheckIn: (venueId: string) => void;
  canCheckIn: boolean;
}

const CheckInContext = createContext<CheckInContextType>({
  checkedInVenues: [],
  checkInCount: 0,
  isCheckedIn: () => false,
  toggleCheckIn: () => {},
  canCheckIn: true,
});

export function CheckInProvider({ children }: { children: ReactNode }) {
  const [checkedInVenues, setCheckedInVenues] = useState<string[]>([]);

  const isCheckedIn = (venueId: string) => checkedInVenues.includes(venueId);

  const toggleCheckIn = (venueId: string) => {
    setCheckedInVenues((prev) => {
      if (prev.includes(venueId)) {
        return prev.filter((id) => id !== venueId);
      }
      if (prev.length >= MAX_CHECKINS) return prev;
      return [...prev, venueId];
    });
  };

  return (
    <CheckInContext.Provider
      value={{
        checkedInVenues,
        checkInCount: checkedInVenues.length,
        isCheckedIn,
        toggleCheckIn,
        canCheckIn: checkedInVenues.length < MAX_CHECKINS,
      }}
    >
      {children}
    </CheckInContext.Provider>
  );
}

export function useCheckIn() {
  return useContext(CheckInContext);
}
