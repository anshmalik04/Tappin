import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const GEOFENCE_TASK = 'TAPPIN_GEOFENCE_TASK';
const GEOFENCE_RADIUS_METERS = 150;

// Register a geofence when a user checks in to a venue
export async function registerGeofence(checkInId, venueId, lat, lng, radiusMeters = GEOFENCE_RADIUS_METERS) {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Background location permission not granted — geofence not registered');
      return false;
    }

    await Location.startGeofencingAsync(GEOFENCE_TASK, [
      {
        identifier: `${venueId}_${checkInId}`,
        latitude: lat,
        longitude: lng,
        radius: radiusMeters,
        notifyOnEnter: true,
        notifyOnExit: true,
      },
    ]);

    console.log(`Geofence registered for venue ${venueId}, checkIn ${checkInId}`);
    return true;
  } catch (error) {
    console.error('registerGeofence error:', error);
    return false;
  }
}

// Remove geofence for a specific venue when check-in expires
export async function removeGeofence(venueId) {
  try {
    const regions = await Location.getGeofencingRegionsAsync(GEOFENCE_TASK);
    const toKeep = regions.filter(r => !r.identifier.startsWith(`${venueId}_`));

    if (toKeep.length === regions.length) return; // nothing to remove

    await Location.stopGeofencingAsync(GEOFENCE_TASK);

    if (toKeep.length > 0) {
      await Location.startGeofencingAsync(GEOFENCE_TASK, toKeep);
    }

    console.log(`Geofence removed for venue ${venueId}`);
  } catch (error) {
    console.error('removeGeofence error:', error);
  }
}

// Remove all geofences — call this on logout
export async function removeAllGeofences() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
      console.log('All geofences removed');
    }
  } catch (error) {
    console.error('removeAllGeofences error:', error);
  }
}