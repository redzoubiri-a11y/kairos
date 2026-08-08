import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export function useLocation({ autoRequest = true } = {}) {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | granted | denied | error
  const [error, setError] = useState(null);

  const request = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') {
        setStatus('denied');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(next);
      setStatus('granted');
      return next;
    } catch (err) {
      setError(err.message);
      setStatus('error');
      return null;
    }
  }, []);

  useEffect(() => {
    if (autoRequest) request();
  }, [autoRequest, request]);

  return { coords, status, error, request };
}

// Streams the device position while a transporter is on the road.
export function useLocationWatcher(enabled, onPosition, { distanceInterval = 150 } = {}) {
  useEffect(() => {
    if (!enabled) return undefined;

    let subscription;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval, timeInterval: 20000 },
        (position) => {
          onPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, onPosition, distanceInterval]);
}
