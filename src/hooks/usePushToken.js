import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../../supabase';

export default function usePushToken(authUserId) {
  const [token,            setToken]            = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState(null);

  useEffect(() => {
    if (!authUserId || Platform.OS === 'web' || !Device.isDevice) return;

    let cancelled = false;

    async function register() {
      setLoading(true);
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          if (!cancelled) setPermissionGranted(false);
          return;
        }
        if (!cancelled) setPermissionGranted(true);

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        const { data: newToken } = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();

        if (cancelled || !newToken) return;

        // Only write if token changed
        const { data: row } = await supabase
          .from('users')
          .select('push_token')
          .eq('auth_id', authUserId)
          .maybeSingle();

        if (row?.push_token !== newToken) {
          await supabase
            .from('users')
            .update({ push_token: newToken })
            .eq('auth_id', authUserId);
        }

        if (!cancelled) setToken(newToken);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    register();
    return () => { cancelled = true; };
  }, [authUserId]);

  return { token, permissionGranted, loading, error };
}
