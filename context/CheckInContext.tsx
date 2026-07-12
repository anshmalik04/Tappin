import { cancelCheckIn, createCheckIn, getActiveCheckIns } from '@/services/api';
import { registerGeofence, removeGeofence } from '@/services/geofencing';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const MAX_CHECKINS = 3;

interface CheckIn {
  checkInId: string;
  venueId: string;
  lat: number;
  lng: number;
}

interface CheckInContextType {
  checkedInVenues: string[];
  checkIns: CheckIn[];
  checkInCount: number;
  isCheckedIn: (venueId: string) => boolean;
  toggleCheckIn: (venueId: string, lat: number, lng: number, name?: string, address?: string, type?: string) => Promise<void>;
  canCheckIn: boolean;
  loading: boolean;
  error: string | null;
}

const CheckInContext = createContext<CheckInContextType>({
  checkedInVenues: [],
  checkIns: [],
  checkInCount: 0,
  isCheckedIn: () => false,
  toggleCheckIn: async () => {},
  canCheckIn: true,
  loading: false,
  error: null,
});

export function CheckInProvider({ children }: { children: ReactNode }) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActiveCheckIns = async () => {
      try {
        const data = await getActiveCheckIns();
        if (data?.checkIns) {
          setCheckIns(data.checkIns.map((c: any) => ({
            checkInId: c.id,
            venueId: c.venue_id,
            lat: parseFloat(c.lat),
            lng: parseFloat(c.lng),
          })));
        }
      } catch (err) {
        console.log('Could not load active check-ins:', err);
      }
    };
    loadActiveCheckIns();
  }, []);

  const isCheckedIn = (venueId: string) =>
    checkIns.some((c) => c.venueId === venueId);

  const toggleCheckIn = async (
    venueId: string,
    lat: number,
    lng: number,
    name = '',
    address = '',
    type = 'bar'
  ) => {
    const existing = checkIns.find((c) => c.venueId === venueId);

    if (existing) {
      setLoading(true);
      setError(null);
      try {
        await cancelCheckIn(existing.checkInId);
        await removeGeofence(venueId);
        setCheckIns((prev) => prev.filter((c) => c.venueId !== venueId));
      } catch (err: any) {
        setError(err.message || 'Failed to cancel check-in');
      } finally {
        setLoading(false);
      }
    } else {
      if (checkIns.length >= MAX_CHECKINS) {
        setError('You can only check in to 3 venues at a time');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await createCheckIn(venueId, lat, lng, name, address, type);
        const newCheckIn: CheckIn = {
          checkInId: data.checkIn.id,
          venueId,
          lat,
          lng,
        };
        setCheckIns((prev) => [...prev, newCheckIn]);
        await registerGeofence(newCheckIn.checkInId, venueId, lat, lng, 150);
      } catch (err: any) {
        setError(err.message || 'Failed to check in');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <CheckInContext.Provider
      value={{
        checkedInVenues: checkIns.map((c) => c.venueId),
        checkIns,
        checkInCount: checkIns.length,
        isCheckedIn,
        toggleCheckIn,
        canCheckIn: checkIns.length < MAX_CHECKINS,
        loading,
        error,
      }}
    >
      {children}
    </CheckInContext.Provider>
  );
}

export function useCheckIn() {
  return useContext(CheckInContext);
}