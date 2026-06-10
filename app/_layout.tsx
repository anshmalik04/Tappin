import { API_BASE_URL } from '@/constants/config';
import { CheckInProvider } from '@/context/CheckInContext';
import { GEOFENCE_TASK } from '@/services/geofencing';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as TaskManager from 'expo-task-manager';
import { useEffect } from 'react';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

// Define the background geofence task — must be at root level outside any component
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }

  if (data) {
    const { eventType, region } = data;

    // identifier format: venueId_checkInId
    const parts = region.identifier.split('_');
    const venueId = parts[0];
    const checkInId = parts[1];

    const type =
      eventType === Location.GeofencingEventType.Enter
        ? 'geofence_entry'
        : 'geofence_exit';

    try {
      await fetch(`${API_BASE_URL}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, check_in_id: checkInId, venue_id: venueId }),
      });
      console.log(`Geofence ${type} fired for venue ${venueId}, checkIn ${checkInId}`);
    } catch (err) {
      console.error('Geofence API call failed:', err);
    }
  }
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <CheckInProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="venue/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="auth/phone"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/otp"
          options={{ headerShown: false }}
        />
      </Stack>
    </CheckInProvider>
  );
}